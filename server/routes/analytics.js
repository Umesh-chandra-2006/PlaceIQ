/**
 * Analytics routes for coordinators.
 */
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Application = require("../models/Application");
const User = require("../models/User");
const PlacementCycle = require("../models/PlacementCycle");
const Batch = require("../models/Batch");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const cacheMiddleware = require("../middleware/cache");

// Helper to construct query filters dynamically based on query parameters
const getFilterMatches = async (req) => {
  const { cohortId, department, dateFrom, dateTo } = req.query;
  const collegeId = req.user?.collegeId;
  const validCollegeId = mongoose.isValidObjectId(collegeId) ? new mongoose.Types.ObjectId(collegeId) : new mongoose.Types.ObjectId();

  // base student match
  const studentMatch = { 
    collegeId: validCollegeId, 
    role: "student", 
    isActive: { $ne: false } 
  };
  
  // base application match
  const applicationMatch = { 
    collegeId: validCollegeId 
  };

  // 1. Cohort / Batch Filter
  if (cohortId && cohortId !== "all") {
    const batch = await Batch.findOne({ _id: cohortId, collegeId });
    if (batch) {
      const studentIds = batch.studentIds.map(id => new mongoose.Types.ObjectId(id));
      studentMatch._id = { $in: studentIds };
      applicationMatch.studentId = { $in: studentIds };
    } else {
      studentMatch._id = { $in: [] };
      applicationMatch.studentId = { $in: [] };
    }
  }

  // 2. Department Filter
  if (department && department !== "all") {
    const deptStudents = await User.find({
      collegeId,
      role: "student",
      isActive: { $ne: false },
      $or: [{ branch: department }, { department: department }]
    }).select("_id");
    const deptStudentIds = deptStudents.map(s => new mongoose.Types.ObjectId(s._id));
    
    if (studentMatch._id) {
      const intersection = studentMatch._id.$in.filter(id => 
        deptStudentIds.some(deptId => deptId.toString() === id.toString())
      );
      studentMatch._id = { $in: intersection };
      applicationMatch.studentId = { $in: intersection };
    } else {
      studentMatch._id = { $in: deptStudentIds };
      applicationMatch.studentId = { $in: deptStudentIds };
    }
  }

  // 3. Date Filters
  if (dateFrom || dateTo) {
    const dateQuery = {};
    if (dateFrom) dateQuery.$gte = new Date(dateFrom);
    if (dateTo) dateQuery.$lte = new Date(dateTo);
    applicationMatch.createdAt = dateQuery;
  }

  return { studentMatch, applicationMatch };
};

