import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_CONFIG } from "@/lib/resend";
import { ContentAccessTemplate } from "@/components/email/content-access-template";

interface SendAccessRequest {
  buyerEmail: string;
  contentTitle: string;
  creatorName?: string;
  accessUrl: string;
  accessToken: string;
  expiresAt?: string;
  transactionHash: string;
  purchaseDate: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendAccessRequest = await request.json();

    // Validate required fields
    const {
      buyerEmail,
      contentTitle,
      accessUrl,
      accessToken,
      transactionHash,
      purchaseDate,
    } = body;

    if (
      !buyerEmail ||
      !contentTitle ||
      !accessUrl ||
      !accessToken ||
      !transactionHash ||
      !purchaseDate
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(accessUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid access URL format" },
        { status: 400 }
      );
    }

    const subject = `🔓 Access Your Content: ${contentTitle}`;

    // Sanitize tag values to only include ASCII letters, numbers, underscores, or dashes
    const sanitizeTagValue = (value: string): string => {
      const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
      console.log(`Sanitizing tag value: "${value}" -> "${sanitized}"`);
      return sanitized;
    };

    // Sanitize tag names as well
    const sanitizeTagName = (name: string): string => {
      return name.replace(/[^a-zA-Z0-9_-]/g, "_");
    };

    // Send email using Resend with React component
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [buyerEmail],
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      react: ContentAccessTemplate({
        buyerEmail,
        contentTitle,
        creatorName: body.creatorName,
        accessUrl,
        accessToken,
        expiresAt: body.expiresAt,
        transactionHash,
        purchaseDate,
      }) as React.ReactNode,
      tags: [
        {
          name: sanitizeTagName("category"),
          value: sanitizeTagValue("content-access"),
        },
        {
          name: sanitizeTagName("content-title"),
          value: sanitizeTagValue(contentTitle),
        },
        {
          name: sanitizeTagName("transaction"),
          value: sanitizeTagValue(transactionHash),
        },
      ],
    });

    if (error) {
      console.error("Failed to send content access email:", error);
      return NextResponse.json(
        { error: "Failed to send email", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: "Content access email sent successfully",
    });
  } catch (error) {
    console.error("Content access email API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
