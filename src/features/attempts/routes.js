const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List attempts"));
router.get("/:attemptId", notImplemented("Get attempt by id"));
router.patch("/:attemptId", notImplemented("Update attempt by id"));
router.post("/:attemptId/submit", notImplemented("Submit attempt"));
router.get("/:attemptId/answers", notImplemented("List attempt answers"));
router.post("/:attemptId/answers", notImplemented("Record attempt answer"));
router.patch("/:attemptId/answers/:answerId", notImplemented("Update attempt answer"));
router.delete("/:attemptId/answers/:answerId", notImplemented("Delete attempt answer"));

module.exports = router;
