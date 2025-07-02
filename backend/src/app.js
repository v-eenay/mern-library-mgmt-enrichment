import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
// import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// API routes
app.use("/api", routes);

export default app;