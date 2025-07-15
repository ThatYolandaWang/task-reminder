# main.py
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx
from dotenv import load_dotenv
import base64

load_dotenv()

NOTION_CLIENT_ID = os.getenv("NOTION_CLIENT_ID")
NOTION_CLIENT_SECRET = os.getenv("NOTION_CLIENT_SECRET")
NOTION_REDIRECT_URI = os.getenv("NOTION_REDIRECT_URI")

app = FastAPI()

@app.get("/")
def index():
    return {"msg": "FastAPI Notion OAuth Callback Server Running."}

@app.get("/auth/notion/callback", response_class=JSONResponse)
async def notion_callback(request: Request):
    code = request.query_params.get("code")
    error = request.query_params.get("error")
    if error:
        return f"<h2>授权失败: {error}</h2>"
    if not code:
        return "<h2>未获取到 code</h2>"

    # 用 code 换取 access_token
    token_url = "https://api.notion.com/v1/oauth/token"
    headers = {
        "Authorization": "Basic " + base64.b64encode(f"{NOTION_CLIENT_ID}:{NOTION_CLIENT_SECRET}".encode()).decode(),
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": NOTION_REDIRECT_URI
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(token_url, headers=headers, json=data)
        token_data = resp.json()
        return resp.json()
    # if "access_token" in token_data:
    #     return resp.json()
    # else:
    #     return resp.json()
