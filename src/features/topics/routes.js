const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List topics"));
router.post("/", notImplemented("Create topic"));
router.get("/:topicId", notImplemented("Get topic by id"));
router.patch("/:topicId", notImplemented("Update topic by id"));
router.delete("/:topicId", notImplemented("Delete topic by id"));
router.get("/:topicId/questions", notImplemented("List questions by topic"));

module.exports = router;
