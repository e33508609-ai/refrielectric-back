const express = require("express");

const router = express.Router();

const equiposController = require("../controllers/equiposController");

router.get("/", equiposController.listar);

router.get("/:id", equiposController.obtener);

router.post("/", equiposController.crear);

router.put("/:id", equiposController.actualizar);

router.delete("/:id", equiposController.eliminar);

module.exports = router;