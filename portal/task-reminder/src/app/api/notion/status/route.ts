// app/api/notion/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "redis"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const state = searchParams.get("state");

  if (!state) {
    return NextResponse.json({ error: "No state provided" }, { status: 400 });
  }

  const redis =  await createClient({ url: process.env.REDIS_URL }).connect();
  const tokenData = await redis.get(state);

  redis.del(state);
  redis.close();

  if (tokenData) {

    return NextResponse.json({ status: "success", data: JSON.parse(tokenData) });
  } else {
    return NextResponse.json({ error: "No token data" }, { status: 400 });
  }
}
