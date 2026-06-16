const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List mistake book entries"));
router.post("/", notImplemented("Add mistake book entry"));
router.delete("/:questionId", notImplemented("Remove mistake book entry"));
router.get("/:userId", notImplemented("List mistake book by user"));

module.exports = router;
