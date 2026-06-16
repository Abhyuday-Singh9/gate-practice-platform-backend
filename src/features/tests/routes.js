const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List tests"));
router.post("/", notImplemented("Create test"));
router.get("/:testId", notImplemented("Get test by id"));
router.patch("/:testId", notImplemented("Update test by id"));
router.delete("/:testId", notImplemented("Delete test by id"));
router.post("/:testId/attempts", notImplemented("Start test attempt"));
router.get("/:testId/questions", notImplemented("List questions in test"));
router.post("/:testId/questions", notImplemented("Assign question to test"));
router.patch("/:testId/questions/:questionId", notImplemented("Update test question order"));
router.delete("/:testId/questions/:questionId", notImplemented("Remove question from test"));
router.get("/:testId/attempts", notImplemented("List attempts for test"));

module.exports = router;
