// controllers/accesorios.controller.js
const db = require("../db");

// Listar todos los accesorios
exports.listar = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id_accesorio,
                tipo_accesorio,
                marca,
                referencia,
                serial,
                estado,
                observaciones,
                fecha_creacion,
                DATE_FORMAT(fecha_creacion, '%Y-%m-%d') as fecha_creacion_formateada,
                DATEDIFF(CURDATE(), fecha_creacion) AS dias_creado
            FROM accesorios
            ORDER BY fecha_creacion DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al listar los accesorios"
        });
    }
};

// Obtener un accesorio por ID
exports.obtener = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT 
                id_accesorio,
                tipo_accesorio,
                marca,
                referencia,
                serial,
                estado,
                observaciones,
                fecha_creacion,
                DATE_FORMAT(fecha_creacion, '%Y-%m-%d') as fecha_creacion_formateada,
                DATEDIFF(CURDATE(), fecha_creacion) AS dias_creado
            FROM accesorios
            WHERE id_accesorio = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Accesorio no encontrado"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al obtener el accesorio"
        });
    }
};

// Crear un nuevo accesorio
exports.crear = async (req, res) => {
    try {
        const {
            tipo_accesorio,
            marca,
            referencia,
            serial,
            observaciones,
            fecha_creacion
        } = req.body;

        // Validación de campos requeridos
        if (!tipo_accesorio || !marca || !referencia || !fecha_creacion) {
            return res.status(400).json({
                mensaje: "Faltan campos requeridos: tipo_accesorio, marca, referencia y fecha_creacion son obligatorios"
            });
        }

        await db.query('START TRANSACTION');

        const [result] = await db.query(`
            INSERT INTO accesorios 
            (tipo_accesorio, marca, referencia, serial, observaciones, fecha_creacion, estado)
            VALUES (?, ?, ?, ?, ?, ?, 'DISPONIBLE')
        `, [
            tipo_accesorio,
            marca,
            referencia,
            serial || null,
            observaciones || null,
            fecha_creacion
        ]);

        await db.query('COMMIT');

        res.status(201).json({
            mensaje: "Accesorio creado correctamente",
            datos: {
                id_accesorio: result.insertId,
                tipo_accesorio,
                marca,
                referencia,
                serial,
                fecha_creacion
            }
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            mensaje: "Error al crear el accesorio"
        });
    }
};

// Actualizar un accesorio
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tipo_accesorio,
            marca,
            referencia,
            serial,
            estado,
            observaciones,
            fecha_creacion
        } = req.body;

        // Verificar si el registro existe
        const [existing] = await db.query(
            "SELECT id_accesorio FROM accesorios WHERE id_accesorio = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                mensaje: "Accesorio no encontrado"
            });
        }

        await db.query(`
            UPDATE accesorios
            SET
                tipo_accesorio = ?,
                marca = ?,
                referencia = ?,
                serial = ?,
                estado = ?,
                observaciones = ?,
                fecha_creacion = ?
            WHERE id_accesorio = ?
        `, [
            tipo_accesorio,
            marca,
            referencia,
            serial || null,
            estado || 'DISPONIBLE',
            observaciones || null,
            fecha_creacion,
            id
        ]);

        res.json({
            mensaje: "Accesorio actualizado correctamente",
            datos: {
                id_accesorio: id
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al actualizar el accesorio"
        });
    }
};

// Eliminar un accesorio
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el registro existe
        const [existing] = await db.query(
            "SELECT id_accesorio FROM accesorios WHERE id_accesorio = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                mensaje: "Accesorio no encontrado"
            });
        }

        // Verificar si está asignado
        const [asignado] = await db.query(
            "SELECT id_cambio FROM cambios_accesorios WHERE id_accesorio = ?",
            [id]
        );

        if (asignado.length > 0) {
            return res.status(400).json({
                mensaje: "No se puede eliminar el accesorio porque está asignado a un equipo"
            });
        }

        await db.query(
            "DELETE FROM accesorios WHERE id_accesorio = ?",
            [id]
        );

        res.json({
            mensaje: "Accesorio eliminado correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar el accesorio"
        });
    }
};

// Obtener accesorios disponibles (para asignar)
exports.disponibles = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id_accesorio,
                tipo_accesorio,
                marca,
                referencia,
                serial,
                fecha_creacion
            FROM accesorios
            WHERE estado = 'DISPONIBLE'
            ORDER BY tipo_accesorio, marca
        `);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al obtener accesorios disponibles"
        });
    }
};