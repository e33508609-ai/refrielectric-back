// controllers/cambiosController.js
const db = require("../db");

// ============================================
// LISTAR CAMBIOS DE ACCESORIOS
// ============================================
exports.listar = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                c.id_cambio,
                c.id_equipo,
                c.id_accesorio,
                e.equipo,
                e.marca AS equipo_marca,
                e.modelo AS equipo_modelo,
                e.serial AS equipo_serial,
                r.nombre AS responsable,
                a.tipo_accesorio,              -- ← De la tabla accesorios
                a.marca AS accesorio_marca,    -- ← De la tabla accesorios
                a.referencia,                  -- ← De la tabla accesorios
                a.serial AS accesorio_serial,  -- ← De la tabla accesorios
                c.fecha_asignacion,
                DATEDIFF(CURDATE(), c.fecha_asignacion) AS dias_con_accesorio,
                c.fecha_devolucion,
                c.observaciones
            FROM cambios_accesorios c
            INNER JOIN equipos e ON c.id_equipo = e.id_equipo
            INNER JOIN accesorios a ON c.id_accesorio = a.id_accesorio  -- ← JOIN CON ACCESORIOS
            LEFT JOIN asignacion_equipos ae ON c.id_equipo = ae.id_equipo AND ae.estado = 'ASIGNADO'
            LEFT JOIN responsables r ON ae.id_responsable = r.id_responsable
            ORDER BY c.fecha_asignacion DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al listar los cambios de accesorios",
            error: error.message
        });
    }
};

// ============================================
// OBTENER CAMBIO POR ID
// ============================================
exports.obtener = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                c.id_cambio,
                c.id_equipo,
                c.id_accesorio,
                e.equipo,
                e.marca AS equipo_marca,
                e.modelo AS equipo_modelo,
                e.serial AS equipo_serial,
                a.tipo_accesorio,
                a.marca AS accesorio_marca,
                a.referencia,
                a.serial AS accesorio_serial,
                c.fecha_asignacion,
                DATEDIFF(CURDATE(), c.fecha_asignacion) AS dias_con_accesorio,
                c.fecha_devolucion,
                c.observaciones
            FROM cambios_accesorios c
            INNER JOIN equipos e ON c.id_equipo = e.id_equipo
            INNER JOIN accesorios a ON c.id_accesorio = a.id_accesorio
            WHERE c.id_cambio = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Cambio no encontrado"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al obtener el cambio",
            error: error.message
        });
    }
};

