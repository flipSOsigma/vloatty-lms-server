import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRouter from "./routes";

const app = express();
const port = process.env.PORT || 5000;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ["https://vloatty.vercel.app", "http://localhost:3000", "http://127.0.0.1:3000"];
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "https://vloatty.vercel.app");
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());

app.use("/api", apiRouter);

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    message: "LMS Backend Server is running successfully",
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}

export default app;