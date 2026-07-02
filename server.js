

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();


app.use(cors());
app.use(express.json());


app.use("/api/auth", require("./routes/auth"));
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/equipos", require("./routes/equipos"));
app.use("/api/insumos", require("./routes/insumos"));
app.use("/api/salidas", require("./routes/salidas"));
app.use("/api/accesorios", require("./routes/accesorios"));
app.use("/api/responsables", require("./routes/responsables"));
app.use("/api/asignaciones", require("./routes/asignaciones")); 


app.get("/", (req, res) => {
    res.json({
        mensaje: "API Refrielectric funcionando correctamente"
    });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});