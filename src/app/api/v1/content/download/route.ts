import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAccessRecord,
  incrementDownloadCount,
} from "../verify-access/route";
import { pinata } from "@/lib/pinata";
import { ProductMetadata, ContentMetadata, PaymentMetadata, IPFSLinkData } from "@/types/relynk";

// Validation schema
const downloadSchema = z.object({
  linkId: z.string().min(1, "Link ID is required"),
  accessToken: z.string().min(1, "Access token is required"),
  buyerAddress: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkId, accessToken, buyerAddress } = downloadSchema.parse(body);

    // Get access record
    const accessRecord = await getAccessRecord(linkId, accessToken);

    if (!accessRecord) {
      return NextResponse.json(
        { error: "Invalid access token or link ID" },
        { status: 403 }
      );
    }

    // Check if access has expired
    if (accessRecord.expiresAt && accessRecord.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: "Access has expired" },
        { status: 403 }
      );
    }

    // Verify buyer address if provided
    if (
      buyerAddress &&
      accessRecord.buyer.toLowerCase() !== buyerAddress.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Access token does not match the connected wallet" },
        { status: 403 }
      );
    }

    // Check download limits
    if (
      accessRecord.maxDownloads &&
      accessRecord.downloadCount >= accessRecord.maxDownloads
    ) {
      return NextResponse.json(
        { error: "Download limit exceeded" },
        { status: 403 }
      );
    }

    // Fetch link data directly from Pinata
    const link = await pinata.files.public
      .list()
      .name(linkId)
      .keyvalues({
        type: "payment-link", // Only return payment link files
      })
      .limit(1);

    if (link.files.length === 0) {
      return NextResponse.json(
        { error: "Payment link not found" },
        { status: 404 }
      );
    }

    const linkFile = link.files[0];

    // Fetch the actual file content from IPFS
    const response = await fetch(
      `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${linkFile.cid}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to retrieve payment link data" },
        { status: 500 }
      );
    }

    const linkData = await response.json();

    // Check if files exist in the metadata (for product links)
    const productMetadata = linkData.metadata as ProductMetadata;
    if (!productMetadata?.files || productMetadata.files.length === 0) {
      return NextResponse.json(
        { error: "No files available for download" },
        { status: 404 }
      );
    }

    // For demo purposes, we'll create a simple text file with content info
    // In production, you would fetch the actual file from storage (IPFS, S3, etc.)
    const fileContent = createDemoFile(linkData);
    const fileName = `${linkData.metadata?.title || "download"}.txt`;

    // Increment download count
    incrementDownloadCount(linkId, accessToken);

    // Return file as download
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileContent.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to create demo file content
function createDemoFile(ipfsLinkData: IPFSLinkData): string {
  const { linkData, metadata } = ipfsLinkData;
  const typedMetadata = metadata as ContentMetadata | ProductMetadata | PaymentMetadata;

  const content = `
🎉 RELYNK DIGITAL PRODUCT 🎉

Title: ${metadata?.title || "Untitled"}
Description: ${metadata?.description || "No description"}
Creator: ${metadata?.creatorInfo?.name || "Unknown"}

📁 FILES INCLUDED:
${
  ("files" in typedMetadata && typedMetadata.files)
    ? typedMetadata.files
        .map(
          (file: any, index: number) =>
            `${index + 1}. ${file.name || `File ${index + 1}`} (${file.size || "Unknown size"})`
        )
        .join("\n")
    : "No files listed"
}

🔗 PURCHASE DETAILS:
Link ID: ${linkData?.linkId || "Unknown"}
Price: ${linkData?.amount || "Unknown"} ${linkData?.token || "Unknown"}
Network: ${metadata?.originalChainId || "Unknown"}

📝 CONTENT ACCESS:
${"contentUrl" in typedMetadata && typedMetadata.contentUrl ? `Online Access: ${typedMetadata.contentUrl}` : "No online access available"}

⚠️  IMPORTANT NOTES:
- This is a demo file representing your purchased content
- In a production environment, this would be replaced with your actual digital files
- Keep this access link secure and do not share it with others
- Your purchase is recorded on the blockchain for verification

🙏 Thank you for your purchase!
Powered by Relynk - Secure Digital Content Delivery

Generated on: ${new Date().toISOString()}
  `.trim();

  return content;
}

// GET method for direct download links (with token in URL)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get("linkId");
  const accessToken = searchParams.get("token");
  const buyerAddress = searchParams.get("buyer");

  if (!linkId || !accessToken) {
    return NextResponse.json(
      { error: "Missing linkId or token parameter" },
      { status: 400 }
    );
  }

  // Create a mock request body for the POST handler
  const mockRequest = {
    json: async () => ({
      linkId,
      accessToken,
      buyerAddress,
    }),
  } as NextRequest;

  return POST(mockRequest);
}
