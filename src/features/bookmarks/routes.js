const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List bookmarks"));
router.post("/", notImplemented("Add bookmark"));
router.delete("/:questionId", notImplemented("Remove bookmark"));
router.get("/:userId", notImplemented("List bookmarks by user"));

module.exports = router;
