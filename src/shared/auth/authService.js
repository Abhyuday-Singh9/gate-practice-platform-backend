const crypto = require("crypto");
const { createApiError } = require("../http/apiError");
const { hashPassword, verifyPassword } = require("./password");
const {
  consumeEmailVerificationToken,
  consumeEmailVerificationOtp,
  consumePasswordResetToken,
  createUserRecord,
  deleteUser,
  ensureInitialized,
  findRefreshToken,
  findUserByEmail,
  findUserById,
  findLatestEmailVerificationToken,
  listUsers,
  revokeAllEmailVerificationTokens,
  revokeAllUserTokens,
  revokeRefreshToken,
  storeEmailVerificationToken,
  storeEmailVerificationOtp,
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
const EMAIL_VERIFY_OTP_TTL_SECONDS = 10 * 60;
const EMAIL_VERIFY_RESEND_COOLDOWN_SECONDS = 60;
const UNVERIFIED_ACCOUNT_TTL_SECONDS = 24 * 60 * 60;

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

function isExpiredUnverifiedAccount(user) {
  if (!user || user.isEmailVerified) {
    return false;
  }

  const createdAt = new Date(user.createdAt);
  const ageSeconds = Math.floor((Date.now() - createdAt.getTime()) / 1000);
  return ageSeconds >= UNVERIFIED_ACCOUNT_TTL_SECONDS;
}

async function getOrDeleteExpiredUnverifiedUserByEmail(email) {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  if (isExpiredUnverifiedAccount(user)) {
    await deleteUser(user.id);
    return null;
  }

  return user;
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

async function createVerificationOtp(user) {
  const otp = String(crypto.randomInt(100000, 1000000));
  const expiresAt = Math.floor(Date.now() / 1000) + EMAIL_VERIFY_OTP_TTL_SECONDS;

  await revokeAllEmailVerificationTokens(user.id);
  await storeEmailVerificationOtp(user.id, otp, expiresAt);

  return otp;
}

function getResendCooldownSeconds(tokenRow) {
  if (!tokenRow?.createdAt) {
    return 0;
  }

  const createdAtMs = new Date(tokenRow.createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return 0;
  }

  const ageSeconds = Math.floor((Date.now() - createdAtMs) / 1000);
  return Math.max(0, EMAIL_VERIFY_RESEND_COOLDOWN_SECONDS - ageSeconds);
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
  const existingUser = await getOrDeleteExpiredUnverifiedUserByEmail(normalizedEmail);

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

  const verificationOtp = await createVerificationOtp(user);

  await sendEmail({
    to: user.email,
    subject: "Your verification code",
    text: `Welcome ${user.name}.\n\nYour verification code is: ${verificationOtp}\n\nThis code expires in 10 minutes.\nUse it in POST /api/v1/auth/verify-email-otp with your email address.`
  });

  return {
    user: publicUser(user),
    verificationRequired: true,
    verificationMessage: "A verification code has been sent to your email address"
  };
}

async function resendVerificationOtp({ email }) {
  await ensureInitialized();

  const normalizedEmail = normalizeEmail(email);
  const user = await getOrDeleteExpiredUnverifiedUserByEmail(normalizedEmail);

  if (!user) {
    throw createApiError(404, "Account not found");
  }

  if (user.isEmailVerified) {
    throw createApiError(400, "Email is already verified");
  }

  const latestOtp = await findLatestEmailVerificationToken(user.id);
  const cooldownSeconds = getResendCooldownSeconds(latestOtp);

  if (cooldownSeconds > 0) {
    throw createApiError(
      429,
      `Please wait ${cooldownSeconds} second${cooldownSeconds === 1 ? "" : "s"} before requesting another code`
    );
  }

  const verificationOtp = await createVerificationOtp(user);

  await sendEmail({
    to: user.email,
    subject: "Your verification code",
    text: `Your verification code is: ${verificationOtp}\n\nThis code expires in 10 minutes.\nUse it in POST /api/v1/auth/verify-email-otp with your email address.`
  });

  return {
    message: "A new verification code has been sent to your email address"
  };
}

async function loginUser({ email, password }, expectedRole = "user") {
  await ensureInitialized();

  const normalizedEmail = normalizeEmail(email);
  const user = await getOrDeleteExpiredUnverifiedUserByEmail(normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createApiError(401, "Invalid email or password");
  }

  if (!user.isEmailVerified) {
    throw createApiError(403, "Email is not verified. Please verify your OTP first.");
  }

  if (expectedRole && user.role !== expectedRole) {
    throw createApiError(403, "You are not allowed to sign in from this endpoint");
  }

  const updatedUser = await updateUser(user.id, { lastLoginAt: new Date() });

  return {
    user: publicUser(updatedUser),
    session: await createSessionTokens(updatedUser)
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
  let verificationOtp = null;

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
    verificationOtp = await createVerificationOtp(updatedUser);
    await sendEmail({
      to: updatedUser.email,
      subject: "Your verification code",
      text: `Your email was changed.\n\nYour verification code is: ${verificationOtp}\n\nThis code expires in 10 minutes.\nUse it in POST /api/v1/auth/verify-email-otp with your email address.`
    });
  }

  return {
    user: publicUser(await findUserById(user.id)),
    verificationRequired: Boolean(verificationOtp),
    verificationMessage: verificationOtp ? "A verification code has been sent to your email address" : undefined
  };
}

async function removeUser(userId) {
  await ensureInitialized();

  await revokeAllUserTokens(userId);
  const removed = await deleteUser(userId);

  if (!removed) {
    throw createApiError(404, "Account not found");
  }

  return publicUser(removed);
}

async function deleteCurrentUser(userId) {
  return removeUser(userId);
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

async function verifyEmailOtp({ email, otp }) {
  await ensureInitialized();

  const normalizedEmail = normalizeEmail(email);
  const user = await getOrDeleteExpiredUnverifiedUserByEmail(normalizedEmail);

  if (!user) {
    throw createApiError(404, "Account not found");
  }

  const code = String(otp || "").trim();

  if (!/^\d{6}$/.test(code)) {
    throw createApiError(400, "A 6-digit verification code is required");
  }

  const record = await consumeEmailVerificationOtp(user.id, code);

  if (!record) {
    throw createApiError(401, "Verification code is invalid or expired");
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
  deleteCurrentUser,
  resendVerificationOtp,
  resetPassword,
  updateCurrentUser,
  verifyAccessTokenFromHeader,
  verifyEmail,
  verifyEmailOtp
};
