const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.login = async (req, res) => {
    try {

        const { usuario, contrasena } = req.body;

        if (!usuario || !contrasena) {
            return res.status(400).json({
                ok: false,
                mensaje: "Debe ingresar usuario y contraseña"
            });
        }

        const [rows] = await db.query(
            "SELECT * FROM usuarios WHERE usuario = ?",
            [usuario]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                ok: false,
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        const usuarioDB = rows[0];

        const coincide = await bcrypt.compare(
            contrasena,
            usuarioDB.contrasena
        );

        if (!coincide) {
            return res.status(401).json({
                ok: false,
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        const token = jwt.sign(
            {
                id: usuarioDB.id_usuario,
                usuario: usuarioDB.usuario
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        res.json({
            ok: true,
            mensaje: "Login correcto",
            token,
            usuario: {
                id: usuarioDB.id_usuario,
                usuario: usuarioDB.usuario
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });

    }
};