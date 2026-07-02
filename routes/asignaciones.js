const express = require("express");

const router = express.Router();

const asignacionesController = require("../controllers/asignacionesController");

router.get("/", asignacionesController.listar);

router.get("/:id", asignacionesController.obtener);

router.post("/", asignacionesController.crear);

router.put("/:id", asignacionesController.actualizar);

router.delete("/:id", asignacionesController.eliminar);

module.exports = router;