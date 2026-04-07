import express from "express";

import clienteRouter from "./routes/clienteRouter.js";
import usuarioRouter from "./routes/usuarioRouter.js";

const app = express();

app.use(express.json());

app.use("/api/cliente", clienteRouter);
app.use("/api/usuario", usuarioRouter);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
