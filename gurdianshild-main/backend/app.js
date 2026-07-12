const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const prisma = require("./config/prisma"); // Ensure Prisma is initialized

// Fix BigInt serialization issue with Prisma
BigInt.prototype.toJSON = function () {
  return this.toString();
};
// ─────────────────────────────────────────────
// App init
// ─────────────────────────────────────────────
const app = express();

if (process.env.NODE_ENV !== "test") {
  require("./workers/auditWorker");
  require("./workers/repairWorker");
  require("./workers/verificationWorker");
}

// ─────────────────────────────────────────────
// SECURITY + MIDDLEWARE
// ─────────────────────────────────────────────
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = [
  CLIENT_URL,
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow all origins dynamically. This ensures that when the browser requests
      // Vite's static assets (which have the crossorigin attribute), the request
      // isn't blocked and the React app can load successfully.
      callback(null, true);
    },
    credentials: true,
  })
);

// Ensure preflight requests are handled for all routes
// Note: `cors` middleware above handles preflight requests automatically.

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────
const authRoutes = require("./routes/authRoute");
const transactionRoutes = require("./routes/transactionRoute");
const securityRoutes = require("./routes/securityRoute");
const incidentRoutes = require("./routes/incidentRoute");
const repairRoutes = require("./routes/repairRoute");
const adminRoutes = require("./routes/adminRoute");

app.use("/api/auth", authRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/repair", repairRoutes);
app.use("/api/admin", adminRoutes);

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running fine 🚀",
  });
});

// ─────────────────────────────────────────────
// SERVE FRONTEND
// ─────────────────────────────────────────────
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

// Fallback for React Router (Express 5 compatibility)
app.use((req, res, next) => {
  // If it's an API request, let the global error handler catch the 404
  if (req.originalUrl.startsWith("/api")) {
    return next();
  }
  // If the request has a file extension (like .js, .css, .png), don't serve HTML
  if (req.originalUrl.match(/\.[^/]+$/)) {
    return next();
  }
  // Otherwise, it's a client-side route, so serve the React app
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR]", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

module.exports = app;
