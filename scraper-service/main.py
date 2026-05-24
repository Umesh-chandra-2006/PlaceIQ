from fastapi import FastAPI
from pydantic import BaseModel
from scraper import scrape_job_url
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

class ScrapeRequest(BaseModel):
    url: str

@app.post("/scrape")
async def scrape(req: ScrapeRequest):
    result = scrape_job_url(req.url)
    return result
