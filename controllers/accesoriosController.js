const db = require("../db");

exports.listar = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                c.id_cambio,
                c.id_equipo,
                e.equipo,
                e.marca,
                e.modelo,
                e.serial,
                r.nombre AS responsable,
                c.tipo_accesorio,
                c.marca AS accesorio_marca,
                c.accesorio_anterior,
                c.accesorio_nuevo,
                c.fecha_cambio,
                DATEDIFF(CURDATE(), c.fecha_cambio) AS dias_con_accesorio,
                c.observaciones
            FROM cambios_accesorios c
            INNER JOIN equipos e ON c.id_equipo = e.id_equipo
            LEFT JOIN asignacion_equipos a ON c.id_equipo = a.id_equipo AND a.estado = 'ASIGNADO'
            LEFT JOIN responsables r ON a.id_responsable = r.id_responsable
            ORDER BY c.fecha_cambio DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al listar los cambios de accesorios"
        });
    }
};

exports.obtener = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                c.*,
                e.equipo,
                e.marca AS equipo_marca,
                e.modelo AS equipo_modelo,
                DATEDIFF(CURDATE(), c.fecha_cambio) AS dias_con_accesorio
            FROM cambios_accesorios c
            INNER JOIN equipos e ON c.id_equipo = e.id_equipo
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
            mensaje: "Error al obtener el cambio"
        });
    }
};

exports.crear = async (req, res) => {
    try {
        const {
            id_equipo,
            tipo_accesorio,
            marca,
            accesorio_anterior,
            accesorio_nuevo,
            fecha_cambio,
            observaciones
        } = req.body;

        await db.query('START TRANSACTION');

        await db.query(`
            INSERT INTO cambios_accesorios
            (id_equipo, tipo_accesorio, marca, accesorio_anterior, accesorio_nuevo, fecha_cambio, observaciones)
            VALUES (?,?,?,?,?,?,?)
        `, [
            id_equipo,
            tipo_accesorio,
            marca || null,
            accesorio_anterior || null,
            accesorio_nuevo,
            fecha_cambio,
            observaciones || null
        ]);

        await db.query('COMMIT');

        res.status(201).json({
            mensaje: "Cambio de accesorio registrado correctamente"
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            mensaje: "Error al registrar el cambio"
        });
    }
};

exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tipo_accesorio,
            marca,
            accesorio_anterior,
            accesorio_nuevo,
            fecha_cambio,
            observaciones
        } = req.body;

        await db.query(`
            UPDATE cambios_accesorios
            SET
                tipo_accesorio = ?,
                marca = ?,
                accesorio_anterior = ?,
                accesorio_nuevo = ?,
                fecha_cambio = ?,
                observaciones = ?
            WHERE id_cambio = ?
        `, [
            tipo_accesorio,
            marca || null,
            accesorio_anterior || null,
            accesorio_nuevo,
            fecha_cambio,
            observaciones || null,
            id
        ]);

        res.json({
            mensaje: "Cambio actualizado correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al actualizar el cambio"
        });
    }
};

exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            "DELETE FROM cambios_accesorios WHERE id_cambio = ?",
            [id]
        );

        res.json({
            mensaje: "Cambio eliminado correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar el cambio"
        });
    }
};