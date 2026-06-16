const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List question status records"));
router.get("/:userId", notImplemented("List question status by user"));
router.get("/:userId/:questionId", notImplemented("Get question status for a user"));
router.patch("/:userId/:questionId", notImplemented("Update question status for a user"));

module.exports = router;
