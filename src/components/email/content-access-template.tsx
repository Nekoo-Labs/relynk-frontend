import React from "react";
import { EmailBaseTemplate } from "./email-base-template";

interface ContentAccessTemplateProps {
  buyerEmail: string;
  contentTitle: string;
  creatorName?: string;
  accessUrl: string;
  accessToken: string;
  expiresAt?: string;
  transactionHash: string;
  purchaseDate: string;
}

export const ContentAccessTemplate: React.FC<ContentAccessTemplateProps> = ({
  buyerEmail,
  contentTitle,
  creatorName,
  accessUrl,
  accessToken,
  expiresAt,
  transactionHash,
  purchaseDate,
}) => {
  return (
    <EmailBaseTemplate previewText={`Access your content: ${contentTitle}`}>
      <h1>🔓 Content Access Ready</h1>
      <p>Hello,</p>
      <p>
        Your purchase of{" "}
        <strong className="text-primary">{contentTitle}</strong> has been
        confirmed! You now have secure access to this premium content.
      </p>

      <div className="highlight">
        <h3>🎉 Access Your Content Now</h3>
        <p>Click the secure button below to access your purchased content:</p>

        <a
          href={accessUrl}
          className="button"
          style={{ fontSize: "16px", padding: "14px 28px" }}
        >
          🔓 Access {contentTitle}
        </a>

        <p className="text-muted">
          <small>
            This is a secure, personalized link tied to your blockchain
            transaction. Do not share this link with others.
          </small>
        </p>
      </div>

      <div className="card">
        <h3>Access Details</h3>
        <div className="divider" />

        <div style={{ marginBottom: "12px" }}>
          <strong>Content:</strong>{" "}
          <span className="text-primary">{contentTitle}</span>
        </div>

        {creatorName && (
          <div style={{ marginBottom: "12px" }}>
            <strong>Creator:</strong>{" "}
            <span className="text-muted">{creatorName}</span>
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <strong>Purchase Date:</strong>{" "}
          <span className="text-muted">{purchaseDate}</span>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <strong>Access Token:</strong>
          <br />
          <code
            style={{
              fontSize: "11px",
              wordBreak: "break-all",
              color: "#831843",
              backgroundColor: "#fdf2f8",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {accessToken}
          </code>
        </div>

        {expiresAt && (
          <div style={{ marginBottom: "12px" }}>
            <strong>Access Expires:</strong>
            <span className="text-muted" style={{ color: "#dc2626" }}>
              {" "}
              {expiresAt}
            </span>
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <strong>Transaction:</strong>
          <br />
          <code
            style={{
              fontSize: "10px",
              wordBreak: "break-all",
              color: "#831843",
            }}
          >
            {transactionHash}
          </code>
        </div>
      </div>

      <div
        className="card"
        style={{ backgroundColor: "#f0f9ff", borderColor: "#0ea5e9" }}
      >
        <h3 style={{ color: "#0369a1" }}>💡 How to Access Your Content</h3>
        <ol style={{ paddingLeft: "20px", color: "#0369a1" }}>
          <li style={{ marginBottom: "8px" }}>
            Click the &quot;Access Content&quot; button above
          </li>
          <li style={{ marginBottom: "8px" }}>
            You&apos;ll be redirected to a secure page
          </li>
          <li style={{ marginBottom: "8px" }}>
            Your access will be automatically verified using blockchain data
          </li>
          <li style={{ marginBottom: "8px" }}>Enjoy your premium content!</li>
        </ol>
      </div>

      <div className="divider" />

      <h3>Important Security Information</h3>
      <div
        className="card"
        style={{ backgroundColor: "#fef3c7", borderColor: "#f59e0b" }}
      >
        <p style={{ color: "#92400e", margin: 0 }}>
          <strong>🔒 Keep This Email Safe:</strong> This email contains your
          unique access credentials. Do not forward this email or share your
          access link with others. Your access is tied to your blockchain
          transaction and is non-transferable.
        </p>
      </div>

      <h3>Need Support?</h3>
      <p className="text-muted">
        If you&apos;re having trouble accessing your content or have any
        questions, our support team is here to help. Please include your
        transaction hash when contacting support for faster assistance.
      </p>

      <p>Enjoy your content!</p>

      <div
        style={{
          marginTop: "24px",
          padding: "16px",
          backgroundColor: "#f0fdf4",
          borderRadius: "8px",
          borderLeft: "4px solid #22c55e",
        }}
      >
        <p
          className="text-muted"
          style={{ fontSize: "12px", margin: 0, color: "#166534" }}
        >
          <strong>Blockchain Verified:</strong> Your access rights are secured
          by blockchain technology. This ensures permanent proof of purchase and
          prevents unauthorized access.
        </p>
      </div>
    </EmailBaseTemplate>
  );
};
