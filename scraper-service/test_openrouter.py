import os
import httpx
from dotenv import load_dotenv

load_dotenv()

def test():
    api_key = os.getenv("OPENROUTER_API_KEY")
    print(f"API Key present: {bool(api_key)}")
    if api_key:
        print(f"API Key prefix: {api_key[:10]}...")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Try a free model first to verify connectivity
    payload = {
        "model": "meta-llama/llama-3.3-70b-instruct",
        "messages": [
            {"role": "user", "content": "Hello! Respond with 'Ready'"}
        ],
        "max_tokens": 1000
    }

    url = "https://openrouter.ai/api/v1/chat/completions"
    try:
        r = httpx.post(url, headers=headers, json=payload, timeout=10)
        print("Status Code:", r.status_code)
        print("Response Text:", r.text)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test()
