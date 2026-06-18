const crypto = require("crypto");
const { createApiError } = require("../http/apiError");

function base64UrlEncode(input) {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

function base64UrlDecode(input) {
  return JSON.parse(Buffer.from(input, "base64url").toString("utf8"));
}

function createSignature(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function safeCompare(a, b) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

function signToken(payload, secret, expiresInSeconds) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const encodedPayload = base64UrlEncode({
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds
  });
  const signature = createSignature(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

function verifyToken(token, secret, expectedType) {
  if (!token || typeof token !== "string") {
    throw createApiError(401, "Authentication token is required");
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    throw createApiError(401, "Authentication token is invalid");
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = createSignature(encodedPayload, secret);

  if (!safeCompare(signature, expectedSignature)) {
    throw createApiError(401, "Authentication token is invalid");
  }

  const payload = base64UrlDecode(encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp <= now) {
    throw createApiError(401, "Authentication token has expired");
  }

  if (expectedType && payload.type !== expectedType) {
    throw createApiError(401, "Authentication token has invalid type");
  }

  return payload;
}

function extractBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== "string") {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");

  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

module.exports = {
  extractBearerToken,
  signToken,
  verifyToken
};
