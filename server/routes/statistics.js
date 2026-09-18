const express = require("express");
const { getAuth } = require("@clerk/express");
const pool = require("../db");
const {
    generatePracticeInsight
} = require("../services/gemini");

const router = express.Router();

const validPeriods = new Set([
    "current-month",
    "previous-month",
    "3-months",
    "6-months",
    "all",
    "custom"
]);

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function startOfMonth(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function addMonths(date, amount) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

function isValidDateString(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) && formatDate(date) === value;
}

function resolvePeriod(period, from, to, today = new Date()) {
    const currentMonthStart = startOfMonth(today);

    if (period === "current-month") {
        return {
            from: formatDate(currentMonthStart),
            to: formatDate(today)
        };
    }

    if (period === "previous-month") {
        const previousMonth = addMonths(currentMonthStart, -1);

        return {
            from: formatDate(previousMonth),
            to: formatDate(endOfMonth(previousMonth))
        };
    }

    if (period === "3-months") {
        return {
            from: formatDate(addMonths(currentMonthStart, -2)),
            to: formatDate(today)
        };
    }

    if (period === "6-months") {
        return {
            from: formatDate(addMonths(currentMonthStart, -5)),
            to: formatDate(today)
        };
    }

    if (period === "all") {
        return {
            from: null,
            to: null
        };
    }

    if (!isValidDateString(from) || !isValidDateString(to)) {
        return {
            error: "Le date from e to sono obbligatorie e devono usare il formato YYYY-MM-DD"
        };
    }

    if (from > to) {
        return {
            error: "La data iniziale non può essere successiva alla data finale"
        };
    }

    return { from, to };
}

function getMonthKey(dateValue) {
    return String(dateValue).slice(0, 7);
}

function isPartialMonth(month, period, from, to, today) {
    const monthDate = new Date(`${month}-01T00:00:00.000Z`);
    const monthStart = formatDate(startOfMonth(monthDate));
    const monthEnd = formatDate(endOfMonth(monthDate));
    const currentMonth = formatDate(startOfMonth(today)).slice(0, 7);

    if (month === currentMonth && formatDate(today) < monthEnd) {
        return true;
    }

    if (period !== "custom") {
        return false;
    }

    return (
        (from.startsWith(month) && from !== monthStart) ||
        (to.startsWith(month) && to !== monthEnd)
    );
}

function buildMonthlyResults(rows, period, from, to, today) {
    if (rows.length === 0 && (!from || !to)) {
        return [];
    }

    const firstDate = from;
    const lastDate = to;
    const firstMonth = startOfMonth(new Date(`${firstDate}T00:00:00.000Z`));
    const lastMonth = startOfMonth(new Date(`${lastDate}T00:00:00.000Z`));

    const rowsByMonth = new Map(
        rows.map(row => [getMonthKey(row.month), row])
    );

    const months = [];

    for (
        let monthDate = firstMonth;
        monthDate <= lastMonth;
        monthDate = addMonths(monthDate, 1)
    ) {
        const month = formatDate(monthDate).slice(0, 7);
        const row = rowsByMonth.get(month);
        const evaluatedCategories = row
            ? Number(row.evaluated_categories)
            : 0;
        const correctCategories = row
            ? Number(row.correct_categories)
            : 0;

        months.push({
            month,
            totalDictations: row ? Number(row.total_dictations) : 0,
            evaluatedCategories,
            correctCategories,
            accuracy: evaluatedCategories > 0
                ? Number((correctCategories / evaluatedCategories * 100).toFixed(1))
                : null,
            differenceFromPreviousMonth: null,
            isPartial: isPartialMonth(
                month,
                period,
                firstDate,
                lastDate,
                today
            )
        });
    }

    for (let index = 1; index < months.length; index++) {
        const current = months[index];
        const previous = months[index - 1];

        if (
            current.accuracy !== null &&
            previous.accuracy !== null &&
            !current.isPartial &&
            !previous.isPartial
        ) {
            current.differenceFromPreviousMonth = Number(
                (current.accuracy - previous.accuracy).toFixed(1)
            );
        }
    }

    return months;
}

