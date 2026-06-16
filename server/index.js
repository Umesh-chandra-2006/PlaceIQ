/**
 * Main entry point for the PlaceIQ Express server.
 * Configures middleware, routes, database connection, and cron jobs.
 */
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const setupDeadlineReminders = require("./cron/deadlineReminder");
const setupUrgencyRefresh = require("./cron/urgencyRefresh");
const setupAutoClose = require("./cron/autoClose");
const setupAutoScrape = require("./cron/autoScrape");

// Initialize Express
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// Rate limiting on sensitive auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window
  message: { error: "Too many requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/setup-complete", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// Routes
const authRoutes = require("./routes/auth");
const jobsRoutes = require("./routes/jobs");
const appRoutes = require("./routes/applications");
const batchesRoutes = require("./routes/batches");
const studentsRoutes = require("./routes/students");
const analyticsRoutes = require("./routes/analytics");
const announcementsRoutes = require("./routes/announcements");
const adminRoutes = require("./routes/admin");
const notificationsRoutes = require("./routes/notifications");
const companiesRoutes = require("./routes/companies");
const exportRoutes = require("./routes/export");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", appRoutes);
app.use("/api/batches", batchesRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/export", exportRoutes);

// Serve static files from uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root route
app.get("/", (req, res) => {
  res.send("PlaceIQ API is running...");
});

// Initialize Cron Jobs
if (process.env.NODE_ENV === "production") {
  setupDeadlineReminders();
  setupUrgencyRefresh();
  setupAutoClose();
  setupAutoScrape();
  console.log("Cron jobs initialized in production mode.");
} else {
  console.log("Cron jobs disabled in development mode.");
}

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
