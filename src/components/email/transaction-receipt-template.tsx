import React from "react";
import { EmailBaseTemplate } from "./email-base-template";
import { LinkType } from "@/types/relynk";

interface TransactionReceiptTemplateProps {
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

export const TransactionReceiptTemplate: React.FC<
  TransactionReceiptTemplateProps
> = ({
  buyerEmail,
  transactionHash,
  linkId,
  linkType,
  amount,
  token,
  creatorName,
  productTitle,
  contentTitle,
  accessUrl,
  downloadUrl,
  blockExplorerUrl,
}) => {
  const getTitle = () => {
    switch (linkType) {
      case LinkType.PRODUCT:
        return `Purchase Confirmation - ${productTitle || "Digital Product"}`;
      case LinkType.CONTENT:
        return `Content Access Granted - ${contentTitle || "Premium Content"}`;
      case LinkType.DONATION:
        return "Donation Confirmation";
      default:
        return "Payment Confirmation";
    }
  };

  const getDescription = () => {
    switch (linkType) {
      case LinkType.PRODUCT:
        return "Your purchase has been confirmed and your digital product is ready for download.";
      case LinkType.CONTENT:
        return "Your payment has been confirmed and you now have access to the premium content.";
      case LinkType.DONATION:
        return "Thank you for your generous donation! Your support means a lot.";
      default:
        return "Your payment has been successfully processed on the blockchain.";
    }
  };

  return (
    <EmailBaseTemplate
      previewText={`${getTitle()} - Transaction: ${transactionHash.slice(0, 10)}...`}
    >
      <h1>{getTitle()}</h1>
      <p>Hello,</p>
      <p>{getDescription()}</p>

      <div className="card">
        <h3>Transaction Details</h3>
        <div className="divider" />

        <div style={{ marginBottom: "12px" }}>
          <strong>Amount:</strong>{" "}
          <span className="text-primary">
            {amount} {token}
          </span>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <strong>Transaction Hash:</strong>
          <br />
          <code
            style={{
              fontSize: "12px",
              wordBreak: "break-all",
              color: "#831843",
            }}
          >
            {transactionHash}
          </code>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <strong>Link ID:</strong> <span className="text-muted">{linkId}</span>
        </div>

        {creatorName && (
          <div style={{ marginBottom: "12px" }}>
            <strong>Creator:</strong>{" "}
            <span className="text-muted">{creatorName}</span>
          </div>
        )}

        {blockExplorerUrl && (
          <div style={{ marginTop: "16px" }}>
            <a
              href={blockExplorerUrl}
              className="button"
              style={{ fontSize: "14px", padding: "8px 16px" }}
            >
              View on Block Explorer
            </a>
          </div>
        )}
      </div>

      {(linkType === LinkType.PRODUCT || linkType === LinkType.CONTENT) && (
        <div className="highlight">
          <h3>
            🎉 Your {linkType === LinkType.PRODUCT ? "Product" : "Content"} is
            Ready!
          </h3>

          {linkType === LinkType.PRODUCT && downloadUrl && (
            <>
              <p>Click the button below to download your digital product:</p>
              <a href={downloadUrl} className="button">
                📥 Download Product
              </a>
              <p className="text-muted">
                <small>
                  This download link is secure and tied to your transaction.
                </small>
              </p>
            </>
          )}

          {linkType === LinkType.CONTENT && accessUrl && (
            <>
              <p>Click the button below to access your premium content:</p>
              <a href={accessUrl} className="button">
                🔓 Access Content
              </a>
              <p className="text-muted">
                <small>
                  This access link is secure and tied to your transaction.
                </small>
              </p>
            </>
          )}
        </div>
      )}

      <div className="divider" />

      <h3>Need Help?</h3>
      <p className="text-muted">
        If you have any questions about your purchase or need assistance
        accessing your content, please don&apos;t hesitate to contact our
        support team.
      </p>

      <p className="text-muted">
        <strong>Important:</strong> This email serves as your receipt. Please
        keep it for your records.
      </p>

      <p>Thank you for using Relynk!</p>

      <div
        style={{
          marginTop: "24px",
          padding: "16px",
          backgroundColor: "#fdf2f8",
          borderRadius: "8px",
        }}
      >
        <p className="text-muted" style={{ fontSize: "12px", margin: 0 }}>
          <strong>Security Notice:</strong> This transaction was processed on
          the blockchain and is immutable. The transaction hash above serves as
          cryptographic proof of your purchase.
        </p>
      </div>
    </EmailBaseTemplate>
  );
};
