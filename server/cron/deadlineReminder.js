/**
 * Cron job to send deadline reminders to eligible students who haven't applied.
 * Runs daily at 8:00 AM.
 */
const cron = require("node-cron");
const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const Batch = require("../models/Batch");
const { sendEmail } = require("../services/notify");
const { isEligible } = require("../services/eligibility");

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
        // 1. Get all students who already applied to this job
        const appliedStudentIds = await Application.find({ jobId: job._id }).distinct("studentId");

        // 2. Get all active students in the college who haven't applied yet
        const unappliedStudents = await User.find({
          collegeId: job.collegeId,
          role: "student",
          isActive: { $ne: false },
          _id: { $nin: appliedStudentIds }
        });

        if (unappliedStudents.length === 0) continue;

        // 3. Map student IDs to batch IDs to optimize check
        const batches = await Batch.find({ collegeId: job.collegeId });
        const studentBatchMap = new Map();
        for (const batch of batches) {
          for (const sid of batch.studentIds || []) {
            const sidStr = sid.toString();
            if (!studentBatchMap.has(sidStr)) {
              studentBatchMap.set(sidStr, []);
            }
            studentBatchMap.get(sidStr).push(batch._id);
          }
        }

        // 4. Send reminders to eligible candidates
        for (const student of unappliedStudents) {
          const studentBatchIds = studentBatchMap.get(student._id.toString()) || [];
          if (!isEligible(student, job, studentBatchIds)) continue;

          const title = `Deadline approaching: ${job.company}`;
          
          // Prevent duplicates (sent in the last 24 hours)
          const alreadySent = await Notification.findOne({
            userId: student._id,
            title: title,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          });
          if (alreadySent) continue;

          const subject = `Reminder: Deadline approaching for ${job.company}`;
          const text = `Hi ${student.name}, the deadline to apply for ${job.title} at ${job.company} is approaching on ${job.deadline.toDateString()}. Make sure to apply on time!`;
          
          await sendEmail(student.email, subject, text);

          // Log in DB to prevent duplicate and show in dashboard
          await Notification.create({
            userId: student._id,
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
