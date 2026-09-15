const express = require("express");
const { getAuth } = require("@clerk/express");
const pool = require("../db");

const router = express.Router();

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
            FROM collections
            WHERE user_id = $1
            ORDER BY id
            `,
            [auth.userId]
        );

        response.json(result.rows);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante il recupero delle raccolte"
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

    const { name } = request.body;

    if (
        typeof name !== "string" ||
        name.trim() === "" ||
        name.trim().length > 100
    ) {
        return response.status(400).json({
            error: "Nome della raccolta non valido"
        });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO collections (
                name,
                user_id
            )
            VALUES ($1, $2)
            RETURNING *
            `,
            [
                name.trim(),
                auth.userId
            ]
        );

        response.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante il salvataggio della raccolta"
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

    const collectionId = Number(request.params.id);

    if (
        !Number.isInteger(collectionId) ||
        collectionId <= 0
    ) {
        return response.status(400).json({
            error: "ID della raccolta non valido"
        });
    }

    try {
        const result = await pool.query(
            `
            DELETE FROM collections
            WHERE id = $1
            AND user_id = $2
            RETURNING *
            `,
            [
                collectionId,
                auth.userId
            ]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                error: "Raccolta non trovata"
            });
        }

        response.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante la cancellazione della raccolta"
        });
    }
});

module.exports = router;