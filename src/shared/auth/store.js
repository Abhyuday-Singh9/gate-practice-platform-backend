const crypto = require("crypto");
const { query, withTransaction } = require("../../config/db");

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "admin@gateprep.local").trim().toLowerCase();

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    branchId: row.branch_id,
    role: row.role,
    isEmailVerified: row.is_email_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at
  };
}

function mapTokenRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at
  };
}

let initPromise = null;

async function seedAdminAccount() {
  const { rows } = await query(
    `SELECT id
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [ADMIN_EMAIL]
  );

  if (rows[0]) {
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@1234";
  const { hashPassword } = require("./password");

  await query(
    `INSERT INTO users (name, email, password_hash, role, is_email_verified)
     VALUES ($1, $2, $3, 'admin', TRUE)`,
    [process.env.ADMIN_NAME || "System Admin", ADMIN_EMAIL, hashPassword(adminPassword)]
  );
}

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = seedAdminAccount();
  }

  return initPromise;
}

async function findUserById(userId) {
  await ensureInitialized();

  const { rows } = await query(
    `SELECT id, name, email, password_hash, branch_id, role, is_email_verified, created_at, updated_at, last_login_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  return mapUserRow(rows[0]);
}

async function findUserByEmail(email) {
  await ensureInitialized();

  const normalizedEmail = String(email || "").trim().toLowerCase();

  const { rows } = await query(
    `SELECT id, name, email, password_hash, branch_id, role, is_email_verified, created_at, updated_at, last_login_at
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [normalizedEmail]
  );

  return mapUserRow(rows[0]);
}

async function listUsers() {
  await ensureInitialized();

  const { rows } = await query(
    `SELECT id, name, email, password_hash, branch_id, role, is_email_verified, created_at, updated_at, last_login_at
     FROM users
     ORDER BY id ASC`
  );

  return rows.map(mapUserRow);
}

async function createUserRecord({
  name,
  email,
  passwordHash,
  branchId = null,
  role = "user",
  isEmailVerified = false
}) {
  await ensureInitialized();

  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, branch_id, role, is_email_verified)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, password_hash, branch_id, role, is_email_verified, created_at, updated_at, last_login_at`,
    [name, String(email).trim().toLowerCase(), passwordHash, branchId, role, isEmailVerified]
  );

  return mapUserRow(rows[0]);
}

async function updateUser(userId, updates) {
  await ensureInitialized();

  const fields = [];
  const values = [];
  let index = 1;

  const pushField = (column, value) => {
    fields.push(`${column} = $${index++}`);
    values.push(value);
  };

  if (updates.name !== undefined) {
    pushField("name", updates.name);
  }

  if (updates.email !== undefined) {
    pushField("email", String(updates.email).trim().toLowerCase());
  }

  if (updates.passwordHash !== undefined) {
    pushField("password_hash", updates.passwordHash);
  }

  if (updates.branchId !== undefined) {
    pushField("branch_id", updates.branchId);
  }

  if (updates.role !== undefined) {
    pushField("role", updates.role);
  }

  if (updates.isEmailVerified !== undefined) {
    pushField("is_email_verified", updates.isEmailVerified);
  }

  if (updates.lastLoginAt !== undefined) {
    pushField("last_login_at", updates.lastLoginAt);
  }

  if (fields.length === 0) {
    return findUserById(userId);
  }

  pushField("updated_at", new Date());
  values.push(userId);

  const { rows } = await query(
    `UPDATE users
     SET ${fields.join(", ")}
     WHERE id = $${index}
     RETURNING id, name, email, password_hash, branch_id, role, is_email_verified, created_at, updated_at, last_login_at`,
    values
  );

  return mapUserRow(rows[0]);
}

async function deleteUser(userId) {
  await ensureInitialized();

  const { rows } = await query(
    `DELETE FROM users
     WHERE id = $1
     RETURNING id, name, email, password_hash, branch_id, role, is_email_verified, created_at, updated_at, last_login_at`,
    [userId]
  );

  return mapUserRow(rows[0]);
}

async function storeRefreshToken(token, payload) {
  await ensureInitialized();

  await query(
    `INSERT INTO auth_refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, to_timestamp($3))`,
    [payload.sub, hashToken(token), payload.exp]
  );
}

async function findRefreshToken(token) {
  await ensureInitialized();

  const { rows } = await query(
    `SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
     FROM auth_refresh_tokens
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [hashToken(token)]
  );

  return mapTokenRow(rows[0]);
}

async function revokeRefreshToken(token) {
  await ensureInitialized();

  await query(
    `UPDATE auth_refresh_tokens
     SET revoked_at = NOW()
     WHERE token_hash = $1`,
    [hashToken(token)]
  );
}

async function revokeAllUserTokens(userId) {
  await ensureInitialized();

  await query(
    `UPDATE auth_refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

async function storePasswordResetToken(token, payload) {
  await ensureInitialized();

  await query(
    `INSERT INTO auth_password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, to_timestamp($3))`,
    [payload.sub, hashToken(token), payload.exp]
  );
}

async function consumePasswordResetToken(token) {
  await ensureInitialized();

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
       FROM auth_password_reset_tokens
       WHERE token_hash = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()
       LIMIT 1
       FOR UPDATE`,
      [hashToken(token)]
    );

    if (!rows[0]) {
      return null;
    }

    await client.query(
      `DELETE FROM auth_password_reset_tokens
       WHERE id = $1`,
      [rows[0].id]
    );

    return mapTokenRow(rows[0]);
  });
}

async function storeEmailVerificationToken(token, payload) {
  await ensureInitialized();

  await query(
    `INSERT INTO auth_email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, to_timestamp($3))`,
    [payload.sub, hashToken(token), payload.exp]
  );
}

async function consumeEmailVerificationToken(token) {
  await ensureInitialized();

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
       FROM auth_email_verification_tokens
       WHERE token_hash = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()
       LIMIT 1
       FOR UPDATE`,
      [hashToken(token)]
    );

    if (!rows[0]) {
      return null;
    }

    await client.query(
      `DELETE FROM auth_email_verification_tokens
       WHERE id = $1`,
      [rows[0].id]
    );

    return mapTokenRow(rows[0]);
  });
}

module.exports = {
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  createUserRecord,
  deleteUser,
  ensureInitialized,
  findRefreshToken,
  findUserByEmail,
  findUserById,
  hashToken,
  listUsers,
  revokeAllUserTokens,
  revokeRefreshToken,
  storeEmailVerificationToken,
  storePasswordResetToken,
  storeRefreshToken,
  updateUser
};
