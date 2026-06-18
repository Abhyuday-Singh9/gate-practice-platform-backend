const { Router } = require("express");
const { authenticate } = require("../../middlewares/authenticate");
const { asyncHandler } = require("../../shared/http/asyncHandler");
const {
  forgotPassword,
  getCurrentUser,
  loginAdmin,
  loginUser,
  logout,
  refreshSession,
  registerUser,
  resetPassword,
  verifyEmail
} = require("../../shared/auth/authService");

const router = Router();

function sendSuccess(res, statusCode, message, data) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data ? { data } : {})
  });
}

function getRefreshToken(req) {
  return req.body.refreshToken || req.headers["x-refresh-token"] || req.query.refreshToken || null;
}

function getToken(req) {
  return req.body.token || req.query.token || null;
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.body || {});

    return sendSuccess(res, 201, "Registration successful", {
      user: result.user,
      session: result.session,
      verificationToken: result.verificationToken
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const result = await loginUser(req.body || {});

    return sendSuccess(res, 200, "Login successful", {
      user: result.user,
      session: result.session
    });
  })
);

router.post(
  "/admin/login",
  asyncHandler(async (req, res) => {
    const result = await loginAdmin(req.body || {});

    return sendSuccess(res, 200, "Admin login successful", {
      user: result.user,
      session: result.session
    });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const result = await logout(getRefreshToken(req));

    return sendSuccess(res, 200, result.message);
  })
);

router.post(
  "/refresh-token",
  asyncHandler(async (req, res) => {
    const result = await refreshSession(getRefreshToken(req));

    return sendSuccess(res, 200, "Token refreshed successfully", {
      user: result.user,
      session: result.session
    });
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const result = await forgotPassword(req.body.email);

    return sendSuccess(res, 200, result.message, {
      resetToken: result.resetToken
    });
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body || {};
    const result = await resetPassword(token, newPassword);

    return sendSuccess(res, 200, "Password reset successful", {
      user: result.user
    });
  })
);

router.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const token = getToken(req);
    const result = await verifyEmail(token);

    return sendSuccess(res, 200, "Email verified successfully", {
      user: result.user
    });
  })
);

router.get(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const token = getToken(req);
    const result = await verifyEmail(token);

    return sendSuccess(res, 200, "Email verified successfully", {
      user: result.user
    });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await getCurrentUser(req.user.id);

    return sendSuccess(res, 200, "Authenticated user fetched successfully", {
      user
    });
  })
);

module.exports = router;
