jest.mock("../db", () => ({
    connect: jest.fn()
}));

const pool = require("../db");
const { withUserContext } = require("../db-context");

describe("withUserContext", function () {
    let client;

    beforeEach(function () {
        client = {
            query: jest.fn(),
            release: jest.fn()
        };

        pool.connect.mockResolvedValue(client);
    });

    afterEach(function () {
        jest.resetAllMocks();
    });

    test("runs the callback inside a user-scoped transaction", async function () {
        const callback = jest.fn().mockResolvedValue("result");

        const result = await withUserContext(
            "user_test",
            callback
        );

        expect(pool.connect).toHaveBeenCalledTimes(1);

        expect(client.query).toHaveBeenNthCalledWith(
            1,
            "BEGIN"
        );

        expect(client.query).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining("set_config"),
            ["user_test"]
        );

        expect(callback).toHaveBeenCalledWith(client);

        expect(client.query).toHaveBeenNthCalledWith(
            3,
            "COMMIT"
        );

        expect(client.release).toHaveBeenCalledTimes(1);

        expect(result).toBe("result");
    });

    test("rolls back and releases the client when the callback fails", async function () {
        const error = new Error("Database error");

        const callback = jest.fn().mockRejectedValue(error);

        await expect(
            withUserContext(
                "user_test",
                callback
            )
        ).rejects.toThrow("Database error");

        expect(client.query).toHaveBeenNthCalledWith(
            1,
            "BEGIN"
        );

        expect(client.query).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining("set_config"),
            ["user_test"]
        );

        expect(client.query).toHaveBeenNthCalledWith(
            3,
            "ROLLBACK"
        );

        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test("releases the client when setting the user context fails", async function () {
        client.query
            .mockResolvedValueOnce()
            .mockRejectedValueOnce(
                new Error("Context error")
            )
            .mockResolvedValueOnce();

        const callback = jest.fn();

        await expect(
            withUserContext(
                "user_test",
                callback
            )
        ).rejects.toThrow("Context error");

        expect(callback).not.toHaveBeenCalled();

        expect(client.query).toHaveBeenNthCalledWith(
            3,
            "ROLLBACK"
        );

        expect(client.release).toHaveBeenCalledTimes(1);
    });
});