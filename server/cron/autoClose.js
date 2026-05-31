/**
 * Cron job to automatically close active job listings:
 * 1. Listings that are past their deadline.
 * 2. Listings with no deadline that are older than 30 days.
 * Runs hourly.
 */
const cron = require("node-cron");
const Job = require("../models/Job");

const autoCloseJobs = async () => {
  console.log("[CRON] Running auto-close jobs check...");
  try {
    const now = new Date();
    
    // 1. Close active listings that have passed their deadline
    const expiredDeadlines = await Job.updateMany(
      {
        status: "active",
        deadline: { $exists: true, $ne: null, $lt: now }
      },
      {
        $set: { status: "closed" }
      }
    );

    // 2. Close active listings with no deadline (or null) that are older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expiredNoDeadlines = await Job.updateMany(
      {
        status: "active",
        $or: [
          { deadline: { $exists: false } },
          { deadline: null }
        ],
        createdAt: { $lt: thirtyDaysAgo }
      },
      {
        $set: { status: "closed" }
      }
    );

    if (expiredDeadlines.modifiedCount > 0 || expiredNoDeadlines.modifiedCount > 0) {
      console.log(`[CRON] Auto-closed ${expiredDeadlines.modifiedCount} jobs with expired deadlines and ${expiredNoDeadlines.modifiedCount} jobs with no deadlines older than 30 days.`);
    } else {
      console.log("[CRON] No jobs required closing.");
    }
  } catch (error) {
    console.error("[CRON] Auto-close jobs error:", error);
  }
};

const setupAutoClose = () => {
  // Schedule hourly cron
  cron.schedule("0 * * * *", autoCloseJobs);
  
  // Also run immediately on startup
  autoCloseJobs();
};

module.exports = setupAutoClose;
