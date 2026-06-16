const cron = require("node-cron");
const ScraperSource = require("../models/ScraperSource");
const Job = require("../models/Job");
const College = require("../models/College");
const User = require("../models/User");
const { scrapeUnstop } = require("../services/scraper");
const { sendEmail } = require("../services/notify");

const runAutoScrape = async () => {
  console.log("[CRON] Starting daily auto-scrape...");
  try {
    const activeSources = await ScraperSource.find({ isActive: true });
    
    // Group by collegeId to handle batch emails
    const collegeDraftCounts = {};

    for (const source of activeSources) {
      try {
        console.log(`[CRON] Scraping: ${source.url}`);
        const result = await scrapeUnstop(source.url);
        
        // Find a coordinator for postedBy (just grab the first one for the college)
        const coordinator = await User.findOne({ collegeId: source.collegeId, role: "coordinator" });
        if (!coordinator) continue;

        await Job.create({
          ...result,
          collegeId: source.collegeId,
          postedBy: coordinator._id,
          status: "draft",
          autoScraped: true
        });

        source.lastScrapedAt = new Date();
        await source.save();

        if (!collegeDraftCounts[source.collegeId]) collegeDraftCounts[source.collegeId] = 0;
        collegeDraftCounts[source.collegeId]++;

      } catch (err) {
        console.error(`[CRON] Failed to scrape ${source.url}:`, err.message);
      }
    }

    // Check thresholds and batch email coordinators
    const BATCH_THRESHOLD = 3; // Trigger email if 3 or more drafts exist
    
    for (const [collegeIdStr, newDrafts] of Object.entries(collegeDraftCounts)) {
      const totalDrafts = await Job.countDocuments({ collegeId: collegeIdStr, status: "draft" });
      
      if (totalDrafts >= BATCH_THRESHOLD) {
        const coordinators = await User.find({ collegeId: collegeIdStr, role: "coordinator" });
        for (const coord of coordinators) {
          await sendEmail(
            coord.email,
            "PlaceIQ: New Job Drafts Pending Review",
            `Hello ${coord.name},\n\nYou have ${totalDrafts} scraped job drafts pending your review on the PlaceIQ dashboard. Please log in to publish them to students.\n\nPlaceIQ System`
          );
        }
        console.log(`[CRON] Batch email sent to coordinators of college ${collegeIdStr} for ${totalDrafts} drafts.`);
      }
    }

    console.log("[CRON] Auto-scrape completed.");
  } catch (error) {
    console.error("[CRON] Auto-scrape error:", error);
    try {
      const adminEmail = process.env.ALERT_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@gmail.com';
      if (adminEmail) {
        await sendEmail(adminEmail, 'PlaceIQ: Auto-scrape FAILED', `The auto-scrape cron job encountered an error: ${error.message}\n\nStack Trace:\n${error.stack}`);
      }
    } catch (e) {
      console.error("[CRON] Failed to send auto-scrape error email:", e.message);
    }
  }
};

const setupAutoScrape = () => {
  // Run every day at 7:00 AM
  cron.schedule("0 7 * * *", runAutoScrape);
};

module.exports = setupAutoScrape;

