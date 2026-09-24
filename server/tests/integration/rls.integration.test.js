require("dotenv").config();

if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is not configured");
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const pool = require("../../db");
const { withUserContext } = require("../../db-context");

const USER_A = "integration_user_a";
const USER_B = "integration_user_b";

describe("RLS integration", function () {
    beforeAll(async function () {
        if (!process.env.TEST_DATABASE_URL) {
            throw new Error("TEST_DATABASE_URL is not configured");
        }
    });

    afterEach(async function () {
        await withUserContext(USER_A, async function (client) {
            await client.query(
                `
                DELETE FROM categories
                WHERE user_id = $1
                `,
                [USER_A]
            );
        });

        await withUserContext(USER_B, async function (client) {
            await client.query(
                `
                DELETE FROM categories
                WHERE user_id = $1
                `,
                [USER_B]
            );
        });
    });

    afterAll(async function () {
        await pool.end();
    });

    test("user A can see their own category", async function () {
        await withUserContext(USER_A, async function (client) {
            await client.query(
                `
                INSERT INTO categories (
                    type,
                    name,
                    user_id
                )
                VALUES ($1, $2, $3)
                `,
                ["integration", "User A category", USER_A]
            );
        });

        const result = await withUserContext(USER_A, async function (client) {
            return client.query(
                `
                SELECT *
                FROM categories
                WHERE user_id = $1
                `,
                [USER_A]
            );
        });

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].user_id).toBe(USER_A);
        expect(result.rows[0].name).toBe("User A category");
    });

    test("user B cannot see user A's category", async function () {
        await withUserContext(USER_A, async function (client) {
            await client.query(
                `
                INSERT INTO categories (
                    type,
                    name,
                    user_id
                )
                VALUES ($1, $2, $3)
                `,
                ["integration", "Private category", USER_A]
            );
        });

        const result = await withUserContext(USER_B, async function (client) {
            return client.query(
                `
                SELECT *
                FROM categories
                `
            );
        });

        expect(result.rows).toHaveLength(0);
    });

    test("user B cannot insert data belonging to user A", async function () {
        await expect(
            withUserContext(USER_B, async function (client) {
                return client.query(
                    `
                    INSERT INTO categories (
                        type,
                        name,
                        user_id
                    )
                    VALUES ($1, $2, $3)
                    `,
                    ["integration", "Fake category", USER_A]
                );
            })
        ).rejects.toThrow();
    });

    test("user B cannot update user A's category", async function () {
        const inserted = await withUserContext(USER_A, async function (client) {
            return client.query(
                `
            INSERT INTO categories (
                type,
                name,
                user_id
            )
            VALUES ($1, $2, $3)
            RETURNING id
            `,
                ["integration", "Original category", USER_A]
            );
        });

        const categoryId = inserted.rows[0].id;

        const result = await withUserContext(USER_B, async function (client) {
            return client.query(
                `
            UPDATE categories
            SET name = $1
            WHERE id = $2
            RETURNING *
            `,
                ["Hacked category", categoryId]
            );
        });

        expect(result.rows).toHaveLength(0);

        const check = await withUserContext(USER_A, async function (client) {
            return client.query(
                `
            SELECT name
            FROM categories
            WHERE id = $1
            `,
                [categoryId]
            );
        });

        expect(check.rows[0].name).toBe("Original category");
    });

    test("user B cannot delete user A's category", async function () {
        const inserted = await withUserContext(USER_A, async function (client) {
            return client.query(
                `
            INSERT INTO categories (
                type,
                name,
                user_id
            )
            VALUES ($1, $2, $3)
            RETURNING id
            `,
                ["integration", "Protected category", USER_A]
            );
        });

        const categoryId = inserted.rows[0].id;

        const result = await withUserContext(USER_B, async function (client) {
            return client.query(
                `
            DELETE FROM categories
            WHERE id = $1
            RETURNING *
            `,
                [categoryId]
            );
        });

        expect(result.rows).toHaveLength(0);

        const check = await withUserContext(USER_A, async function (client) {
            return client.query(
                `
            SELECT *
            FROM categories
            WHERE id = $1
            `,
                [categoryId]
            );
        });

        expect(check.rows).toHaveLength(1);
    });
});