router.get("/report", async function (request, response) {
    const auth = getAuth(request);

    if (!auth.isAuthenticated) {
        return response.status(401).json({
            error: "Utente non autenticato"
        });
    }

    const period = request.query.period || "6-months";

    if (!validPeriods.has(period)) {
        return response.status(400).json({
            error: "Periodo non valido"
        });
    }

    const resolvedPeriod = resolvePeriod(
        period,
        request.query.from,
        request.query.to
    );

    if (resolvedPeriod.error) {
        return response.status(400).json({
            error: resolvedPeriod.error
        });
    }

    let collection = null;

    if (request.query.collection !== undefined) {
        if (
            typeof request.query.collection !== "string" ||
            request.query.collection.trim() === "" ||
            request.query.collection.trim().length > 255
        ) {
            return response.status(400).json({
                error: "Raccolta non valida"
            });
        }

        collection = request.query.collection.trim();
    }

    let dictationTypeId = null;

    if (request.query.dictationTypeId !== undefined) {
        dictationTypeId = Number(request.query.dictationTypeId);

        if (!Number.isInteger(dictationTypeId) || dictationTypeId <= 0) {
            return response.status(400).json({
                error: "Tipo di dettato non valido"
            });
        }
    }

    const parameters = [
        auth.userId,
        resolvedPeriod.from,
        resolvedPeriod.to,
        collection,
        dictationTypeId
    ];

    const filteredDictations = `
        SELECT
            d.*,
            cardinality(
                COALESCE(d.available_categories, ARRAY[]::text[])
            ) AS evaluated_count,
            (
                SELECT COUNT(*)::integer
                FROM unnest(
                    COALESCE(d.available_categories, ARRAY[]::text[])
                ) AS available_category
                WHERE available_category = ANY(
                    COALESCE(d.correct_categories, ARRAY[]::text[])
                )
            ) AS correct_count
        FROM dictations d
        WHERE d.user_id = $1
        AND ($2::date IS NULL OR d.date >= $2::date)
        AND ($3::date IS NULL OR d.date <= $3::date)
        AND ($4::text IS NULL OR d.collection = $4)
        AND ($5::integer IS NULL OR d.dictation_type_id = $5)
    `;

    try {
        const [
            summaryResult,
            monthlyResult,
            typesResult,
            categoriesResult
        ] = await Promise.all([
            pool.query(
                `
                WITH filtered AS (
                    ${filteredDictations}
                )
                SELECT
                    COUNT(*)::integer AS total_dictations,
                    COALESCE(SUM(evaluated_count), 0)::integer
                        AS evaluated_categories,
                    COALESCE(SUM(correct_count), 0)::integer
                        AS correct_categories,
                    MIN(date) AS first_date,
                    MAX(date) AS last_date
                FROM filtered
                `,
                parameters
            ),
            pool.query(
                `
                WITH filtered AS (
                    ${filteredDictations}
                )
                SELECT
                    date_trunc('month', date)::date AS month,
                    COUNT(*)::integer AS total_dictations,
                    COALESCE(SUM(evaluated_count), 0)::integer
                        AS evaluated_categories,
                    COALESCE(SUM(correct_count), 0)::integer
                        AS correct_categories
                FROM filtered
                GROUP BY month
                ORDER BY month
                `,
                parameters
            ),
            pool.query(
                `
                WITH filtered AS (
                    ${filteredDictations}
                )
                SELECT
                    filtered.dictation_type_id AS id,
                    COALESCE(
                        dictation_types.name,
                        filtered.type,
                        'Tipo sconosciuto'
                    ) AS name,
                    COUNT(*)::integer AS total_dictations,
                    COALESCE(SUM(filtered.evaluated_count), 0)::integer
                        AS evaluated_categories,
                    COALESCE(SUM(filtered.correct_count), 0)::integer
                        AS correct_categories
                FROM filtered
                LEFT JOIN dictation_types
                    ON dictation_types.id = filtered.dictation_type_id
                    AND dictation_types.user_id = filtered.user_id
                GROUP BY
                    filtered.dictation_type_id,
                    dictation_types.name,
                    filtered.type
                ORDER BY name
                `,
                parameters
            ),
            pool.query(
                `
                WITH filtered AS (
                    ${filteredDictations}
                )
                SELECT
                    available_category AS name,
                    COUNT(*)::integer AS attempts,
                    COUNT(*) FILTER (
                        WHERE available_category = ANY(
                            COALESCE(
                                filtered.correct_categories,
                                ARRAY[]::text[]
                            )
                        )
                    )::integer AS correct
                FROM filtered
                CROSS JOIN LATERAL unnest(
                    COALESCE(
                        filtered.available_categories,
                        ARRAY[]::text[]
                    )
                ) AS available_category
                GROUP BY available_category
                ORDER BY available_category
                `,
                parameters
            )
        ]);

        const summaryRow = summaryResult.rows[0];
        const evaluatedCategories = Number(
            summaryRow.evaluated_categories
        );
        const correctCategories = Number(
            summaryRow.correct_categories
        );

        const accuracy = evaluatedCategories > 0
            ? Number(
                (
                    correctCategories /
                    evaluatedCategories *
                    100
                ).toFixed(1)
            )
            : null;

        const effectiveFrom =
            resolvedPeriod.from ||
            summaryRow.first_date ||
            null;

        const effectiveTo =
            resolvedPeriod.to ||
            summaryRow.last_date ||
            null;

        const months = buildMonthlyResults(
            monthlyResult.rows,
            period,
            effectiveFrom,
            effectiveTo,
            new Date()
        );

        const types = typesResult.rows.map(row => {
            const evaluated = Number(row.evaluated_categories);
            const correct = Number(row.correct_categories);

            return {
                id: row.id,
                name: row.name,
                totalDictations: Number(row.total_dictations),
                evaluatedCategories: evaluated,
                correctCategories: correct,
                accuracy: evaluated > 0
                    ? Number((correct / evaluated * 100).toFixed(1))
                    : null
            };
        });

        const categories = categoriesResult.rows.map(row => {
            const attempts = Number(row.attempts);
            const correct = Number(row.correct);

            return {
                name: row.name,
                attempts,
                correct,
                accuracy: Number((correct / attempts * 100).toFixed(1)),
            };
        });

        const report = {
            period: {
                type: period,
                from: effectiveFrom,
                to: effectiveTo
            },
            summary: {
                totalDictations: Number(summaryRow.total_dictations),
                evaluatedCategories,
                correctCategories,
                accuracy
            },
            months,
            types,
            categories
        };

        const aiInsight =
            await generatePracticeInsight(report);

        response.json({
            ...report,
            aiInsight
        });
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante il recupero del report"
        });
    }
});

module.exports = router;