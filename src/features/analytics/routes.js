const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/dashboard", notImplemented("Get analytics dashboard"));
router.get("/questions/:questionId", notImplemented("Get question analytics"));
router.get("/subjects/:subjectId", notImplemented("Get subject analytics"));
router.get("/topics/:topicId", notImplemented("Get topic analytics"));
router.get("/strength", notImplemented("Get topic strength analysis"));
router.get("/trends", notImplemented("Get improvement trends"));

module.exports = router;
