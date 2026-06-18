const { createApiError } = require("../http/apiError");
const { hashPassword, verifyPassword } = require("./password");
const {
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  createUserRecord,
  deleteUser,
  ensureInitialized,
  findRefreshToken,
  findUserByEmail,
  findUserById,
  listUsers,
  revokeAllUserTokens,
  revokeRefreshToken,
  storeEmailVerificationToken,
  storePasswordResetToken,
  storeRefreshToken,
  updateUser
} = require("./store");
const { buildAuthLink, sendEmail } = require("../email/mailer");
const { extractBearerToken, signToken, verifyToken } = require("./tokens");

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "gate-prep-access-secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "gate-prep-refresh-secret";
const PASSWORD_RESET_SECRET = process.env.PASSWORD_RESET_SECRET || "gate-prep-reset-secret";
const EMAIL_VERIFY_SECRET = process.env.EMAIL_VERIFY_SECRET || "gate-prep-verify-secret";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const PASSWORD_RESET_TTL_SECONDS = 60 * 60;
const EMAIL_VERIFY_TTL_SECONDS = 24 * 60 * 60;

function ensurePasswordStrength(password) {
  if (typeof password !== "string" || password.trim().length < 8) {
    throw createApiError(400, "Password must be at least 8 characters long");
  }
}

function ensureName(name) {
  if (typeof name !== "string" || name.trim().length < 2) {
    throw createApiError(400, "Name must be at least 2 characters long");
  }
}

function normalizeEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();

  if (!normalized || !normalized.includes("@")) {
    throw createApiError(400, "A valid email address is required");
  }

  return normalized;
}

function publicUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...publicData } = user;
  return publicData;
}

async function createSessionTokens(user) {
  const accessToken = signToken(
    {
      sub: user.id,
      role: user.role,
      type: "access"
    },
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_TTL_SECONDS
  );

  const refreshToken = signToken(
    {
      sub: user.id,
      role: user.role,
      type: "refresh"
    },
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_TTL_SECONDS
  );

  await storeRefreshToken(refreshToken, verifyToken(refreshToken, REFRESH_TOKEN_SECRET, "refresh"));

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS
  };
}

async function createVerificationToken(user) {
  const token = signToken(
    {
      sub: user.id,
      type: "email-verify"
    },
    EMAIL_VERIFY_SECRET,
    EMAIL_VERIFY_TTL_SECONDS
  );

  await storeEmailVerificationToken(token, verifyToken(token, EMAIL_VERIFY_SECRET, "email-verify"));

  return token;
}

async function createResetToken(user) {
  const token = signToken(
    {
      sub: user.id,
      type: "password-reset"
    },
    PASSWORD_RESET_SECRET,
    PASSWORD_RESET_TTL_SECONDS
  );

  await storePasswordResetToken(token, verifyToken(token, PASSWORD_RESET_SECRET, "password-reset"));

  return token;
}

async function registerUser({ name, email, password, branchId }) {
  await ensureInitialized();
  ensureName(name);
  ensurePasswordStrength(password);

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw createApiError(409, "An account with this email already exists");
  }

  const user = await createUserRecord({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    branchId: branchId === undefined || branchId === "" ? null : branchId,
    role: "user",
    isEmailVerified: false
  });

  const session = await createSessionTokens(user);
  const verificationToken = await createVerificationToken(user);
  const verificationLink = buildAuthLink("/api/v1/auth/verify-email", verificationToken);

  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    text: `Welcome ${user.name}.\n\nVerify your email by using this token in POST /api/v1/auth/verify-email:\n${verificationToken}\n\nOr open this link:\n${verificationLink}`
  });

  return {
    user: publicUser(user),
    session,
    verificationToken: process.env.NODE_ENV === "production" ? undefined : verificationToken
  };
}

async function loginUser({ email, password }, expectedRole = "user") {
  await ensureInitialized();

  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createApiError(401, "Invalid email or password");
  }

  if (expectedRole && user.role !== expectedRole) {
    throw createApiError(403, "You are not allowed to sign in from this endpoint");
  }

  const updatedUser = await updateUser(user.id, { lastLoginAt: new Date() });

  return {
    user: publicUser(updatedUser),
    session: await createSessionTokens(user)
  };
}

async function loginAdmin({ email, password }) {
  return loginUser({ email, password }, "admin");
}

async function refreshSession(refreshToken) {
  await ensureInitialized();

  if (!refreshToken) {
    throw createApiError(400, "Refresh token is required");
  }

  const payload = verifyToken(refreshToken, REFRESH_TOKEN_SECRET, "refresh");
  const record = await findRefreshToken(refreshToken);

  if (!record) {
    throw createApiError(401, "Refresh token has been revoked");
  }

  const user = await findUserById(payload.sub);

  if (!user) {
    await revokeRefreshToken(refreshToken);
    throw createApiError(404, "Account not found");
  }

  await revokeRefreshToken(refreshToken);

  return {
    user: publicUser(user),
    session: await createSessionTokens(user)
  };
}

async function logout(refreshToken) {
  await ensureInitialized();

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  return {
    message: "Logged out successfully"
  };
}

