const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List questions"));
router.post("/", notImplemented("Create question"));
router.get("/:questionId", notImplemented("Get question by id"));
router.patch("/:questionId", notImplemented("Update question by id"));
router.delete("/:questionId", notImplemented("Delete question by id"));
router.get("/:questionId/options", notImplemented("List question options"));
router.post("/:questionId/options", notImplemented("Create question option"));
router.patch("/:questionId/options/:optionId", notImplemented("Update question option"));
router.delete("/:questionId/options/:optionId", notImplemented("Delete question option"));
router.get("/:questionId/tags", notImplemented("List question tags"));
router.post("/:questionId/tags", notImplemented("Attach tags to question"));
router.delete("/:questionId/tags/:tagId", notImplemented("Detach tag from question"));
router.get("/:questionId/feedback", notImplemented("List question feedback"));
router.post("/:questionId/feedback", notImplemented("Create question feedback"));
router.get("/:questionId/reports", notImplemented("List question reports"));
router.post("/:questionId/reports", notImplemented("Create question report"));

module.exports = router;
