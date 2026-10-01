import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

export function POST() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
