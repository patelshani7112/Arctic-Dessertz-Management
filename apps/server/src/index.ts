import "dotenv/config";
import express from "express";
import cors from "cors";
import api from "./routes";

// Log any unhandled promise rejections instead of crashing the process
process.on("unhandledRejection", (reason, p) => {
  console.error("UNHANDLED REJECTION at:", p, "\nreason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use(api);

// Centralized error handler (now catches async rejections via asyncHandler)
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("ERROR:", err);
    const status = typeof err?.status === "number" ? err.status : 500;
    const message = err?.message || "Server error";
    res.status(status).json({ error: message });
  }
);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API running on :${port}`));
