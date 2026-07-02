const express = require("express");

const router = express.Router();

const responsablesController = require("../controllers/responsablesController");

router.get("/", responsablesController.listar);

router.get("/:id", responsablesController.obtener);

router.post("/", responsablesController.crear);

router.put("/:id", responsablesController.actualizar);

router.delete("/:id", responsablesController.eliminar);

module.exports = router;