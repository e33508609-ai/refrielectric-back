const db = require("../db");


exports.listar = async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                s.id_salida,
                i.tipo,
                i.marca,
                i.referencia,
                s.responsable,
                s.cantidad,
                s.fecha,
                s.observaciones
            FROM salidas_insumos s
            INNER JOIN insumos i
                ON s.id_insumo = i.id_insumo
            ORDER BY s.fecha DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al listar las salidas"
        });

    }

};


exports.registrar = async (req, res) => {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const {
            id_insumo,
            responsable,
            cantidad,
            observaciones
        } = req.body;

        const [insumo] = await connection.query(
            "SELECT * FROM insumos WHERE id_insumo=?",
            [id_insumo]
        );

        if (insumo.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                mensaje: "Insumo no encontrado"
            });

        }

        if (insumo[0].cantidad < cantidad) {

            await connection.rollback();

            return res.status(400).json({
                mensaje: "Inventario insuficiente"
            });

        }

        await connection.query(

            `INSERT INTO salidas_insumos
            (
                id_insumo,
                responsable,
                cantidad,
                fecha,
                observaciones
            )

            VALUES
            (
                ?,?,?,NOW(),?
            )`,

            [
                id_insumo,
                responsable,
                cantidad,
                observaciones
            ]

        );

        await connection.query(

            "UPDATE insumos SET cantidad=cantidad-? WHERE id_insumo=?",

            [
                cantidad,
                id_insumo
            ]

        );

        await connection.commit();

        res.status(201).json({

            mensaje: "Salida registrada correctamente"

        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({

            mensaje: "Error al registrar la salida"

        });

    } finally {

        connection.release();

    }

};