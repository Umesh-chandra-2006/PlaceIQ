/**
 * Service to scrape job details using the Python ScrapeGraphAI microservice.
 */
const axios = require("axios");

async function scrapeUnstop(url) {
  try {
    const scraperUrl = process.env.SCRAPER_SERVICE_URL || "http://localhost:8000";
    
    // Call the Python FastAPI microservice
    const { data } = await axios.post(`${scraperUrl}/scrape`, { url });
    
    // Ensure all required fields exist (fallback if LLM misses them)
    return {
      title: data.title || "Scraped Job Title",
      company: data.company || "Scraped Company",
      description: data.description || "No description found.",
      ctc: data.ctc || null,
      location: data.location || null,
      deadline: data.deadline || null,
      jobType: data.jobType || "fulltime",
      eligibility: data.eligibility || {
        branches: [],
        minCgpa: 0,
        maxBacklogs: 0,
        batchYears: []
      },
      sourceUrl: url
    };
  } catch (error) {
    console.error("Scraping Microservice Error:", error.message);
    throw new Error("Failed to scrape job details from microservice");
  }
}

module.exports = { scrapeUnstop };
