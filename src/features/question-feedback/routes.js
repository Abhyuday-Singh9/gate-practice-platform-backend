const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List question feedback"));
router.post("/", notImplemented("Create question feedback"));
router.get("/:feedbackId", notImplemented("Get question feedback by id"));
router.patch("/:feedbackId", notImplemented("Update question feedback by id"));
router.delete("/:feedbackId", notImplemented("Delete question feedback by id"));

module.exports = router;
