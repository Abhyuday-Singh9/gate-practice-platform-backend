const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/dashboard", notImplemented("Get admin dashboard"));
router.get("/users", notImplemented("Admin list users"));
router.get("/questions", notImplemented("Admin list questions"));
router.get("/tests", notImplemented("Admin list tests"));
router.get("/feedback", notImplemented("Admin list feedback"));
router.get("/reports", notImplemented("Admin list reports"));
router.patch("/feedback/:feedbackId", notImplemented("Admin review feedback"));
router.patch("/reports/:reportId", notImplemented("Admin review report"));

module.exports = router;
