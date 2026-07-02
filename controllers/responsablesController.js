const db = require("../db");

exports.listar = async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT *
            FROM responsables
            ORDER BY nombre ASC
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al listar responsables"
        });

    }

};

exports.obtener = async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM responsables WHERE id_responsable = ?",
            [id]
        );

        if (rows.length === 0) {

            return res.status(404).json({
                mensaje: "Responsable no encontrado"
            });

        }

        res.json(rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener el responsable"
        });

    }

};

exports.crear = async (req, res) => {

    try {

        const {
            nombre,
            area,
            cargo,
            punto
        } = req.body;

        await db.query(
            `INSERT INTO responsables
            (
                nombre,
                area,
                cargo,
                punto
            )
            VALUES (?,?,?,?)`,
            [
                nombre,
                area,
                cargo,
                punto
            ]
        );

        res.status(201).json({
            mensaje: "Responsable registrado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al registrar el responsable"
        });

    }

};

exports.actualizar = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            nombre,
            area,
            cargo,
            punto
        } = req.body;

        await db.query(
            `UPDATE responsables
            SET
                nombre = ?,
                area = ?,
                cargo = ?,
                punto = ?
            WHERE id_responsable = ?`,
            [
                nombre,
                area,
                cargo,
                punto,
                id
            ]
        );

        res.json({
            mensaje: "Responsable actualizado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al actualizar el responsable"
        });

    }

};

exports.eliminar = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(
            "DELETE FROM responsables WHERE id_responsable = ?",
            [id]
        );

        res.json({
            mensaje: "Responsable eliminado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al eliminar el responsable"
        });

    }

};