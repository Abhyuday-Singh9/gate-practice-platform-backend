const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List branches"));
router.post("/", notImplemented("Create branch"));
router.get("/:branchId", notImplemented("Get branch by id"));
router.patch("/:branchId", notImplemented("Update branch by id"));
router.delete("/:branchId", notImplemented("Delete branch by id"));
router.get("/:branchId/subjects", notImplemented("List subjects by branch"));

module.exports = router;
