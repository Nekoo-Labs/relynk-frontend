import { pinata } from "@/lib/pinata";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; address: string }> }
) {
  const { id: linkId, address } = await params;

  if (!linkId) {
    return NextResponse.json(
      { text: "Link ID parameter is required" },
      { status: 400 }
    );
  }

  const file = await pinata.files.public.list().name(linkId).keyvalues({
    creator: address?.toLowerCase(),
  });

  if (file.files.length === 0) {
    return NextResponse.json({ text: "Link not found" }, { status: 404 });
  }

  try {
    await pinata.files.public.delete(file.files.map((file) => file.id));
    return NextResponse.json(
      { text: "Link deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ text: "Error deleting link:" }, { status: 500 });
  }
}
