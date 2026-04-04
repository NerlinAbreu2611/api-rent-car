import express from "express";

import clienteRouter from "./routes/clienteRouter.js";

const app = express();

app.use(express.json());

app.use("/api/cliente", clienteRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
