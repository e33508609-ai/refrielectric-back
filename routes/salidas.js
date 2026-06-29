const express = require("express");

const router = express.Router();

const salidasController = require("../controllers/salidasController");

router.get("/", salidasController.listar);

router.post("/", salidasController.registrar);

module.exports = router;