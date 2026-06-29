const db = require("../db");


exports.listar = async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                id_equipo,
                responsable,
                cargo,
                equipo,
                modelo,
                fecha_entrega,
                accesorio_asignado,
                fecha_asignacion_accesorio,

                DATEDIFF(CURDATE(), fecha_entrega) AS dias_con_equipo,

                CASE
                    WHEN fecha_asignacion_accesorio IS NULL THEN 0
                    ELSE DATEDIFF(CURDATE(), fecha_asignacion_accesorio)
                END AS dias_con_accesorio

            FROM equipos
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al listar equipos"
        });

    }
};


exports.obtener = async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM equipos WHERE id_equipo = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Equipo no encontrado"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener el equipo"
        });

    }

};


exports.crear = async (req, res) => {

    try {

        const {
            responsable,
            cargo,
            equipo,
            modelo,
            fecha_entrega,
            accesorio_asignado,
            fecha_asignacion_accesorio
        } = req.body;

        await db.query(
            `INSERT INTO equipos
            (
                responsable,
                cargo,
                equipo,
                modelo,
                fecha_entrega,
                accesorio_asignado,
                fecha_asignacion_accesorio
            )
            VALUES (?,?,?,?,?,?,?)`,
            [
                responsable,
                cargo,
                equipo,
                modelo,
                fecha_entrega,
                accesorio_asignado,
                fecha_asignacion_accesorio
            ]
        );

        res.status(201).json({
            mensaje: "Equipo registrado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al registrar el equipo"
        });

    }

};


exports.actualizar = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            responsable,
            cargo,
            equipo,
            modelo,
            fecha_entrega,
            accesorio_asignado,
            fecha_asignacion_accesorio
        } = req.body;

        await db.query(
            `UPDATE equipos
            SET
                responsable=?,
                cargo=?,
                equipo=?,
                modelo=?,
                fecha_entrega=?,
                accesorio_asignado=?,
                fecha_asignacion_accesorio=?
            WHERE id_equipo=?`,
            [
                responsable,
                cargo,
                equipo,
                modelo,
                fecha_entrega,
                accesorio_asignado,
                fecha_asignacion_accesorio,
                id
            ]
        );

        res.json({
            mensaje: "Equipo actualizado"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al actualizar"
        });

    }

};


exports.eliminar = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(
            "DELETE FROM equipos WHERE id_equipo=?",
            [id]
        );

        res.json({
            mensaje: "Equipo eliminado"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al eliminar"
        });

    }

};