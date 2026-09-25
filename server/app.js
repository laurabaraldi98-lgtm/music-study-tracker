const express = require("express");
const { clerkMiddleware } = require("@clerk/express");
const cors = require("cors");

const { generalLimiter } = require("./rate-limit");

const dictationsRouter = require("./routes/dictations");
const categoriesRouter = require("./routes/categories");
const collectionsRouter = require("./routes/collections");
const dictationTypesRouter = require("./routes/dictation-types");
const statisticsRouter = require("./routes/statistics");

const app = express();

app.use(clerkMiddleware());
app.use(generalLimiter);

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
app.use("/statistics", statisticsRouter);

module.exports = app;