// ============================================
// CREAR CAMBIO DE ACCESORIO
// ============================================
exports.crear = async (req, res) => {
    try {
        const {
            id_equipo,
            id_accesorio,
            fecha_asignacion,
            observaciones
        } = req.body;

        // Validación de campos requeridos
        if (!id_equipo || !id_accesorio || !fecha_asignacion) {
            return res.status(400).json({
                mensaje: "Faltan campos requeridos: id_equipo, id_accesorio y fecha_asignacion son obligatorios"
            });
        }

        // Verificar que el accesorio existe y está disponible
        const [accesorio] = await db.query(
            "SELECT estado FROM accesorios WHERE id_accesorio = ?",
            [id_accesorio]
        );

        if (accesorio.length === 0) {
            return res.status(404).json({
                mensaje: "Accesorio no encontrado"
            });
        }

        if (accesorio[0].estado === 'ASIGNADO') {
            return res.status(400).json({
                mensaje: "Este accesorio ya está asignado a otro equipo"
            });
        }

        await db.query('START TRANSACTION');

        // 1. Insertar en cambios_accesorios
        await db.query(`
            INSERT INTO cambios_accesorios
            (id_equipo, id_accesorio, fecha_asignacion, observaciones)
            VALUES (?, ?, ?, ?)
        `, [
            id_equipo,
            id_accesorio,
            fecha_asignacion,
            observaciones || null
        ]);

        // 2. Actualizar estado del accesorio a 'ASIGNADO'
        await db.query(
            "UPDATE accesorios SET estado = 'ASIGNADO' WHERE id_accesorio = ?",
            [id_accesorio]
        );

        await db.query('COMMIT');

        const dias = Math.max(0, Math.floor((new Date() - new Date(fecha_asignacion)) / (1000 * 60 * 60 * 24)));

        res.status(201).json({
            mensaje: "Accesorio asignado correctamente",
            datos: {
                id_equipo,
                id_accesorio,
                fecha_asignacion,
                dias_con_accesorio: dias
            }
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            mensaje: "Error al asignar el accesorio",
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR CAMBIO DE ACCESORIO
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            id_equipo,
            id_accesorio,
            fecha_asignacion,
            observaciones
        } = req.body;

        const [existing] = await db.query(
            "SELECT id_cambio FROM cambios_accesorios WHERE id_cambio = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                mensaje: "Cambio no encontrado"
            });
        }

        await db.query('START TRANSACTION');

        await db.query(`
            UPDATE cambios_accesorios
            SET
                id_equipo = ?,
                id_accesorio = ?,
                fecha_asignacion = ?,
                observaciones = ?
            WHERE id_cambio = ?
        `, [
            id_equipo,
            id_accesorio,
            fecha_asignacion,
            observaciones || null,
            id
        ]);

        await db.query('COMMIT');

        const dias = Math.max(0, Math.floor((new Date() - new Date(fecha_asignacion)) / (1000 * 60 * 60 * 24)));

        res.json({
            mensaje: "Cambio actualizado correctamente",
            datos: {
                id_cambio: id,
                dias_con_accesorio: dias
            }
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            mensaje: "Error al actualizar el cambio",
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR CAMBIO DE ACCESORIO
// ============================================
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            "SELECT id_accesorio FROM cambios_accesorios WHERE id_cambio = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                mensaje: "Cambio no encontrado"
            });
        }

        await db.query('START TRANSACTION');

        // Liberar el accesorio (cambiar a DISPONIBLE)
        await db.query(
            "UPDATE accesorios SET estado = 'DISPONIBLE' WHERE id_accesorio = ?",
            [existing[0].id_accesorio]
        );

        // Eliminar el cambio
        await db.query(
            "DELETE FROM cambios_accesorios WHERE id_cambio = ?",
            [id]
        );

        await db.query('COMMIT');

        res.json({
            mensaje: "Cambio eliminado correctamente"
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar el cambio",
            error: error.message
        });
    }
};

// ============================================
// DEVOLVER ACCESORIO (fecha_devolucion)
// ============================================
exports.devolver = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_devolucion, observaciones } = req.body;

        const [cambio] = await db.query(
            "SELECT id_accesorio, fecha_devolucion FROM cambios_accesorios WHERE id_cambio = ?",
            [id]
        );

        if (cambio.length === 0) {
            return res.status(404).json({
                mensaje: "Cambio no encontrado"
            });
        }

        if (cambio[0].fecha_devolucion !== null) {
            return res.status(400).json({
                mensaje: "Este accesorio ya fue devuelto"
            });
        }

        const fechaDev = fecha_devolucion || new Date().toISOString().split('T')[0];

        await db.query('START TRANSACTION');

        // 1. Actualizar fecha_devolucion en cambios_accesorios
        await db.query(`
            UPDATE cambios_accesorios
            SET
                fecha_devolucion = ?,
                observaciones = ?
            WHERE id_cambio = ?
        `, [
            fechaDev,
            observaciones || null,
            id
        ]);

        // 2. Liberar el accesorio (cambiar a DISPONIBLE)
        await db.query(
            "UPDATE accesorios SET estado = 'DISPONIBLE' WHERE id_accesorio = ?",
            [cambio[0].id_accesorio]
        );

        await db.query('COMMIT');

        // Calcular días que estuvo asignado
        const [fechaAsignacion] = await db.query(
            "SELECT fecha_asignacion FROM cambios_accesorios WHERE id_cambio = ?",
            [id]
        );

        const dias = Math.max(0, Math.floor(
            (new Date(fechaDev) - new Date(fechaAsignacion[0].fecha_asignacion)) / (1000 * 60 * 60 * 24)
        ));

        res.json({
            mensaje: "Accesorio devuelto correctamente",
            datos: {
                id_cambio: id,
                fecha_devolucion: fechaDev,
                dias_asignado: dias
            }
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            mensaje: "Error al devolver el accesorio",
            error: error.message
        });
    }
};