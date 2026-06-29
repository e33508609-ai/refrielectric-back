const db = require("../db");


exports.listar = async (req, res) => {
    try {

        const [rows] = await db.query(
            "SELECT * FROM insumos ORDER BY marca ASC"
        );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al listar los insumos"
        });

    }
};


exports.obtener = async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM insumos WHERE id_insumo = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Insumo no encontrado"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener el insumo"
        });

    }

};


exports.crear = async (req, res) => {

    try {

        const {
            tipo,
            marca,
            referencia,
            cantidad
        } = req.body;

        await db.query(
            `INSERT INTO insumos
            (
                tipo,
                marca,
                referencia,
                cantidad
            )
            VALUES (?,?,?,?)`,
            [
                tipo,
                marca,
                referencia,
                cantidad
            ]
        );

        res.status(201).json({
            mensaje: "Insumo registrado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al registrar el insumo"
        });

    }

};


exports.actualizar = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            tipo,
            marca,
            referencia,
            cantidad
        } = req.body;

        await db.query(
            `UPDATE insumos
            SET
                tipo = ?,
                marca = ?,
                referencia = ?,
                cantidad = ?
            WHERE id_insumo = ?`,
            [
                tipo,
                marca,
                referencia,
                cantidad,
                id
            ]
        );

        res.json({
            mensaje: "Insumo actualizado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al actualizar el insumo"
        });

    }

};


exports.eliminar = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(
            "DELETE FROM insumos WHERE id_insumo = ?",
            [id]
        );

        res.json({
            mensaje: "Insumo eliminado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al eliminar el insumo"
        });

    }

};