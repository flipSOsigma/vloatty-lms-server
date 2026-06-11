import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRouter from "./routes";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount the central API router
app.use("/api", apiRouter);

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    message: "LMS Backend Server is running successfully",
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});