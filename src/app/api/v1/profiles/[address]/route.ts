import { pinata } from "@/lib/pinata";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    // Get files with keyvalues filter for this creator's profiles
    const { files } = await pinata.files.public.list().keyvalues({
      type: "profile",
      creator: address.toLowerCase(),
    });

    // Transform the response to match expected format
    const profileFiles = files.map((file) => ({
      cid: file.cid,
      name: file.name,
      size: file.size,
      createdAt: file.created_at || new Date().toISOString(),
      keyvalues: file.keyvalues,
    }));

    return NextResponse.json({ data: profileFiles }, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile files:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile files" },
      { status: 500 }
    );
  }
}