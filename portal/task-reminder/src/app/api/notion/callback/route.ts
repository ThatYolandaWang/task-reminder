// app/api/notion/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "buffer";

import { createClient } from "redis"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID!;
  const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET!;
  const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI!;
  const NOTION_API_URL = process.env.NOTION_API_URL!;

  const basicAuth = Buffer.from(
    `${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch(`${NOTION_API_URL}/v1/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: NOTION_REDIRECT_URI,
    }),
  });

  const tokenData = await tokenRes.json();

  console.log(tokenData)

  if (tokenRes.ok && tokenData.access_token) {

    const redis =  await createClient({ url: process.env.REDIS_URL }).connect();
    if (state) {

      console.log("save redis:", state)
      await redis.set(state, JSON.stringify(tokenData));
    }

    console.log("tokenData:", tokenData)


    // 如果有返回duplicated_template_id，则直接跳转到该页面
    let url = "https://www.notion.so"
    if (tokenData && tokenData.workspace_id) {
        url += "/" + tokenData.workspace_id.replace(/-/g, "")
    }
    if (tokenData && tokenData.duplicated_template_id) {
        url += "/" + tokenData.duplicated_template_id.replace(/-/g, "")
    }

    // 如果没有返回duplicated_template_id，则跳转到帮助页面
    if (tokenData && !tokenData.duplicated_template_id) {
      url = req.nextUrl.origin + "/help?status=userdefined"
    }

    console.log("url:", url)

    //return NextResponse.json(tokenData);
    return NextResponse.redirect(url);
  } else {

    console.log("url:", req.nextUrl.origin)
    const url = req.nextUrl.origin + `/help?status=error&error=${error}&error_description=${tokenData.error_description}`
    return NextResponse.redirect(url);
  }
}
