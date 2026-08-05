const express = require("express");

const {
    clerkMiddleware,
    getAuth
} = require("@clerk/express");

const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(clerkMiddleware());

app.use(cors({
    origin: "http://127.0.0.1:5500"
}));

app.use(express.json());

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

app.get("/", function (request, response) {
    response.send("Il server funziona!");
});

/*
    DETTATI
*/

app.get("/dictations", async function (request, response) {
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

app.post("/dictations", async function (request, response) {
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

app.delete("/dictations/:id", async function (request, response) {
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

/*
    CATEGORIE
*/

app.get("/categories", async function (request, response) {
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
                DO UPDATE SET categories_initialized = TRUE
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

app.post("/categories", async function (request, response) {
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

app.delete("/categories/:id", async function (request, response) {
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

/*
    RACCOLTE
*/

app.get("/collections", async function (request, response) {
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

app.post("/collections", async function (request, response) {
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

app.delete("/collections/:id", async function (request, response) {
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

app.listen(PORT, function () {
    console.log(`Server avviato su http://localhost:${PORT}`);
});