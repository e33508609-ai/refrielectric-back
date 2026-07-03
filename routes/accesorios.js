// routes/accesorios.js
const express = require("express");
const router = express.Router();

const accesoriosController = require("../controllers/accesoriosController");
const cambiosController = require("../controllers/cambiosController");

// ============================================
// RUTAS PARA EL INVENTARIO DE ACCESORIOS
// ============================================
router.get("/inventario", accesoriosController.listar);           // ← Cambiado
router.get("/inventario/disponibles", accesoriosController.disponibles); // ← Cambiado
router.get("/inventario/:id", accesoriosController.obtener);      // ← Cambiado
router.post("/inventario", accesoriosController.crear);           // ← Cambiado
router.put("/inventario/:id", accesoriosController.actualizar);   // ← Cambiado
router.delete("/inventario/:id", accesoriosController.eliminar);  // ← Cambiado

// ============================================
// RUTAS PARA EL HISTORIAL DE CAMBIOS
// ============================================
router.get("/cambios", cambiosController.listar);
router.get("/cambios/:id", cambiosController.obtener);
router.post("/cambios", cambiosController.crear);
router.put("/cambios/:id", cambiosController.actualizar);
router.delete("/cambios/:id", cambiosController.eliminar);

module.exports = router;