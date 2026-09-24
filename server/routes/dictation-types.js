const express = require("express");
const { getAuth } = require("@clerk/express");
const { withUserContext } = require("../db-context");

const router = express.Router();
const defaultDictationTypes = ["Ritmico", "Melodico", "Armonico"];

router.get("/", async function (request, response) {
    const auth = getAuth(request);

    if (!auth.isAuthenticated) {
        return response.status(401).json({ error: "Utente non autenticato" });
    }

    try {
        const result = await withUserContext(auth.userId, async function (client) {
            const settingsResult = await client.query(
                `
                SELECT dictation_types_initialized
                FROM user_settings
                WHERE user_id = $1
                `,
                [auth.userId]
            );

            const typesInitialized = settingsResult.rows[0]?.dictation_types_initialized;

            if (!typesInitialized) {
                await client.query(
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
                    [auth.userId, defaultDictationTypes]
                );

                await client.query(
                    `
                    INSERT INTO user_settings (
                        user_id,
                        dictation_types_initialized
                    )
                    VALUES ($1, TRUE)
                    ON CONFLICT (user_id)
                    DO UPDATE SET dictation_types_initialized = TRUE
                    `,
                    [auth.userId]
                );
            }

            return client.query(
                `
                SELECT *
                FROM dictation_types
                WHERE user_id = $1
                ORDER BY id
                `,
                [auth.userId]
            );
        });

        response.json(result.rows);
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: "Errore durante il recupero dei tipi di dettato" });
    }
});

router.post("/", async function (request, response) {
    const auth = getAuth(request);

    if (!auth.isAuthenticated) {
        return response.status(401).json({ error: "Utente non autenticato" });
    }

    const { name } = request.body;

    if (typeof name !== "string" || name.trim() === "" || name.trim().length > 50) {
        return response.status(400).json({ error: "Nome del tipo di dettato non valido" });
    }

    try {
        const result = await withUserContext(auth.userId, async function (client) {
            return client.query(
                `
                INSERT INTO dictation_types (
                    name,
                    user_id,
                    is_default
                )
                VALUES ($1, $2, FALSE)
                RETURNING *
                `,
                [name.trim(), auth.userId]
            );
        });

        response.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === "23505") {
            return response.status(409).json({ error: "Esiste già un tipo di dettato con questo nome" });
        }

        console.error(error);
        response.status(500).json({ error: "Errore durante il salvataggio del tipo di dettato" });
    }
});

router.delete("/:id", async function (request, response) {
    const auth = getAuth(request);

    if (!auth.isAuthenticated) {
        return response.status(401).json({ error: "Utente non autenticato" });
    }

    const typeId = Number(request.params.id);

    if (!Number.isInteger(typeId) || typeId <= 0) {
        return response.status(400).json({ error: "ID del tipo di dettato non valido" });
    }

    try {
        const result = await withUserContext(auth.userId, async function (client) {
            return client.query(
                `
                DELETE FROM dictation_types
                WHERE id = $1
                AND user_id = $2
                RETURNING *
                `,
                [typeId, auth.userId]
            );
        });

        if (result.rows.length === 0) {
            return response.status(404).json({ error: "Tipo di dettato non trovato" });
        }

        response.json(result.rows[0]);
    } catch (error) {
        if (error.code === "23503" || error.code === "23001") {
            return response.status(409).json({ error: "Non puoi eliminare un tipo utilizzato da dettati o categorie" });
        }

        console.error(error);
        response.status(500).json({ error: "Errore durante la cancellazione del tipo di dettato" });
    }
});

module.exports = router;