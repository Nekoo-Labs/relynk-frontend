import { pinata } from "@/lib/pinata";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Generate a signed upload URL with 30 second expiry
    const url = await pinata.upload.public.createSignedURL({
      expires: 30,
    });

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("Error creating signed upload URL:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}