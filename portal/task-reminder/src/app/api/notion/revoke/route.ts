import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token;

  const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID!;
  const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET!;
  const NOTION_API_URL = process.env.NOTION_API_URL!;

  const basicAuth = Buffer.from(
    `${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch(`${NOTION_API_URL}/v1/oauth/revoke`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      token,
    }),
  });

  if (tokenRes.status === 200) {
    return NextResponse.json({ status: "success" });
  } else {
    return NextResponse.json({ status: "error" }, { status: 400 });
  }
}