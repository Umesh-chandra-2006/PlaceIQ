from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scraper import scrape_job_url
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()


class ScrapeRequest(BaseModel):
    url: str


@app.post("/scrape")
async def scrape(req: ScrapeRequest):
    try:
        result = await scrape_job_url(req.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}

