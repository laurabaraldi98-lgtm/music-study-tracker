const express = require("express");

const pool = require("./db");

const app = express();

app.use(express.json());

const PORT = 3000;

app.get("/", function (request, response) {
    response.send("Il server funziona!");
});

app.get("/database-test", async function (request, response) {
    try {
        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        response.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        response.status(500).json({
            error: "Errore di connessione al database"
        });
    }
});

app.get("/dictations", async function (request, response) {
    try {
        const result = await pool.query(
            "SELECT * FROM dictations ORDER BY date DESC"
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
    const {
        date,
        name,
        youtubeLink,
        type,
        collection,
        availableCategories,
        correctCategories
    } = request.body;

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
                correct_categories
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [
                date,
                name,
                youtubeLink,
                type,
                collection || null,
                availableCategories || [],
                correctCategories || []
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

app.listen(PORT, function () {
    console.log(`Server avviato su http://localhost:${PORT}`);
});
