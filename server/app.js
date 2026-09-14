const express = require("express");
const { clerkMiddleware } = require("@clerk/express");
const cors = require("cors");

const dictationsRouter = require("./routes/dictations");
const categoriesRouter = require("./routes/categories");
const collectionsRouter = require("./routes/collections");
const dictationTypesRouter = require("./routes/dictation-types");

const app = express();

app.use(clerkMiddleware());

const allowedOrigins = [
    "http://127.0.0.1:5500",
    "https://music-study-tracker.netlify.app"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Origine non autorizzata"));
        }
    }
}));

app.use(express.json());

app.get("/", function (request, response) {
    response.send("Il server funziona!");
});

app.use("/dictations", dictationsRouter);
app.use("/categories", categoriesRouter);
app.use("/collections", collectionsRouter);
app.use("/dictation-types", dictationTypesRouter);

module.exports = app;