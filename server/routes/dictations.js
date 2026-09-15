const express = require("express");
const { getAuth } = require("@clerk/express");
const pool = require("../db");

const router = express.Router();

function isValidHttpUrl(value) {
    if (typeof value !== "string") {
        return false;
    }

    try {
        const url = new URL(value);

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );
    } catch {
        return false;
    }
}

router.get("/", async function (request, response) {
    const auth = getAuth(request);

    if (!auth.isAuthenticated) {
        return response.status(401).json({
            error: "Utente non autenticato"
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT
                dictations.*,
                dictation_types.name AS dictation_type_name
            FROM dictations
            LEFT JOIN dictation_types
                ON dictation_types.id =
                    dictations.dictation_type_id
                AND dictation_types.user_id =
                    dictations.user_id
            WHERE dictations.user_id = $1
            ORDER BY dictations.date DESC
            `,
            [auth.userId]
        );

        response.json(result.rows);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error:
                "Errore durante il recupero dei dettati"
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
        date,
        name,
        youtubeLink,
        dictationTypeId,
        collection,
        availableCategories,
        correctCategories
    } = request.body;

    if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        return response.status(400).json({
            error: "Data non valida"
        });
    }

    if (
        typeof name !== "string" ||
        name.trim() === "" ||
        name.trim().length > 100
    ) {
        return response.status(400).json({
            error: "Nome del dettato non valido"
        });
    }

    if (!isValidHttpUrl(youtubeLink)) {
        return response.status(400).json({
            error: "Link non valido"
        });
    }

    if (
        !Number.isInteger(dictationTypeId) ||
        dictationTypeId <= 0
    ) {
        return response.status(400).json({
            error: "Tipo di dettato non valido"
        });
    }

    if (
        collection !== null &&
        collection !== undefined &&
        typeof collection !== "string"
    ) {
        return response.status(400).json({
            error: "Raccolta non valida"
        });
    }

    if (
        typeof collection === "string" &&
        collection.trim().length > 100
    ) {
        return response.status(400).json({
            error:
                "Nome della raccolta troppo lungo"
        });
    }

    if (
        !Array.isArray(availableCategories) ||
        !availableCategories.every(
            category =>
                typeof category === "string"
        )
    ) {
        return response.status(400).json({
            error:
                "Categorie disponibili non valide"
        });
    }

    if (
        !Array.isArray(correctCategories) ||
        !correctCategories.every(
            category =>
                typeof category === "string"
        )
    ) {
        return response.status(400).json({
            error: "Categorie corrette non valide"
        });
    }

    const cleanCollection =
        typeof collection === "string" &&
            collection.trim() !== ""
            ? collection.trim()
            : null;

    try {
        const result = await pool.query(
            `
            INSERT INTO dictations (
                date,
                name,
                youtube_link,
                type,
                collection,
                available_categories,
                correct_categories,
                user_id,
                dictation_type_id
            )
            SELECT
                $1,
                $2,
                $3,
                CASE dictation_types.name
                    WHEN 'Ritmico' THEN 'rhythmic'
                    WHEN 'Melodico' THEN 'melodic'
                    WHEN 'Armonico' THEN 'harmonic'
                    ELSE LOWER(dictation_types.name)
                END,
                $5,
                $6,
                $7,
                $8,
                dictation_types.id
            FROM dictation_types
            WHERE dictation_types.id = $4
            AND dictation_types.user_id = $8
            RETURNING *
            `,
            [
                date,
                name.trim(),
                youtubeLink,
                dictationTypeId,
                cleanCollection,
                availableCategories,
                correctCategories,
                auth.userId
            ]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                error:
                    "Tipo di dettato non trovato"
            });
        }

        response.status(201).json(
            result.rows[0]
        );
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error:
                "Errore durante il salvataggio del dettato"
        });
    }
});

router.delete(
    "/:id",
    async function (request, response) {
        const auth = getAuth(request);

        if (!auth.isAuthenticated) {
            return response.status(401).json({
                error: "Utente non autenticato"
            });
        }

        const dictationId =
            Number(request.params.id);

        if (
            !Number.isInteger(dictationId) ||
            dictationId <= 0
        ) {
            return response.status(400).json({
                error:
                    "ID del dettato non valido"
            });
        }

        try {
            const result = await pool.query(
                `
                DELETE FROM dictations
                WHERE id = $1
                AND user_id = $2
                RETURNING *
                `,
                [
                    dictationId,
                    auth.userId
                ]
            );

            if (result.rows.length === 0) {
                return response.status(404).json({
                    error: "Dettato non trovato"
                });
            }

            response.json(result.rows[0]);
        } catch (error) {
            console.error(error);

            response.status(500).json({
                error:
                    "Errore durante l'eliminazione del dettato"
            });
        }
    }
);

module.exports = router;