async function verifyAccessTokenFromHeader(authorizationHeader) {
  await ensureInitialized();

  const token = extractBearerToken(authorizationHeader);

  if (!token) {
    throw createApiError(401, "Authorization header with Bearer token is required");
  }

  const payload = verifyToken(token, ACCESS_TOKEN_SECRET, "access");
  const user = await findUserById(payload.sub);

  if (!user) {
    throw createApiError(401, "Account not found");
  }

  return {
    payload,
    user
  };
}

async function getCurrentUser(userId) {
  await ensureInitialized();

  const user = await findUserById(userId);

  if (!user) {
    throw createApiError(404, "Account not found");
  }

  return publicUser(user);
}

async function updateCurrentUser(userId, updates) {
  await ensureInitialized();

  const user = await findUserById(userId);

  if (!user) {
    throw createApiError(404, "Account not found");
  }

  const nextUpdates = {};
  let verificationToken = null;

  if (updates.name !== undefined) {
    ensureName(updates.name);
    nextUpdates.name = updates.name.trim();
  }

  if (updates.email !== undefined) {
    const normalizedEmail = normalizeEmail(updates.email);
    const existing = await findUserByEmail(normalizedEmail);

    if (existing && String(existing.id) !== String(user.id)) {
      throw createApiError(409, "An account with this email already exists");
    }

    if (normalizedEmail !== user.email) {
      nextUpdates.email = normalizedEmail;
      nextUpdates.isEmailVerified = false;
    }
  }

  if (updates.branchId !== undefined) {
    nextUpdates.branchId = updates.branchId === "" ? null : updates.branchId;
  }

  if (updates.password !== undefined) {
    ensurePasswordStrength(updates.password);
    nextUpdates.passwordHash = hashPassword(updates.password);
    await revokeAllUserTokens(user.id);
  }

  const updatedUser = await updateUser(user.id, nextUpdates);

  if (nextUpdates.email) {
    verificationToken = await createVerificationToken(updatedUser);
    await sendEmail({
      to: updatedUser.email,
      subject: "Verify your updated email",
      text: `Your email was changed.\n\nUse this token in POST /api/v1/auth/verify-email:\n${verificationToken}\n\nOr open this link:\n${buildAuthLink("/api/v1/auth/verify-email", verificationToken)}`
    });
  }

  return {
    user: publicUser(await findUserById(user.id)),
    verificationToken: process.env.NODE_ENV === "production" ? undefined : verificationToken
  };
}

async function removeUser(userId) {
  await ensureInitialized();

  const removed = await deleteUser(userId);

  if (!removed) {
    throw createApiError(404, "Account not found");
  }

  return publicUser(removed);
}

async function listPublicUsers() {
  await ensureInitialized();
  const users = await listUsers();
  return users.map(publicUser);
}

async function getAccountStats(userId) {
  await ensureInitialized();

  const user = await findUserById(userId);

  if (!user) {
    throw createApiError(404, "Account not found");
  }

  const createdAt = new Date(user.createdAt);
  const ageMs = Date.now() - createdAt.getTime();
  const accountAgeDays = Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000)));

  return {
    userId: user.id,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    accountAgeDays,
    lastLoginAt: user.lastLoginAt
  };
}

async function forgotPassword(email) {
  await ensureInitialized();

  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    return {
      message: "If the email exists, password reset instructions have been generated"
    };
  }

  const resetToken = await createResetToken(user);

  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    text: `We received a password reset request.\n\nUse this token in POST /api/v1/auth/reset-password:\n${resetToken}`
  });

  return {
    message: "Password reset instructions have been generated",
    resetToken: process.env.NODE_ENV === "production" ? undefined : resetToken
  };
}

async function resetPassword(token, newPassword) {
  await ensureInitialized();
  ensurePasswordStrength(newPassword);

  const payload = verifyToken(token, PASSWORD_RESET_SECRET, "password-reset");
  const record = await consumePasswordResetToken(token);

  if (!record) {
    throw createApiError(401, "Password reset token has been revoked");
  }

  const user = await findUserById(payload.sub);

  if (!user) {
    throw createApiError(404, "Account not found");
  }

  await updateUser(user.id, {
    passwordHash: hashPassword(newPassword)
  });
  await revokeAllUserTokens(user.id);

  return {
    user: publicUser(await findUserById(user.id))
  };
}

async function verifyEmail(token) {
  await ensureInitialized();

  const payload = verifyToken(token, EMAIL_VERIFY_SECRET, "email-verify");
  const record = await consumeEmailVerificationToken(token);

  if (!record) {
    throw createApiError(401, "Email verification token has been revoked");
  }

  const user = await findUserById(payload.sub);

  if (!user) {
    throw createApiError(404, "Account not found");
  }

  await updateUser(user.id, { isEmailVerified: true });

  return {
    user: publicUser(await findUserById(user.id))
  };
}

module.exports = {
  forgotPassword,
  getAccountStats,
  getCurrentUser,
  listPublicUsers,
  loginAdmin,
  loginUser,
  logout,
  publicUser,
  refreshSession,
  registerUser,
  removeUser,
  resetPassword,
  updateCurrentUser,
  verifyAccessTokenFromHeader,
  verifyEmail
};
