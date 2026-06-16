const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List subjects"));
router.post("/", notImplemented("Create subject"));
router.get("/:subjectId", notImplemented("Get subject by id"));
router.patch("/:subjectId", notImplemented("Update subject by id"));
router.delete("/:subjectId", notImplemented("Delete subject by id"));
router.get("/:subjectId/topics", notImplemented("List topics by subject"));
router.get("/:subjectId/questions", notImplemented("List questions by subject"));

module.exports = router;
