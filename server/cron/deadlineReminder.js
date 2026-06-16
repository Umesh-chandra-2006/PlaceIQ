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

      const Notification = require("../models/Notification");
      for (const job of jobs) {
        const applications = await Application.find({ jobId: job._id })
          .populate("studentId", "email name");

        for (const app of applications) {
          if (!app.studentId) continue;

          const title = `Deadline approaching: ${job.company}`;
          
          // Prevent duplicates (sent in the last 24 hours)
          const alreadySent = await Notification.findOne({
            userId: app.studentId._id,
            title: title,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          });
          if (alreadySent) continue;

          const subject = `Reminder: Deadline approaching for ${job.company}`;
          const text = `Hi ${app.studentId.name}, the deadline for ${job.title} at ${job.company} is approaching on ${job.deadline.toDateString()}.`;
          
          await sendEmail(app.studentId.email, subject, text);

          // Log in DB to prevent duplicate and show in dashboard
          await Notification.create({
            userId: app.studentId._id,
            collegeId: job.collegeId,
            title: title,
            message: text,
            type: "general"
          });
        }
      }
    } catch (error) {
      console.error("Cron Error (Deadline Reminder):", error);
    }
  });
};

module.exports = setupDeadlineReminders;
