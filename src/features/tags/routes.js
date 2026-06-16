const { Router } = require("express");
const { notImplemented } = require("../../shared/http/notImplemented");

const router = Router();

router.get("/", notImplemented("List tags"));
router.post("/", notImplemented("Create tag"));
router.get("/:tagId", notImplemented("Get tag by id"));
router.patch("/:tagId", notImplemented("Update tag by id"));
router.delete("/:tagId", notImplemented("Delete tag by id"));

module.exports = router;
