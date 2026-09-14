const express = require("express");
const { getAuth } = require("@clerk/express");
const pool = require("../db");

const router = express.Router();

const defaultDictationTypes = [
    "Ritmico",
    "Melodico",
    "Armonico"
];

const defaultCategories = [
    ["rhythmic", "Ritmico", "Metrica"],
    ["rhythmic", "Ritmico", "Pause"],
    ["rhythmic", "Ritmico", "Gruppi irregolari"],
    ["melodic", "Melodico", "Tonalità"],
    ["melodic", "Melodico", "Ritmo"],
    ["melodic", "Melodico", "Intervalli"],
    ["melodic", "Melodico", "Modulazioni"],
    ["harmonic", "Armonico", "Basso"],
    ["harmonic", "Armonico", "Soprano"],
    ["harmonic", "Armonico", "Accordi"]
];

router.get("/", async function (request, response) {
    const auth = getAuth(request);

    if (!auth.isAuthenticated) {
        return response.status(401).json({
            error: "Utente non autenticato"
        });
    }

    try {
        const settingsResult = await pool.query(
            `
            SELECT categories_initialized
            FROM user_settings
            WHERE user_id = $1
            `,
            [auth.userId]
        );

        const categoriesInitialized =
            settingsResult.rows[0]?.categories_initialized;

        if (!categoriesInitialized) {
            await pool.query(
                `
                INSERT INTO dictation_types (
                    name,
                    user_id,
                    is_default
                )
                SELECT type_name, $1, TRUE
                FROM UNNEST($2::text[]) AS type_name
                ON CONFLICT DO NOTHING
                `,
                [
                    auth.userId,
                    defaultDictationTypes
                ]
            );

            for (
                const [
                    legacyType,
                    dictationTypeName,
                    categoryName
                ] of defaultCategories
            ) {
                await pool.query(
                    `
                    INSERT INTO categories (
                        type,
                        name,
                        user_id,
                        dictation_type_id
                    )
                    SELECT
                        $1,
                        $2,
                        $3,
                        dictation_types.id
                    FROM dictation_types
                    WHERE dictation_types.user_id = $3
                    AND dictation_types.name = $4
                    `,
                    [
                        legacyType,
                        categoryName,
                        auth.userId,
                        dictationTypeName
                    ]
                );
            }

            await pool.query(
                `
                INSERT INTO user_settings (
                    user_id,
                    categories_initialized,
                    dictation_types_initialized
                )
                VALUES ($1, TRUE, TRUE)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    categories_initialized = TRUE,
                    dictation_types_initialized = TRUE
                `,
                [auth.userId]
            );
        }

        const result = await pool.query(
            `
            SELECT
                id,
                name,
                user_id,
                dictation_type_id
            FROM categories
            WHERE user_id = $1
            ORDER BY dictation_type_id, id
            `,
            [auth.userId]
        );

        response.json(result.rows);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante il recupero delle categorie"
        });
    }
});

router.post("/", async function (request, response) {
    const auth = getAuth(request);

    if (!auth.isAuthenticated) {
        return response.status(401).json({
            error: "Utente non autenticato"
        });
    }

    const {
        dictationTypeId,
        name
    } = request.body;

    const parsedDictationTypeId =
        Number(dictationTypeId);

    if (
        !Number.isInteger(parsedDictationTypeId) ||
        parsedDictationTypeId <= 0
    ) {
        return response.status(400).json({
            error: "Tipo di dettato non valido"
        });
    }

    if (
        typeof name !== "string" ||
        name.trim() === "" ||
        name.trim().length > 255
    ) {
        return response.status(400).json({
            error: "Nome della categoria non valido"
        });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO categories (
                type,
                name,
                user_id,
                dictation_type_id
            )
            SELECT
                dictation_types.name,
                $1,
                $2,
                dictation_types.id
            FROM dictation_types
            WHERE dictation_types.id = $3
            AND dictation_types.user_id = $2
            RETURNING
                id,
                name,
                user_id,
                dictation_type_id
            `,
            [
                name.trim(),
                auth.userId,
                parsedDictationTypeId
            ]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                error: "Tipo di dettato non trovato"
            });
        }

        response.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante il salvataggio della categoria"
        });
    }
});

router.delete("/:id", async function (request, response) {
    const auth = getAuth(request);

    if (!auth.isAuthenticated) {
        return response.status(401).json({
            error: "Utente non autenticato"
        });
    }

    const categoryId = Number(request.params.id);

    if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
    ) {
        return response.status(400).json({
            error: "ID della categoria non valido"
        });
    }

    try {
        const result = await pool.query(
            `
            DELETE FROM categories
            WHERE id = $1
            AND user_id = $2
            RETURNING
                id,
                name,
                user_id,
                dictation_type_id
            `,
            [
                categoryId,
                auth.userId
            ]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                error: "Categoria non trovata"
            });
        }

        response.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante la cancellazione della categoria"
        });
    }
});

module.exports = router;