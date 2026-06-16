const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.post("/register", notImplemented("Auth register"));
router.post("/login", notImplemented("Auth login"));
router.post("/logout", notImplemented("Auth logout"));
router.post("/refresh-token", notImplemented("Auth token refresh"));
router.post("/forgot-password", notImplemented("Auth forgot password"));
router.post("/reset-password", notImplemented("Auth reset password"));
router.post("/verify-email", notImplemented("Auth verify email"));
router.get("/me", notImplemented("Fetch authenticated user"));

module.exports = router;
