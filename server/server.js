const express = require("express");

const {
    clerkMiddleware,
    getAuth
} = require("@clerk/express");

const cors = require("cors");

const pool = require("./db");

const app = express();

app.use(clerkMiddleware());

app.use(cors({
    origin: "http://127.0.0.1:5500"
}));

app.use(express.json());

const PORT = 3000;

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

function isValidHttpUrl(value) {
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

    const allowedTypes = [
        "rhythmic",
        "melodic",
        "harmonic"
    ];

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
        collection.length > 100
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
                name,
                youtubeLink,
                type,
                collection || null,
                availableCategories || [],
                correctCategories || [],
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

    const id = request.params.id;

    try {
        const result = await pool.query(
            `
            DELETE FROM dictations
            WHERE id = $1
            AND user_id = $2
            RETURNING *
            `,
            [id, auth.userId]
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
                name,
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

    const categoryId = request.params.id;

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
                name,
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

    const collectionId = request.params.id;

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
