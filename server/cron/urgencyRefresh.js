/**
 * Cron job to recompute urgency scores for active jobs.
 * Runs daily at midnight.
 */
const cron = require("node-cron");
const Job = require("../models/Job");

function computeUrgencyScore(deadline, applicationCount) {
  if (!deadline || isNaN(new Date(deadline).getTime())) {
    return 0;
  }
  const daysLeft = Math.max(0, (new Date(deadline) - Date.now()) / 86400000);
  const recency  = Math.max(0, 30 - daysLeft);           // peaks as deadline approaches
  const interest = Math.min(applicationCount / 10, 5);   // caps at 5 to avoid bias
  return Math.round(recency + interest);
}

const setupUrgencyRefresh = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Refreshing urgency scores...");
    try {
      const activeJobs = await Job.find({ status: "active" });
      for (const job of activeJobs) {
        job.urgencyScore = computeUrgencyScore(job.deadline, job.applicationCount);
        await job.save();
      }
    } catch (error) {
      console.error("Cron Error (Urgency Refresh):", error);
    }
  });
};

module.exports = setupUrgencyRefresh;
