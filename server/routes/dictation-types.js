const express = require("express");
const { getAuth } = require("@clerk/express");
const { withUserContext } = require("../db-context");
const { writeLimiter } = require("../rate-limit");

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
                AND is_archived = FALSE
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

router.post("/", writeLimiter, async function (request, response) {
    const auth = getAuth(request);

    if (!auth.isAuthenticated) {
        return response.status(401).json({ error: "Utente non autenticato" });
    }

    const { name } = request.body;

    if (typeof name !== "string" || name.trim() === "" || name.trim().length > 50) {
        return response.status(400).json({ error: "Nome del tipo di dettato non valido" });
    }

    const cleanName = name.trim();

    try {
        const result = await withUserContext(auth.userId, async function (client) {
            const reactivatedResult = await client.query(
                `
                UPDATE dictation_types
                SET is_archived = FALSE
                WHERE user_id = $1
                AND LOWER(name) = LOWER($2)
                AND is_archived = TRUE
                RETURNING *
                `,
                [auth.userId, cleanName]
            );

            if (reactivatedResult.rows.length > 0) {
                return {
                    dictationType: reactivatedResult.rows[0],
                    reactivated: true
                };
            }

            const createdResult = await client.query(
                `
                INSERT INTO dictation_types (
                    name,
                    user_id,
                    is_default
                )
                VALUES ($1, $2, FALSE)
                RETURNING *
                `,
                [cleanName, auth.userId]
            );

            return {
                dictationType: createdResult.rows[0],
                reactivated: false
            };
        });

        response
            .status(result.reactivated ? 200 : 201)
            .json(result.dictationType);
    } catch (error) {
        if (error.code === "23505") {
            return response.status(409).json({ error: "Esiste già un tipo di dettato con questo nome" });
        }

        console.error(error);
        response.status(500).json({ error: "Errore durante il salvataggio del tipo di dettato" });
    }
});

router.delete("/:id", writeLimiter, async function (request, response) {
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
            const typeResult = await client.query(
                `
                SELECT *
                FROM dictation_types
                WHERE id = $1
                AND user_id = $2
                AND is_archived = FALSE
                `,
                [typeId, auth.userId]
            );

            if (typeResult.rows.length === 0) {
                return null;
            }

            const usageResult = await client.query(
                `
                SELECT
                    EXISTS (
                        SELECT 1
                        FROM dictations
                        WHERE dictation_type_id = $1
                        AND user_id = $2
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM categories
                        WHERE dictation_type_id = $1
                        AND user_id = $2
                    ) AS is_used
                `,
                [typeId, auth.userId]
            );

            if (usageResult.rows[0].is_used) {
                const archivedResult = await client.query(
                    `
                    UPDATE dictation_types
                    SET is_archived = TRUE
                    WHERE id = $1
                    AND user_id = $2
                    RETURNING *
                    `,
                    [typeId, auth.userId]
                );

                return archivedResult.rows[0];
            }

            const deletedResult = await client.query(
                `
                DELETE FROM dictation_types
                WHERE id = $1
                AND user_id = $2
                RETURNING *
                `,
                [typeId, auth.userId]
            );

            return deletedResult.rows[0];
        });

        if (!result) {
            return response.status(404).json({ error: "Tipo di dettato non trovato" });
        }

        response.json(result);
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: "Errore durante la cancellazione del tipo di dettato" });
    }
});

module.exports = router;