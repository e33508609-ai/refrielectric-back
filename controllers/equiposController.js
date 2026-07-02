const db = require("../db");

exports.listar = async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                id_equipo,
                equipo,
                marca,
                modelo,
                serial,
                estado
            FROM equipos
            ORDER BY equipo ASC
        `);

        res.json(rows);

    } catch (error) {

    console.error(error);

    res.status(500).json({
        mensaje: "Error al listar equipos",
        error: error.message,
        sqlMessage: error.sqlMessage
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
            equipo,
            marca,
            modelo,
            serial,
            estado
        } = req.body;

        await db.query(
            `INSERT INTO equipos
            (
                equipo,
                marca,
                modelo,
                serial,
                estado
            )
            VALUES (?,?,?,?,?)`,
            [
                equipo,
                marca,
                modelo,
                serial,
                estado || "DISPONIBLE"
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
            equipo,
            marca,
            modelo,
            serial,
            estado
        } = req.body;

        await db.query(
            `UPDATE equipos
            SET
                equipo=?,
                marca=?,
                modelo=?,
                serial=?,
                estado=?
            WHERE id_equipo=?`,
            [
                equipo,
                marca,
                modelo,
                serial,
                estado,
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