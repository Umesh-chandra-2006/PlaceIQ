from scrapegraphai.graphs import SmartScraperGraph
import os

def scrape_job_url(url: str) -> dict:
    config = {
        "llm": {
            "api_key": os.getenv("OPENROUTER_API_KEY"),
            "model": "openrouter/nvidia/llama-3.1-nemotron-70b-instruct",
        },
        "verbose": False,
        "headless": True,
    }

    scraper = SmartScraperGraph(
        prompt="""Extract job listing details and return as JSON with these exact keys:
        title, company, description, ctc, location, deadline (ISO date string or null),
        eligibility (object with: branches (array of strings), minCgpa (number), batchYears (array of numbers)),
        jobType (one of: fulltime, internship, ppo), sourceUrl (the original URL)
        If a field is not found, return null for that field.""",
        source=url,
        config=config
    )

    result = scraper.run()
    result["sourceUrl"] = url
    return result
