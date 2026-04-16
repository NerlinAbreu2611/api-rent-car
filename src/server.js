import express from "express";
import cors from "cors";

import clienteRouter from "./routes/clienteRouter.js";
import usuarioRouter from "./routes/usuarioRouter.js";
import vehiculoRouter from "./routes/vehiculoRouter.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);
app.use(express.json());

app.use("/api/cliente", clienteRouter);
app.use("/api/usuario", usuarioRouter);
app.use("/api/vehiculo", vehiculoRouter);
app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
