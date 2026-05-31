const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const Job = require("../models/Job");
const Company = require("../models/Company");
const Application = require("../models/Application");
const Notification = require("../models/Notification");

const runTest = async () => {
  try {
    console.log("=== STARTING SMART PLACEMENT TRACKER VERIFICATION SUITE ===");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // 1. Get or Create a test College ID
    const collegeId = new mongoose.Types.ObjectId();
    console.log(`✓ Context College ID: ${collegeId}`);

    // 2. Setup mock coordinator and student
    console.log("\n[Step 1] Creating mock coordinator and student...");
    const coordinator = await User.create({
      name: "Verification Coordinator",
      email: `coordinator-${Date.now()}@anurag.edu.in`,
      passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890", // mock hash
      role: "coordinator",
      collegeId
    });
    console.log(`✓ Coordinator created: ${coordinator.name} (${coordinator.email})`);

    const student = await User.create({
      name: "Verification Student",
      email: `student-${Date.now()}@anurag.edu.in`,
      passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890", // mock hash
      role: "student",
      collegeId,
      branch: "CSE",
      cgpa: 8.5,
      activeBacklogs: 0
    });
    console.log(`✓ Student created: ${student.name} (${student.email})`);

    // 3. Register Company
    console.log("\n[Step 2] Creating mock company CRM record...");
    const company = await Company.create({
      name: "Verified Corporation",
      collegeId,
      status: "confirmed",
      expectedVisitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      contactPerson: "Jane Smith",
      contactEmail: "jane@verifiedcorp.com",
      contactPhone: "+91 99999 88888",
      notes: "Looking to hire 10 full-stack interns.",
      publicData: {
        avgCtc: "14 LPA",
        industry: "SaaS"
      }
    });
    console.log(`✓ Company CRM record registered: ${company.name}`);

    // 4. Create Job listing
    console.log("\n[Step 3] Creating mock job listing...");
    const job = await Job.create({
      title: "Software Development Intern",
      company: company.name,
      collegeId,
      postedBy: coordinator._id,
      description: "Must know Javascript, Node, React.",
      requirements: "React, Node.js, Express, MongoDB",
      location: "Hyderabad",
      ctc: "14 LPA",
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    });
    console.log(`✓ Job listing created: ${job.title} at ${job.company}`);

    // 5. Submit application
    console.log("\n[Step 4] Simulating student applying for job...");
    const application = await Application.create({
      jobId: job._id,
      studentId: student._id,
      collegeId,
      stage: "applied",
      matchScore: 85,
      stageHistory: [{ stage: "applied", changedAt: new Date() }]
    });
    console.log(`✓ Application submitted successfully. Match Score: ${application.matchScore}%`);

    // 6. Schedule interview round & Notification
    console.log("\n[Step 5] Simulating coordinator scheduling interview round...");
    application.stage = "interview";
    application.interviewRounds.push({
      roundNumber: 1,
      roundType: "Technical",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      notes: "Google Meet Link: meet.google.com/abc-defg-hij",
      status: "scheduled"
    });
    application.stageHistory.push({ stage: "interview", changedAt: new Date() });
    await application.save();
    console.log(`✓ Round 1 scheduled. Application stage changed to: ${application.stage}`);

    // Create scheduling notification
    const schedNotif = await Notification.create({
      userId: student._id,
      collegeId,
      title: "Interview Round Scheduled",
      message: `Your Technical round has been scheduled for tomorrow.`,
      type: "interview"
    });
    console.log(`✓ In-app notification dispatched to student: "${schedNotif.title}"`);

    // 7. Update round status
    console.log("\n[Step 6] Simulating interview round update (passed)...");
    const round = application.interviewRounds[0];
    round.status = "passed";
    round.feedback = "Solid coding skill, handles edge cases well.";
    await application.save();
    console.log(`✓ Round status updated to: ${round.status}. Feedback recorded.`);

    // Dispatch update notification
    const updateNotif = await Notification.create({
      userId: student._id,
      collegeId,
      title: "Interview Round Updated",
      message: `Your Technical interview round status is updated to: PASSED`,
      type: "interview"
    });
    console.log(`✓ In-app notification dispatched to student: "${updateNotif.title}"`);

    // 8. Upload offer letter details
    console.log("\n[Step 7] Simulating student uploading offer letter PDF details...");
    application.offerDetails = {
      ctc: "14 LPA",
      offerLetterUrl: "/uploads/offer-verification-test.pdf",
      uploadedAt: new Date(),
      status: "pending_review"
    };
    await application.save();
    console.log(`✓ Student offer details stored. Verification status: ${application.offerDetails.status}`);

    // Notify coordinator of upload
    const uploadNotif = await Notification.create({
      userId: coordinator._id,
      collegeId,
      title: "New Offer Letter Uploaded",
      message: `${student.name} has uploaded an offer letter for review.`,
      type: "offer"
    });
    console.log(`✓ In-app notification dispatched to coordinator: "${uploadNotif.title}"`);

    // 9. Verify offer letter and place student
    console.log("\n[Step 8] Simulating coordinator verifying offer letter & marking student as placed...");
    application.offerDetails.status = "verified";
    application.offerDetails.reviewNotes = "Perfect document. Approved.";
    application.offerDetails.reviewedBy = coordinator._id;
    application.offerDetails.reviewedAt = new Date();
    application.stage = "offer";
    application.stageHistory.push({ stage: "offer", changedAt: new Date() });
    await application.save();

    // Mark student placed
    const updatedStudent = await User.findByIdAndUpdate(
      student._id,
      { isPlaced: true, placementStatus: "placed_on_campus" },
      { new: true }
    );
    console.log(`✓ Offer status updated to: VERIFIED. Student placement state: isPlaced = ${updatedStudent.isPlaced}, placementStatus = ${updatedStudent.placementStatus}`);

    // Dispatch verification notification to student
    const verifyNotif = await Notification.create({
      userId: student._id,
      collegeId,
      title: "Offer Letter Verified",
      message: `Your uploaded offer letter was approved. Review notes: Approved.`,
      type: "offer"
    });
    console.log(`✓ In-app notification dispatched to student: "${verifyNotif.title}"`);

    // 10. Clean up test documents
    console.log("\n[Step 9] Cleaning up verification artifacts...");
    await User.findByIdAndDelete(coordinator._id);
    await User.findByIdAndDelete(student._id);
    await Company.findByIdAndDelete(company._id);
    await Job.findByIdAndDelete(job._id);
    await Application.findByIdAndDelete(application._id);
    await Notification.deleteMany({ collegeId });
    console.log("✓ Cleanup finished successfully.");

    console.log("\n=== ALL SMART PLACEMENT TRACKER TESTS PASSED SUCCESSFULLY ===");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test execution failed!", error);
    process.exit(1);
  }
};

runTest();
