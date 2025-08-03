import { pinata } from "@/lib/pinata";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ text: "Missing id" }, { status: 400 });
  }

  console.log(id);

  const link = await pinata.files.public.list().name(id).limit(1);

  if (link.files.length === 0) {
    return NextResponse.json({ text: "Link not found" }, { status: 404 });
  }

  return NextResponse.json(link.files[0]);
}
