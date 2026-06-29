const db = require("../db");
const bcrypt = require("bcrypt");


exports.listar = async (req, res) => {
    try {

        const [rows] = await db.query(
            "SELECT id_usuario, usuario FROM usuarios"
        );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al listar usuarios"
        });

    }
};


exports.obtener = async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT id_usuario, usuario FROM usuarios WHERE id_usuario = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener usuario"
        });

    }

};

exports.crear = async (req, res) => {

    try {

        const { usuario, contrasena } = req.body;

        const hash = await bcrypt.hash(contrasena, 10);

        await db.query(
            "INSERT INTO usuarios(usuario, contrasena) VALUES (?, ?)",
            [usuario, hash]
        );

        res.status(201).json({
            mensaje: "Usuario creado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al crear usuario"
        });

    }

};


exports.actualizar = async (req, res) => {

    try {

        const { id } = req.params;
        const { usuario, contrasena } = req.body;

        const hash = await bcrypt.hash(contrasena, 10);

        await db.query(
            "UPDATE usuarios SET usuario = ?, contrasena = ? WHERE id_usuario = ?",
            [usuario, hash, id]
        );

        res.json({
            mensaje: "Usuario actualizado"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al actualizar usuario"
        });

    }

};


exports.eliminar = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(
            "DELETE FROM usuarios WHERE id_usuario = ?",
            [id]
        );

        res.json({
            mensaje: "Usuario eliminado"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al eliminar usuario"
        });

    }

};