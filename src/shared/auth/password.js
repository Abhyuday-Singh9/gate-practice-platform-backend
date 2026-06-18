const crypto = require("crypto");

const PBKDF2_ITERATIONS = 120000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha512";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");

  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash).split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const candidate = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");

  const candidateBuffer = Buffer.from(candidate, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (candidateBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
}

module.exports = { hashPassword, verifyPassword };
