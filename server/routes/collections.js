const express = require("express");
const { getAuth } = require("@clerk/express");
const { withUserContext } = require("../db-context");
const { writeLimiter } = require("../rate-limit");

const router = express.Router();

router.get("/", async function (request, response) {
    const auth = getAuth(request);

    if (!auth.isAuthenticated) {
        return response.status(401).json({
            error: "Utente non autenticato"
        });
    }

    try {
        const result = await withUserContext(
            auth.userId,
            async function (client) {
                return client.query(
                    `
                    SELECT id, name, user_id
                    FROM collections
                    WHERE user_id = $1
                    ORDER BY id
                    `,
                    [auth.userId]
                );
            }
        );

        response.json(result.rows);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante il recupero delle raccolte"
        });
    }
});

router.post("/", writeLimiter, async function (request, response) {
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
        const result = await withUserContext(
            auth.userId,
            async function (client) {
                return client.query(
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
            }
        );

        response.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore durante il salvataggio della raccolta"
        });
    }
});

router.delete("/:id", writeLimiter, async function (request, response) {
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
        const result = await withUserContext(
            auth.userId,
            async function (client) {
                return client.query(
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
            }
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