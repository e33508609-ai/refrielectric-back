const express = require("express");

const router = express.Router();

const insumosController = require("../controllers/insumosController");

router.get("/", insumosController.listar);

router.get("/:id", insumosController.obtener);

router.post("/", insumosController.crear);

router.put("/:id", insumosController.actualizar);

router.delete("/:id", insumosController.eliminar);

module.exports = router;