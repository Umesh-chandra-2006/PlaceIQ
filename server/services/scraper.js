/**
 * Service to scrape job details using the Python Playwright + LLM microservice.
 * Passes through ALL fields returned by the scraper — no silent stripping.
 */
const axios = require("axios");

async function scrapeUnstop(url) {
  try {
    const scraperUrl = process.env.SCRAPER_SERVICE_URL || "http://localhost:8000";

    // Call the Python FastAPI microservice (up to 120s for Playwright + LLM)
    const { data } = await axios.post(`${scraperUrl}/scrape`, { url }, { timeout: 120000 });

    // Normalise "N/A" sentinel → null for date/numeric fields the DB expects
    const normaliseNA = (v) => (v === "N/A" || v === "" || v === undefined ? null : v);
    const normaliseNum = (v) => (v === "N/A" || v === undefined || v === null ? "N/A" : v);

    // Ensure placementStatus is always an array
    const rawStatus = data.eligibility?.placementStatus;
    const placementStatus = Array.isArray(rawStatus)
      ? rawStatus
      : rawStatus
        ? [rawStatus]
        : ["not_placed"];

    return {
      // Core fields
      title:   data.title   || "Untitled Position",
      company: data.company || "Unknown Company",
      location: normaliseNA(data.location),
      stipend:  normaliseNA(data.stipend || data.ctc),
      ctc:      normaliseNA(data.ctc     || data.stipend),
      deadline: normaliseNA(data.deadline),
      jobType:  data.jobType || "fulltime",
      workMode: data.workMode || "N/A",
      duration: normaliseNA(data.duration),
      sourceUrl: url,

      // Rich content  (keep N/A as-is so frontend can show "N/A")
      rolesAndResponsibilities: data.rolesAndResponsibilities || null,
      requirements:  data.requirements  || null,
      additionalInfo: data.additionalInfo || null,

      // Eligibility — pass everything through, normalise numeric sentinels
      eligibility: {
        description:       data.eligibility?.description       || null,
        experience:        data.eligibility?.experience        || null,
        branches:          Array.isArray(data.eligibility?.branches)   ? data.eligibility.branches   : [],
        departments:       Array.isArray(data.eligibility?.departments) ? data.eligibility.departments : [],
        sections:          Array.isArray(data.eligibility?.sections)    ? data.eligibility.sections    : [],
        batchIds:          Array.isArray(data.eligibility?.batchIds)    ? data.eligibility.batchIds    : [],
        batchYears:        Array.isArray(data.eligibility?.batchYears)  ? data.eligibility.batchYears  : [],
        minCgpa:           normaliseNum(data.eligibility?.minCgpa),
        maxBacklogs:       normaliseNum(data.eligibility?.maxBacklogs),
        maxActiveBacklogs: normaliseNum(data.eligibility?.maxActiveBacklogs),
        minTenthPercent:   normaliseNum(data.eligibility?.minTenthPercent),
        minTwelfthPercent: normaliseNum(data.eligibility?.minTwelfthPercent),
        placementStatus,
      }
    };
  } catch (error) {
    console.error("Scraping Microservice failed:", error.message);
    throw new Error("Scraping failed: " + error.message);
  }
}

module.exports = { scrapeUnstop };
