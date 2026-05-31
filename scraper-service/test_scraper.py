import os
import json
from dotenv import load_dotenv
from scraper import scrape_job_url

# Load environment variables
load_dotenv()

def main():
    url = "https://unstop.com/internships/ai-growth-engineer-internship-village-company-1687107"
    print("Testing custom scraper on Unstop URL...")
    try:
        data = scrape_job_url(url)
        print("\nSUCCESS! Scraped JSON output:")
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"\nERROR running scraper: {e}")

if __name__ == "__main__":
    main()
