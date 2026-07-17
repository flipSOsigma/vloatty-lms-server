import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRouter from "./routes";

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = [
  "https://vloatty.vercel.app", 
  "http://localhost:3000", 
  "http://127.0.0.1:3000"
];

app.use(cors({
  // Dynamically check origins to allow Vercel preview branches
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Explicitly allow common headers needed for JSON and Auth
  allowedHeaders: ["Content-Type", "Authorization", "Accept"] 
}));

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