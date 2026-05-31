/**
 * Main entry point for the PlaceIQ Express server.
 * Configures middleware, routes, database connection, and cron jobs.
 */
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const setupDeadlineReminders = require("./cron/deadlineReminder");
const setupUrgencyRefresh = require("./cron/urgencyRefresh");
const setupAutoClose = require("./cron/autoClose");
require("./cron/autoScrape");

// Initialize Express
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const jobsRoutes = require('./routes/jobs');
const appRoutes = require('./routes/applications');
const batchesRoutes = require('./routes/batches');
const studentsRoutes = require('./routes/students');
const analyticsRoutes = require('./routes/analytics');
const announcementsRoutes = require('./routes/announcements');
const adminRoutes = require('./routes/admin');
const notificationsRoutes = require('./routes/notifications');
const companiesRoutes = require('./routes/companies');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/companies', companiesRoutes);

// Serve static files from uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root route
app.get("/", (req, res) => {
  res.send("PlaceIQ API is running...");
});

// Initialize Cron Jobs
setupDeadlineReminders();
setupUrgencyRefresh();
setupAutoClose();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
