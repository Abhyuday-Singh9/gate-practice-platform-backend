const { Router } = require("express");
const { authenticate } = require("../../middlewares/authenticate");
const { requireRole } = require("../../middlewares/requireRole");
const { asyncHandler } = require("../../shared/http/asyncHandler");
const { listPublicUsers } = require("../../shared/auth/authService");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const users = await listPublicUsers();
    const totalUsers = users.length;
    const totalAdmins = users.filter((user) => user.role === "admin").length;
    const verifiedUsers = users.filter((user) => user.isEmailVerified).length;

    res.json({
      success: true,
      message: "Admin dashboard fetched successfully",
      data: {
        users: {
          totalUsers,
          totalAdmins,
          verifiedUsers
        }
      }
    });
  })
);

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      message: "Admin user list fetched successfully",
      data: {
        users: await listPublicUsers()
      }
    });
  })
);

router.get("/questions", notImplemented("Admin list questions"));
router.get("/tests", notImplemented("Admin list tests"));
router.get("/feedback", notImplemented("Admin list feedback"));
router.get("/reports", notImplemented("Admin list reports"));
router.patch("/feedback/:feedbackId", notImplemented("Admin review feedback"));
router.patch("/reports/:reportId", notImplemented("Admin review report"));

module.exports = router;
