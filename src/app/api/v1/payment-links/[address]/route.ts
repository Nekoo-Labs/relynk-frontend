import { pinata } from "@/lib/pinata";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!address) {
    return NextResponse.json(
      { text: "Address parameter is required" },
      { status: 400 }
    );
  }
  try {
    const { files } = await pinata.files.public.list().keyvalues({
      creator: address?.toLowerCase(),
    });

    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { text: "Error creating API Key:" },
      { status: 500 }
    );
  }
}
