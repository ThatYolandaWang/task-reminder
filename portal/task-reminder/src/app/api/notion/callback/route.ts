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

  const basicAuth = Buffer.from(
    `${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
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

  if (tokenRes.ok && tokenData.access_token) {

    const redis =  await createClient({ url: process.env.REDIS_URL }).connect();
    if (state) {
      await redis.set(state, JSON.stringify(tokenData));
    }

    return NextResponse.json(tokenData);
  } else {
    return NextResponse.json({ error: tokenData }, { status: 400 });
  }
}
