import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_CONFIG } from "@/lib/resend";
import { TransactionReceiptTemplate } from "@/components/email/transaction-receipt-template";
import { LinkType } from "@/types/relynk";
import React from "react";

interface SendReceiptRequest {
  buyerEmail: string;
  transactionHash: string;
  linkId: string;
  linkType: LinkType;
  amount: string;
  token: string;
  creatorName?: string;
  productTitle?: string;
  contentTitle?: string;
  accessUrl?: string;
  downloadUrl?: string;
  blockExplorerUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendReceiptRequest = await request.json();

    // Validate required fields
    const { buyerEmail, transactionHash, linkId, linkType, amount, token } =
      body;

    if (!buyerEmail || !transactionHash || !linkId || !amount || !token) {
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

    // Generate email subject based on link type
    const getSubject = () => {
      switch (linkType) {
        case LinkType.PRODUCT:
          return `Purchase Confirmation - ${body.productTitle || "Digital Product"}`;
        case LinkType.CONTENT:
          return `Content Access Granted - ${body.contentTitle || "Premium Content"}`;
        case LinkType.DONATION:
          return "Donation Confirmation - Thank You!";
        default:
          return "Payment Confirmation - Relynk";
      }
    };

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
      subject: getSubject(),
      react: TransactionReceiptTemplate({
        buyerEmail,
        transactionHash,
        linkId,
        linkType,
        amount,
        token,
        creatorName: body.creatorName,
        productTitle: body.productTitle,
        contentTitle: body.contentTitle,
        accessUrl: body.accessUrl,
        downloadUrl: body.downloadUrl,
        blockExplorerUrl: body.blockExplorerUrl,
      }) as React.ReactNode,
      tags: [
        {
          name: sanitizeTagName("category"),
          value: sanitizeTagValue("transaction-receipt"),
        },
        {
          name: sanitizeTagName("link-type"),
          value: sanitizeTagValue(LinkType[linkType].toLowerCase()),
        },
        {
          name: sanitizeTagName("transaction"),
          value: sanitizeTagValue(transactionHash),
        },
      ],
    });

    if (error) {
      console.error("Failed to send email:", error);
      return NextResponse.json(
        { error: "Failed to send email", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: "Transaction receipt sent successfully",
    });
  } catch (error) {
    console.error("Email API error:", error);
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
