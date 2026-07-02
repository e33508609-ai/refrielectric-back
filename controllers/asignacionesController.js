const db = require("../db");

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
                        MAX(fecha_cambio) AS ultima_fecha
                    FROM cambios_accesorios
                    GROUP BY id_equipo
                ) c2 ON c1.id_equipo = c2.id_equipo AND c1.fecha_cambio = c2.ultima_fecha
            )
            SELECT
                a.id_asignacion,
                a.id_equipo,
                a.id_responsable,
                a.fecha_asignacion,
                a.fecha_devolucion,
                a.estado,
                a.observaciones,
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
                c.tipo_accesorio,
                c.accesorio_nuevo AS accesorio_actual,
                c.marca AS accesorio_marca,
                c.fecha_cambio AS fecha_ultimo_cambio,
                DATEDIFF(CURDATE(), c.fecha_cambio) AS dias_con_accesorio
            FROM asignacion_equipos a
            INNER JOIN equipos e ON a.id_equipo = e.id_equipo
            INNER JOIN responsables r ON a.id_responsable = r.id_responsable
            LEFT JOIN ultimo_cambio c ON a.id_equipo = c.id_equipo
            ORDER BY a.fecha_asignacion DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al listar las asignaciones"
        });
    }
};

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
                        MAX(fecha_cambio) AS ultima_fecha
                    FROM cambios_accesorios
                    GROUP BY id_equipo
                ) c2 ON c1.id_equipo = c2.id_equipo AND c1.fecha_cambio = c2.ultima_fecha
            )
            SELECT
                a.id_asignacion,
                a.id_equipo,
                a.id_responsable,
                a.fecha_asignacion,
                a.fecha_devolucion,
                a.estado,
                a.observaciones,
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
                c.tipo_accesorio,
                c.accesorio_nuevo AS accesorio_actual,
                c.marca AS accesorio_marca,
                c.fecha_cambio AS fecha_ultimo_cambio,
                DATEDIFF(CURDATE(), c.fecha_cambio) AS dias_con_accesorio
            FROM asignacion_equipos a
            INNER JOIN equipos e ON a.id_equipo = e.id_equipo
            INNER JOIN responsables r ON a.id_responsable = r.id_responsable
            LEFT JOIN ultimo_cambio c ON a.id_equipo = c.id_equipo
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
            mensaje: "Error al obtener la asignación"
        });
    }
};

exports.crear = async (req, res) => {
    try {
        const {
            id_equipo,
            id_responsable,
            fecha_asignacion,
            observaciones
        } = req.body;

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

        await db.query(
            `INSERT INTO asignacion_equipos
            (id_equipo, id_responsable, fecha_asignacion, estado, observaciones)
            VALUES (?,?,?,?,?)`,
            [
                id_equipo,
                id_responsable,
                fecha_asignacion,
                "ASIGNADO",
                observaciones || null
            ]
        );

        await db.query(
            "UPDATE equipos SET estado='ASIGNADO' WHERE id_equipo=?",
            [id_equipo]
        );

        res.status(201).json({
            mensaje: "Equipo asignado correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al asignar el equipo"
        });
    }
};

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

        await db.query(
            `UPDATE asignacion_equipos
            SET
                id_equipo=?,
                id_responsable=?,
                fecha_asignacion=?,
                fecha_devolucion=?,
                estado=?,
                observaciones=?
            WHERE id_asignacion=?`,
            [
                id_equipo,
                id_responsable,
                fecha_asignacion,
                fecha_devolucion || null,
                estado,
                observaciones || null,
                id
            ]
        );

        await db.query(
            "UPDATE equipos SET estado=? WHERE id_equipo=?",
            [
                estado === "DEVUELTO" ? "DISPONIBLE" : "ASIGNADO",
                id_equipo
            ]
        );

        res.json({
            mensaje: "Asignación actualizada correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al actualizar la asignación"
        });
    }
};

exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT id_equipo FROM asignacion_equipos WHERE id_asignacion=?",
            [id]
        );

        if (rows.length > 0) {
            await db.query(
                "UPDATE equipos SET estado='DISPONIBLE' WHERE id_equipo=?",
                [rows[0].id_equipo]
            );
        }

        await db.query(
            "DELETE FROM asignacion_equipos WHERE id_asignacion=?",
            [id]
        );

        res.json({
            mensaje: "Asignación eliminada correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar la asignación"
        });
    }
};

exports.devolver = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_devolucion, observaciones } = req.body;

        const [asignacion] = await db.query(
            "SELECT id_equipo, estado FROM asignacion_equipos WHERE id_asignacion = ?",
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

        await db.query(
            `UPDATE asignacion_equipos
            SET
                fecha_devolucion = ?,
                estado = 'DEVUELTO',
                observaciones = ?
            WHERE id_asignacion = ?`,
            [
                fecha_devolucion || new Date().toISOString().split('T')[0],
                observaciones || null,
                id
            ]
        );

        await db.query(
            "UPDATE equipos SET estado='DISPONIBLE' WHERE id_equipo=?",
            [asignacion[0].id_equipo]
        );

        res.json({
            mensaje: "Equipo devuelto correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al devolver el equipo"
        });
    }
};