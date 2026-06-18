const { Router } = require("express");
const { authenticate } = require("../../middlewares/authenticate");
const { createApiError } = require("../../shared/http/apiError");
const { asyncHandler } = require("../../shared/http/asyncHandler");
const {
  getAccountStats,
  getCurrentUser,
  listPublicUsers,
  registerUser,
  removeUser,
  updateCurrentUser
} = require("../../shared/auth/authService");
const { requireRole } = require("../../middlewares/requireRole");

const router = Router();

function sendSuccess(res, statusCode, message, data) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data ? { data } : {})
  });
}

function canManageUser(req, userId) {
  return req.user && (req.user.role === "admin" || String(req.user.id) === String(userId));
}

router.get(
  "/",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const users = await listPublicUsers();

    return sendSuccess(res, 200, "Users fetched successfully", { users });
  })
);

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.body || {});

    return sendSuccess(res, 201, "User created successfully", {
      user: result.user,
      session: result.session,
      verificationToken: result.verificationToken
    });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await getCurrentUser(req.user.id);

    return sendSuccess(res, 200, "Profile fetched successfully", { user });
  })
);

router.patch(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await updateCurrentUser(req.user.id, req.body || {});

    return sendSuccess(res, 200, "Profile updated successfully", {
      user: result.user,
      verificationToken: result.verificationToken
    });
  })
);

router.get(
  "/me/stats",
  authenticate,
  asyncHandler(async (req, res) => {
    const stats = await getAccountStats(req.user.id);

    return sendSuccess(res, 200, "Profile stats fetched successfully", { stats });
  })
);

router.get(
  "/:userId",
  authenticate,
  asyncHandler(async (req, res) => {
    if (!canManageUser(req, req.params.userId)) {
      throw createApiError(403, "You do not have permission to access this profile");
    }

    const user = await getCurrentUser(req.params.userId);

    return sendSuccess(res, 200, "User fetched successfully", { user });
  })
);

router.patch(
  "/:userId",
  authenticate,
  asyncHandler(async (req, res) => {
    if (!canManageUser(req, req.params.userId)) {
      throw createApiError(403, "You do not have permission to update this profile");
    }

    const result = await updateCurrentUser(req.params.userId, req.body || {});

    return sendSuccess(res, 200, "User updated successfully", {
      user: result.user,
      verificationToken: result.verificationToken
    });
  })
);

router.delete(
  "/:userId",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const user = await removeUser(req.params.userId);

    return sendSuccess(res, 200, "User deleted successfully", { user });
  })
);

router.get(
  "/:userId/stats",
  authenticate,
  asyncHandler(async (req, res) => {
    if (!canManageUser(req, req.params.userId)) {
      throw createApiError(403, "You do not have permission to access these statistics");
    }

    const stats = await getAccountStats(req.params.userId);

    return sendSuccess(res, 200, "User stats fetched successfully", { stats });
  })
);

module.exports = router;
