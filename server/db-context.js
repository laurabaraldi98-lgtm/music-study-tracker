const pool = require("./db");

async function withUserContext(userId, callback) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Make the authenticated Clerk user available to PostgreSQL RLS
        // only for the duration of this transaction.
        await client.query(
            `
            SELECT set_config(
                'app.user_id',
                $1,
                true
            )
            `,
            [userId]
        );

        const result = await callback(client);

        await client.query("COMMIT");

        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        // Always return the connection to the pool.
        client.release();
    }
}

module.exports = {
    withUserContext
};