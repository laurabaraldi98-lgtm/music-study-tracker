const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { getAuth } = require("@clerk/express");

function getRateLimitKey(request) {
    const auth = getAuth(request);

    if (auth.isAuthenticated && auth.userId) {
        return `user:${auth.userId}`;
    }

    return `ip:${ipKeyGenerator(request.ip)}`;
}

const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    message: {
        error: "Troppe richieste. Riprova tra poco."
    }
});

const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    message: {
        error: "Troppe operazioni di modifica. Riprova tra poco."
    }
});

const reportLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    message: {
        error: "Troppe richieste al report. Riprova tra poco."
    }
});

const aiReportLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    message: {
        error: "Troppe richieste di analisi AI. Riprova tra poco."
    }
});

module.exports = {
    generalLimiter,
    writeLimiter,
    reportLimiter,
    aiReportLimiter,
    getRateLimitKey
};