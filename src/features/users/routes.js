const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List users"));
router.post("/", notImplemented("Create user"));
router.get("/me", notImplemented("Get my profile"));
router.patch("/me", notImplemented("Update my profile"));
router.get("/me/stats", notImplemented("Get my performance statistics"));
router.get("/:userId", notImplemented("Get user by id"));
router.patch("/:userId", notImplemented("Update user by id"));
router.delete("/:userId", notImplemented("Delete user by id"));
router.get("/:userId/stats", notImplemented("Get user statistics by id"));

module.exports = router;
