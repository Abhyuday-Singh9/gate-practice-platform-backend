require("dotenv").config();
const fs = require("fs");
const { Pool } = require("pg");

const hasExplicitConnectionConfig = Boolean(
  process.env.DATABASE_URL ||
  process.env.PGHOST ||
  process.env.PGDATABASE ||
  process.env.PGUSER,
);

if (!hasExplicitConnectionConfig) {
  // Allow the app to load; actual queries will raise a clear config error.
}

const poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
} else {
  if (process.env.PGHOST) {
    poolConfig.host = process.env.PGHOST;
  }
  if (process.env.PGPORT) {
    poolConfig.port = Number(process.env.PGPORT);
  }
  if (process.env.PGDATABASE) {
    poolConfig.database = process.env.PGDATABASE;
  }
  if (process.env.PGUSER) {
    poolConfig.user = process.env.PGUSER;
  }
  if (process.env.PGPASSWORD) {
    poolConfig.password = process.env.PGPASSWORD;
  }
}

if (process.env.PGSSL === "true") {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false",
  };

  if (process.env.PGSSL_CA) {
    poolConfig.ssl.ca = process.env.PGSSL_CA;
  } else if (process.env.PGSSL_CA_FILE) {
    poolConfig.ssl.ca = fs.readFileSync(process.env.PGSSL_CA_FILE, "utf8");
  }
}

const pool = hasExplicitConnectionConfig ? new Pool(poolConfig) : null;

async function query(text, params) {
  if (!pool) {
    throw new Error(
      "Database connection is not configured. Set DATABASE_URL or PGHOST/PGDATABASE/PGUSER/PGPASSWORD.",
    );
  }

  return pool.query(text, params);
}

async function withTransaction(work) {
  if (!pool) {
    throw new Error(
      "Database connection is not configured. Set DATABASE_URL or PGHOST/PGDATABASE/PGUSER/PGPASSWORD.",
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_rollbackError) {
      // Ignore rollback failures so the original error can bubble up.
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
};
