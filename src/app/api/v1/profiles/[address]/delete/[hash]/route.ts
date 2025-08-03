import { pinata } from "@/lib/pinata";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ address: string; hash: string }> }
) {
  try {
    const { address, hash } = await params;

    if (!address || !hash) {
      return NextResponse.json(
        { error: "Address and hash parameters are required" },
        { status: 400 }
      );
    }

    // Find the file by hash and creator
    const file = await pinata.files.public.list().cid(hash).keyvalues({
      creator: address.toLowerCase(),
    });

    if (file.files.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Delete the file from Pinata
    await pinata.files.public.delete(file.files.map((f) => f.id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting profile file:", error);
    return NextResponse.json(
      { error: "Failed to delete profile file" },
      { status: 500 }
    );
  }
}