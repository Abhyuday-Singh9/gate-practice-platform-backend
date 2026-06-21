require("dotenv").config();

const db = require("../config/db");
const { hashPassword } = require("../shared/auth/password");

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "admin@gateprep.local").trim().toLowerCase();
const ADMIN_NAME = String(process.env.ADMIN_NAME || "System Admin").trim();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "Admin@1234");

async function main() {
  const existing = await db.query(
    `SELECT id, email, role
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [ADMIN_EMAIL]
  );

  if (existing.rows[0]) {
    console.log(
      JSON.stringify(
        {
          created: false,
          message: "Admin user already exists",
          user: existing.rows[0]
        },
        null,
        2
      )
    );
    return;
  }

  const passwordHash = hashPassword(ADMIN_PASSWORD);

  const created = await db.query(
    `INSERT INTO users (name, email, password_hash, role, is_email_verified)
     VALUES ($1, $2, $3, 'admin', TRUE)
     RETURNING id, email, role, is_email_verified, created_at`,
    [ADMIN_NAME, ADMIN_EMAIL, passwordHash]
  );

  console.log(
    JSON.stringify(
      {
        created: true,
        user: created.rows[0]
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Failed to seed admin user:", error);
  process.exit(1);
});
