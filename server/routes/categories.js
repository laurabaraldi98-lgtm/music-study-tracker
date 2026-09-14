const express = require("express");
const { getAuth } = require("@clerk/express");
const pool = require("../db");

const router = express.Router();

const defaultCategories = [
    ["rhythmic", "Metrica"],
    ["rhythmic", "Pause"],
    ["rhythmic", "Gruppi irregolari"],
    ["melodic", "Tonalità"],
    ["melodic", "Ritmo"],
    ["melodic", "Intervalli"],
    ["melodic", "Modulazioni"],
    ["harmonic", "Basso"],
    ["harmonic", "Soprano"],
    ["harmonic", "Accordi"]
];

const allowedTypes = [
    "rhythmic",
    "melodic",
    "harmonic"
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
            for (const [type, name] of defaultCategories) {
                await pool.query(
                    `
                    INSERT INTO categories (
                        type,
                        name,
                        user_id
                    )
                    VALUES ($1, $2, $3)
                    `,
                    [
                        type,
                        name,
                        auth.userId
                    ]
                );
            }

            await pool.query(
                `
                INSERT INTO user_settings (
                    user_id,
                    categories_initialized
                )
                VALUES ($1, TRUE)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    categories_initialized = TRUE
                `,
                [auth.userId]
            );
        }

        const result = await pool.query(
            `
            SELECT *
            FROM categories
            WHERE user_id = $1
            ORDER BY type, id
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
        type,
        name
    } = request.body;

    if (!allowedTypes.includes(type)) {
        return response.status(400).json({
            error: "Tipo di categoria non valido"
        });
    }

    if (
        typeof name !== "string" ||
        name.trim() === "" ||
        name.trim().length > 50
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
                user_id
            )
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [
                type,
                name.trim(),
                auth.userId
            ]
        );

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
            RETURNING *
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