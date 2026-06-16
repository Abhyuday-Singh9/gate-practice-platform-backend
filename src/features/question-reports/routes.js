const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List question reports"));
router.post("/", notImplemented("Create question report"));
router.get("/:reportId", notImplemented("Get question report by id"));
router.patch("/:reportId", notImplemented("Update question report by id"));
router.delete("/:reportId", notImplemented("Delete question report by id"));

module.exports = router;
