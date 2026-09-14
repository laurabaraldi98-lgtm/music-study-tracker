const express = require("express");
const { getAuth } = require("@clerk/express");
const pool = require("../db");

const router = express.Router();

const allowedTypes = [
    "rhythmic",
    "melodic",
    "harmonic"
];

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
            SELECT *
            FROM dictations
            WHERE user_id = $1
            ORDER BY date DESC
            `,
            [auth.userId]
        );

        response.json(result.rows);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante il recupero dei dettati"
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
        type,
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

    if (!allowedTypes.includes(type)) {
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
            error: "Nome della raccolta troppo lungo"
        });
    }

    if (
        !Array.isArray(availableCategories) ||
        !availableCategories.every(
            category => typeof category === "string"
        )
    ) {
        return response.status(400).json({
            error: "Categorie disponibili non valide"
        });
    }

    if (
        !Array.isArray(correctCategories) ||
        !correctCategories.every(
            category => typeof category === "string"
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
                user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            `,
            [
                date,
                name.trim(),
                youtubeLink,
                type,
                cleanCollection,
                availableCategories,
                correctCategories,
                auth.userId
            ]
        );

        response.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante il salvataggio del dettato"
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

    const dictationId = Number(request.params.id);

    if (
        !Number.isInteger(dictationId) ||
        dictationId <= 0
    ) {
        return response.status(400).json({
            error: "ID del dettato non valido"
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
            error: "Errore durante l'eliminazione del dettato"
        });
    }
});

module.exports = router;