// @route   GET /api/analytics/overview
// @desc    Basic overview stats (retained for backward compatibility)
router.get("/overview", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const collegeId = req.user?.collegeId;
    const validCollegeId = mongoose.isValidObjectId(collegeId) ? new mongoose.Types.ObjectId(collegeId) : new mongoose.Types.ObjectId();

    const cycle = await PlacementCycle.findOne({ 
      collegeId: validCollegeId, 
      status: "active" 
    });
    
    const allStudents = await User.find({ collegeId: validCollegeId, role: "student" }).select("isActive isPlaced");
    const activeStudents = allStudents.filter(s => s.isActive !== false);
    const deactivatedStudents = allStudents.filter(s => s.isActive === false);
    
    const totalStudents = activeStudents.length;
    const placedStudents = activeStudents.filter(s => s.isPlaced).length;
    
    res.json({
      cycle,
      totalStudents,
      placedStudents,
      placementRate: totalStudents > 0 ? (placedStudents / totalStudents) * 100 : 0,
      activeCount: totalStudents,
      deactivatedCount: deactivatedStudents.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/summary
// @desc    Tier 1 summary stats cards
router.get("/summary", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const { studentMatch, applicationMatch } = await getFilterMatches(req);

    const totalStudents = await User.countDocuments(studentMatch);
    const placedStudents = await User.countDocuments({ ...studentMatch, isPlaced: true });
    const placementRate = totalStudents > 0 ? parseFloat(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;
    
    const totalOffers = await Application.countDocuments({ ...applicationMatch, stage: "offer" });

    // Active Companies Count
    const companyAggregation = await Application.aggregate([
      { $match: applicationMatch },
      { $lookup: { from: "jobs", localField: "jobId", foreignField: "_id", as: "jobInfo" } },
      { $unwind: "$jobInfo" },
      { $group: { _id: "$jobInfo.company" } },
      { $count: "count" }
    ]);
    const activeCompanies = companyAggregation.length > 0 ? companyAggregation[0].count : 0;

    // CTC Aggregations (Average and Highest)
    const ctcAggregation = await Application.aggregate([
      { $match: { ...applicationMatch, stage: "offer", "offerDetails.ctc": { $exists: true, $ne: "" } } },
      {
        $project: {
          cleanCtc: {
            $trim: {
              input: {
                $replaceAll: {
                  input: {
                    $replaceAll: {
                      input: {
                        $replaceAll: {
                          input: {
                            $replaceAll: {
                              input: "$offerDetails.ctc",
                              find: "LPA",
                              replacement: ""
                            }
                          },
                          find: "lpa",
                          replacement: ""
                        }
                      },
                      find: "Lakhs",
                      replacement: ""
                    }
                  },
                  find: " ",
                  replacement: ""
                }
              }
            }
          }
        }
      },
      {
        $project: {
          ctcVal: {
            $convert: {
              input: "$cleanCtc",
              to: "double",
              onError: 0.0,
              onNull: 0.0
            }
          }
        }
      },
      { $match: { ctcVal: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgCTC: { $avg: "$ctcVal" },
          highestCTC: { $max: "$ctcVal" }
        }
      }
    ]);

    const hasOfferData = ctcAggregation.length > 0;
    const avgCTC = hasOfferData ? parseFloat(ctcAggregation[0].avgCTC.toFixed(1)) : 0;
    const highestCTC = hasOfferData ? parseFloat(ctcAggregation[0].highestCTC.toFixed(1)) : 0;

    res.json({
      totalStudents,
      placedStudents,
      placementRate,
      avgCTC,
      highestCTC,
      activeCompanies,
      totalOffers,
      hasOfferData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/funnel
// @desc    Cumulative stages funnel
router.get("/funnel", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const { studentMatch, applicationMatch } = await getFilterMatches(req);

    const apps = await Application.find(applicationMatch).select("stage stageHistory");

    let appliedCount = apps.length;
    let oaCount = 0;
    let interviewCount = 0;
    let offerCount = 0;

    for (let app of apps) {
      const stagesVisited = new Set(app.stageHistory?.map(h => h.stage) || []);
      stagesVisited.add(app.stage);

      if (stagesVisited.has("offer")) {
        offerCount++;
        interviewCount++;
        oaCount++;
      } else if (stagesVisited.has("interview")) {
        interviewCount++;
        oaCount++;
      } else if (stagesVisited.has("oa")) {
        oaCount++;
      }
    }

    const placedCount = await User.countDocuments({ ...studentMatch, isPlaced: true });

    res.json({
      stages: [
        { stage: "Applied", count: appliedCount },
        { stage: "Assessment", count: oaCount },
        { stage: "Interview", count: interviewCount },
        { stage: "Offer", count: offerCount },
        { stage: "Placed", count: placedCount }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/by-department
// @desc    Metrics grouped by branch/department
router.get("/by-department", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const { studentMatch } = await getFilterMatches(req);

    const deptStats = await User.aggregate([
      { $match: studentMatch },
      {
        $group: {
          _id: { $ifNull: ["$branch", "$department"] },
          totalStudents: { $sum: 1 },
          placed: { $sum: { $cond: ["$isPlaced", 1, 0] } },
          avgCGPAVal: { $avg: "$cgpa" }
        }
      },
      {
        $project: {
          department: { $ifNull: ["$_id", "Unknown"] },
          totalStudents: 1,
          placed: 1,
          placementRate: {
            $cond: [
              { $gt: ["$totalStudents", 0] },
              { $multiply: [{ $divide: ["$placed", "$totalStudents"] }, 100] },
              0
            ]
          },
          avgCGPA: { $ifNull: ["$avgCGPAVal", 0] }
        }
      },
      { $sort: { placementRate: -1 } }
    ]);

    const formattedDepts = deptStats.map(d => ({
      department: d.department,
      totalStudents: d.totalStudents,
      placed: d.placed,
      placementRate: parseFloat(d.placementRate.toFixed(1)),
      avgCGPA: parseFloat(d.avgCGPA.toFixed(2))
    }));

    res.json({ departments: formattedDepts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/cgpa-distribution
// @desc    Placed vs unplaced students by CGPA range
router.get("/cgpa-distribution", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const { studentMatch } = await getFilterMatches(req);

    const cgpaStats = await User.aggregate([
      { $match: studentMatch },
      {
        $project: {
          isPlaced: 1,
          cgpaRange: {
            $cond: [
              { $gte: ["$cgpa", 9.0] },
              "9.0-10.0",
              {
                $cond: [
                  { $gte: ["$cgpa", 8.0] },
                  "8.0-8.9",
                  {
                    $cond: [
                      { $gte: ["$cgpa", 7.0] },
                      "7.0-7.9",
                      {
                        $cond: [
                          { $gte: ["$cgpa", 6.0] },
                          "6.0-6.9",
                          "below 6.0"
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$cgpaRange",
          placed: { $sum: { $cond: ["$isPlaced", 1, 0] } },
          unplaced: { $sum: { $cond: ["$isPlaced", 0, 1] } }
        }
      }
    ]);

    const defaultBuckets = [
      { range: "9.0-10.0", placed: 0, unplaced: 0 },
      { range: "8.0-8.9", placed: 0, unplaced: 0 },
      { range: "7.0-7.9", placed: 0, unplaced: 0 },
      { range: "6.0-6.9", placed: 0, unplaced: 0 },
      { range: "below 6.0", placed: 0, unplaced: 0 }
    ];

    const bucketMap = new Map(cgpaStats.map(b => [b._id, b]));
    const result = defaultBuckets.map(bucket => {
      const match = bucketMap.get(bucket.range);
      if (match) {
        return { range: bucket.range, placed: match.placed, unplaced: match.unplaced };
      }
      return bucket;
    });

    res.json({ buckets: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/top-companies
// @desc    Top recruiting companies by offer count
router.get("/top-companies", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const { applicationMatch } = await getFilterMatches(req);

    const companyStats = await Application.aggregate([
      { $match: { ...applicationMatch, stage: "offer" } },
      { $lookup: { from: "jobs", localField: "jobId", foreignField: "_id", as: "jobInfo" } },
      { $unwind: "$jobInfo" },
      {
        $project: {
          company: "$jobInfo.company",
          cleanCtc: {
            $trim: {
              input: {
                $replaceAll: {
                  input: {
                    $replaceAll: {
                      input: {
                        $replaceAll: {
                          input: {
                            $replaceAll: {
                              input: { $ifNull: ["$offerDetails.ctc", "0"] },
                              find: "LPA",
                              replacement: ""
                            }
                          },
                          find: "lpa",
                          replacement: ""
                        }
                      },
                      find: "Lakhs",
                      replacement: ""
                    }
                  },
                  find: " ",
                  replacement: ""
                }
              }
            }
          }
        }
      },
      {
        $project: {
          company: 1,
          ctcVal: {
            $convert: {
              input: "$cleanCtc",
              to: "double",
              onError: 0.0,
              onNull: 0.0
            }
          }
        }
      },
      {
        $group: {
          _id: "$company",
          offersCount: { $sum: 1 },
          avgCTC: { $avg: "$ctcVal" }
        }
      },
      {
        $project: {
          company: "$_id",
          offersCount: 1,
          avgCTC: { $ifNull: ["$avgCTC", 0] }
        }
      },
      { $sort: { offersCount: -1 } },
      { $limit: 10 }
    ]);

    const formattedCompanies = companyStats.map(c => ({
      company: c.company,
      offersCount: c.offersCount,
      avgCTC: parseFloat(c.avgCTC.toFixed(1))
    }));

    res.json({ companies: formattedCompanies });
  } catch (error) {
    console.error("Top Companies Error Stack:", error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/trend
// @desc    Chronological area chart data points
router.get("/trend", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const { applicationMatch } = await getFilterMatches(req);

    const oldestApp = await Application.findOne(applicationMatch).sort({ createdAt: 1 }).select("createdAt");

    let granularity = "week";
    if (oldestApp) {
      const diffTime = Math.abs(new Date() - new Date(oldestApp.createdAt));
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      if (diffWeeks >= 10) {
        granularity = "month";
      }
    }

    const formatString = granularity === "week" ? "%G-W%V" : "%Y-%m";

    const trendStats = await Application.aggregate([
      { $match: applicationMatch },
      {
        $group: {
          _id: { $dateToString: { format: formatString, date: "$createdAt" } },
          applications: { $sum: 1 },
          offers: { $sum: { $cond: [{ $eq: ["$stage", "offer"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const points = trendStats.map(t => ({
      period: t._id,
      applications: t.applications,
      offers: t.offers,
      placements: t.offers
    }));

    res.json({ granularity, points });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/applications-per-student
// @desc    Distribution bucket of student application volumes
router.get("/applications-per-student", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const { studentMatch } = await getFilterMatches(req);

    const appCounts = await User.aggregate([
      { $match: studentMatch },
      {
        $project: {
          appRange: {
            $cond: [
              { $eq: ["$applicationCount", 0] },
              "0 applications",
              {
                $cond: [
                  { $lte: ["$applicationCount", 3] },
                  "1-3",
                  {
                    $cond: [
                      { $lte: ["$applicationCount", 6] },
                      "4-6",
                      "7+"
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$appRange",
          count: { $sum: 1 }
        }
      }
    ]);

    const defaultBuckets = [
      { range: "0 applications", count: 0 },
      { range: "1-3", count: 0 },
      { range: "4-6", count: 0 },
      { range: "7+", count: 0 }
    ];

    const bucketMap = new Map(appCounts.map(b => [b._id, b.count]));
    const result = defaultBuckets.map(b => ({
      range: b.range,
      count: bucketMap.get(b.range) || 0
    }));

    res.json({ buckets: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retain legacy routes for back-compat
router.get("/pipeline", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const activeStudents = await User.find({ collegeId: req.user.collegeId, role: "student", isActive: { $ne: false } }).select("_id");
    const activeStudentIds = activeStudents.map(s => s._id);

    const stats = await Application.aggregate([
      { $match: { collegeId: new mongoose.Types.ObjectId(req.user.collegeId), studentId: { $in: activeStudentIds } } },
      { $group: { _id: "$stage", count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/branch", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { collegeId: new mongoose.Types.ObjectId(req.user.collegeId), role: "student", isActive: { $ne: false } } },
      { $group: { 
        _id: "$branch", 
        total: { $sum: 1 },
        placed: { $sum: { $cond: ["$isPlaced", 1, 0] } }
      } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/at-risk", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const students = await User.find({ 
      collegeId: req.user.collegeId, 
      role: "student",
      isActive: { $ne: false },
      isPlaced: false,
      $or: [
        { applicationCount: 0 },
        { activeBacklogs: { $gt: 0 } },
        { cgpa: { $lt: 6.5 } }
      ]
    }).select("name email branch year cgpa activeBacklogs applicationCount");
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/ats-distribution", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const activeStudents = await User.find({ collegeId: req.user.collegeId, role: "student", isActive: { $ne: false } }).select("_id");
    const activeStudentIds = activeStudents.map(s => s._id);

    const distribution = await Application.aggregate([
      { $match: { collegeId: new mongoose.Types.ObjectId(req.user.collegeId), studentId: { $in: activeStudentIds }, matchScore: { $exists: true } } },
      { 
        $bucket: {
          groupBy: "$matchScore",
          boundaries: [0, 20, 40, 60, 80, 101],
          default: "Other",
          output: { count: { $sum: 1 } }
        }
      }
    ]);
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/activity-heatmap", protect, requireRole("coordinator", "admin"), cacheMiddleware(60), async (req, res) => {
  try {
    const activeStudents = await User.find({ collegeId: req.user.collegeId, role: "student", isActive: { $ne: false } }).select("_id");
    const activeStudentIds = activeStudents.map(s => s._id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activity = await Application.aggregate([
      { 
        $match: { 
          collegeId: new mongoose.Types.ObjectId(req.user.collegeId),
          studentId: { $in: activeStudentIds },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
