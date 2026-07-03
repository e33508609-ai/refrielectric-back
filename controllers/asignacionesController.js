// controllers/asignacionesController.js
const db = require("../db");

// ============================================
// LISTAR ASIGNACIONES
// ============================================
exports.listar = async (req, res) => {
    try {
        const [rows] = await db.query(`
            WITH ultimo_cambio AS (
                SELECT 
                    c1.*
                FROM cambios_accesorios c1
                INNER JOIN (
                    SELECT 
                        id_equipo,
                        MAX(fecha_asignacion) AS ultima_fecha
                    FROM cambios_accesorios
                    GROUP BY id_equipo
                ) c2 ON c1.id_equipo = c2.id_equipo AND c1.fecha_asignacion = c2.ultima_fecha
            )
            SELECT
                a.id_asignacion,
                a.id_equipo,
                a.id_responsable,
                a.fecha_asignacion,
                a.fecha_devolucion,
                a.estado,
                a.observaciones AS asignacion_observaciones,
                e.equipo,
                e.marca AS equipo_marca,
                e.modelo AS equipo_modelo,
                e.serial AS equipo_serial,
                r.id_responsable,
                r.nombre AS responsable,
                r.area,
                r.cargo,
                r.punto,
                DATEDIFF(CURDATE(), a.fecha_asignacion) AS dias_asignado,
                -- DATOS DEL ACCESORIO (desde la tabla accesorios)
                acc.tipo_accesorio,                    -- ← CAMBIADO
                acc.marca AS accesorio_marca,          -- ← CAMBIADO
                acc.referencia AS referencia_accesorio, -- ← CAMBIADO
                acc.serial AS accesorio_serial,        -- ← CAMBIADO
                c.fecha_asignacion AS fecha_ultimo_cambio,
                DATEDIFF(CURDATE(), c.fecha_asignacion) AS dias_con_accesorio,
                c.observaciones AS cambio_observaciones
            FROM asignacion_equipos a
            INNER JOIN equipos e ON a.id_equipo = e.id_equipo
            INNER JOIN responsables r ON a.id_responsable = r.id_responsable
            LEFT JOIN ultimo_cambio c ON a.id_equipo = c.id_equipo
            LEFT JOIN accesorios acc ON c.id_accesorio = acc.id_accesorio  -- ← NUEVO JOIN
            ORDER BY a.fecha_asignacion DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al listar las asignaciones",
            error: error.message
        });
    }
};

// ============================================
// OBTENER ASIGNACIÓN POR ID
// ============================================
exports.obtener = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            WITH ultimo_cambio AS (
                SELECT 
                    c1.*
                FROM cambios_accesorios c1
                INNER JOIN (
                    SELECT 
                        id_equipo,
                        MAX(fecha_asignacion) AS ultima_fecha
                    FROM cambios_accesorios
                    GROUP BY id_equipo
                ) c2 ON c1.id_equipo = c2.id_equipo AND c1.fecha_asignacion = c2.ultima_fecha
            )
            SELECT
                a.id_asignacion,
                a.id_equipo,
                a.id_responsable,
                a.fecha_asignacion,
                a.fecha_devolucion,
                a.estado,
                a.observaciones AS asignacion_observaciones,
                e.equipo,
                e.marca AS equipo_marca,
                e.modelo AS equipo_modelo,
                e.serial AS equipo_serial,
                r.id_responsable,
                r.nombre AS responsable,
                r.area,
                r.cargo,
                r.punto,
                DATEDIFF(CURDATE(), a.fecha_asignacion) AS dias_asignado,
                acc.tipo_accesorio,                    -- ← CAMBIADO
                acc.marca AS accesorio_marca,          -- ← CAMBIADO
                acc.referencia AS referencia_accesorio, -- ← CAMBIADO
                acc.serial AS accesorio_serial,        -- ← CAMBIADO
                c.fecha_asignacion AS fecha_ultimo_cambio,
                DATEDIFF(CURDATE(), c.fecha_asignacion) AS dias_con_accesorio,
                c.observaciones AS cambio_observaciones
            FROM asignacion_equipos a
            INNER JOIN equipos e ON a.id_equipo = e.id_equipo
            INNER JOIN responsables r ON a.id_responsable = r.id_responsable
            LEFT JOIN ultimo_cambio c ON a.id_equipo = c.id_equipo
            LEFT JOIN accesorios acc ON c.id_accesorio = acc.id_accesorio  -- ← NUEVO JOIN
            WHERE a.id_asignacion = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Asignación no encontrada"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al obtener la asignación",
            error: error.message
        });
    }
};

// ============================================
// CREAR ASIGNACIÓN
// ============================================
exports.crear = async (req, res) => {
    try {
        const {
            id_equipo,
            id_responsable,
            fecha_asignacion,
            observaciones
        } = req.body;

        if (!id_equipo || !id_responsable || !fecha_asignacion) {
            return res.status(400).json({
                mensaje: "Faltan campos requeridos: id_equipo, id_responsable y fecha_asignacion son obligatorios"
            });
        }

        const [equipo] = await db.query(
            "SELECT estado FROM equipos WHERE id_equipo = ?",
            [id_equipo]
        );

        if (equipo.length === 0) {
            return res.status(404).json({
                mensaje: "Equipo no encontrado"
            });
        }

        if (equipo[0].estado === "ASIGNADO") {
            return res.status(400).json({
                mensaje: "Este equipo ya se encuentra asignado"
            });
        }

        await db.query('START TRANSACTION');

        await db.query(`
            INSERT INTO asignacion_equipos
            (id_equipo, id_responsable, fecha_asignacion, estado, observaciones)
            VALUES (?, ?, ?, ?, ?)
        `, [
            id_equipo,
            id_responsable,
            fecha_asignacion,
            "ASIGNADO",
            observaciones || null
        ]);

        await db.query(
            "UPDATE equipos SET estado='ASIGNADO' WHERE id_equipo=?",
            [id_equipo]
        );

        await db.query('COMMIT');

        res.status(201).json({
            mensaje: "Equipo asignado correctamente"
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            mensaje: "Error al asignar el equipo",
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR ASIGNACIÓN
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            id_equipo,
            id_responsable,
            fecha_asignacion,
            fecha_devolucion,
            estado,
            observaciones
        } = req.body;

        const [existing] = await db.query(
            "SELECT id_asignacion FROM asignacion_equipos WHERE id_asignacion = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                mensaje: "Asignación no encontrada"
            });
        }

        await db.query('START TRANSACTION');

        await db.query(`
            UPDATE asignacion_equipos
            SET
                id_equipo = ?,
                id_responsable = ?,
                fecha_asignacion = ?,
                fecha_devolucion = ?,
                estado = ?,
                observaciones = ?
            WHERE id_asignacion = ?
        `, [
            id_equipo,
            id_responsable,
            fecha_asignacion,
            fecha_devolucion || null,
            estado,
            observaciones || null,
            id
        ]);

        await db.query(
            "UPDATE equipos SET estado = ? WHERE id_equipo = ?",
            [
                estado === "DEVUELTO" ? "DISPONIBLE" : "ASIGNADO",
                id_equipo
            ]
        );

        await db.query('COMMIT');

        res.json({
            mensaje: "Asignación actualizada correctamente"
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            mensaje: "Error al actualizar la asignación",
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR ASIGNACIÓN
// ============================================
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT id_equipo FROM asignacion_equipos WHERE id_asignacion = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Asignación no encontrada"
            });
        }

        await db.query('START TRANSACTION');

        await db.query(
            "UPDATE equipos SET estado='DISPONIBLE' WHERE id_equipo = ?",
            [rows[0].id_equipo]
        );

        await db.query(
            "DELETE FROM asignacion_equipos WHERE id_asignacion = ?",
            [id]
        );

        await db.query('COMMIT');

        res.json({
            mensaje: "Asignación eliminada correctamente"
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar la asignación",
            error: error.message
        });
    }
};

// ============================================
// DEVOLVER EQUIPO
// ============================================
exports.devolver = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_devolucion, observaciones } = req.body;

        const [asignacion] = await db.query(
            "SELECT id_equipo, estado, fecha_asignacion FROM asignacion_equipos WHERE id_asignacion = ?",
            [id]
        );

        if (asignacion.length === 0) {
            return res.status(404).json({
                mensaje: "Asignación no encontrada"
            });
        }

        if (asignacion[0].estado === "DEVUELTO") {
            return res.status(400).json({
                mensaje: "Este equipo ya fue devuelto"
            });
        }

        const fechaDev = fecha_devolucion || new Date().toISOString().split('T')[0];

        await db.query('START TRANSACTION');

        await db.query(`
            UPDATE asignacion_equipos
            SET
                fecha_devolucion = ?,
                estado = 'DEVUELTO',
                observaciones = ?
            WHERE id_asignacion = ?
        `, [
            fechaDev,
            observaciones || null,
            id
        ]);

        await db.query(
            "UPDATE equipos SET estado='DISPONIBLE' WHERE id_equipo = ?",
            [asignacion[0].id_equipo]
        );

        await db.query('COMMIT');

        const diasAsignado = Math.max(0, Math.floor(
            (new Date(fechaDev) - new Date(asignacion[0].fecha_asignacion)) / (1000 * 60 * 60 * 24)
        ));

        res.json({
            mensaje: "Equipo devuelto correctamente",
            datos: {
                id_asignacion: id,
                fecha_asignacion: asignacion[0].fecha_asignacion,
                fecha_devolucion: fechaDev,
                dias_asignado: diasAsignado
            }
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            mensaje: "Error al devolver el equipo",
            error: error.message
        });
    }
};