const request = require("supertest");
const app = require("../app");

describe("GET /", function () {
    test("returns 200 and the server status message", async function () {
        const response = await request(app).get("/");

        expect(response.status).toBe(200);
        expect(response.text).toBe("Il server funziona!");
    });
});

describe("GET /dictations", function () {
    test("returns 401 when the user is not authenticated", async function () {
        const response = await request(app).get("/dictations");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Utente non autenticato"
        });
    });
});