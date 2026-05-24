/**
 * Cron job to send deadline reminders to students.
 * Runs daily at 8:00 AM.
 */
const cron = require("node-cron");
const Job = require("../models/Job");
const Application = require("../models/Application");
const { sendEmail } = require("../services/notify");

const setupDeadlineReminders = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("Running daily deadline reminders...");
    try {
      const cutoff = new Date(Date.now() + 48 * 3600 * 1000); // 48 hours from now
      const jobs = await Job.find({ 
        deadline: { $lte: cutoff, $gt: new Date() }, 
        status: "active" 
      });

      for (const job of jobs) {
        // Find students who haven't applied yet but are eligible? 
        // Or remind those who have applied about upcoming rounds?
        // Specification says: "remind those who have applied"
        const applications = await Application.find({ jobId: job._id })
          .populate("studentId", "email name");

        for (const app of applications) {
          const subject = `Reminder: Deadline approaching for ${job.company}`;
          const text = `Hi ${app.studentId.name}, the deadline for ${job.title} at ${job.company} is approaching on ${job.deadline.toDateString()}.`;
          await sendEmail(app.studentId.email, subject, text);
        }
      }
    } catch (error) {
      console.error("Cron Error (Deadline Reminder):", error);
    }
  });
};

module.exports = setupDeadlineReminders;
