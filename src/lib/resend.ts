import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set in environment variables");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || "noreply@mail.rely.ink",
  replyTo: process.env.RESEND_REPLY_TO || "noreply@mail.rely.ink",
} as const;

// Email templates
export const EMAIL_TEMPLATES = {
  TRANSACTION_RECEIPT: "transaction-receipt",
  CONTENT_ACCESS: "content-access",
  PRODUCT_DELIVERY: "product-delivery",
} as const;
