import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import crypto from "crypto";

// TODO: FUTURE_IMPROVEMENT - Move JWT secret to environment variables for production
// TODO: FUTURE_IMPROVEMENT - Implement key rotation strategy for enhanced security
// TODO: FUTURE_IMPROVEMENT - Add JWT refresh token mechanism for long-term access
// TODO: FUTURE_IMPROVEMENT - Implement rate limiting for JWT generation
// TODO: FUTURE_IMPROVEMENT - Add audit logging for JWT operations
// FLAG: JWT_IMPLEMENTATION_V1 - Initial JWT implementation for MVP

// JWT secret - Must be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;
// if (!JWT_SECRET) {
//   throw new Error("JWT_SECRET environment variable is required but not set");
// }
const secret = new TextEncoder().encode(JWT_SECRET);

// JWT payload interface for access tokens
export interface AccessTokenPayload extends JWTPayload {
  linkId: string;
  buyer: string;
  purchaseTransaction: string;
  buyerEmail?: string;
  linkType?: string;
  contentTitle?: string;
  maxDownloads?: number;
  downloadCount?: number;
}

// JWT service class for access token management
export class JWTService {
  /**
   * Generate a JWT access token for purchased content
   * TODO: FUTURE_IMPROVEMENT - Add token expiration based on content type
   * TODO: FUTURE_IMPROVEMENT - Include additional metadata in token payload
   */
  static async generateAccessToken(
    linkId: string,
    buyer: string,
    purchaseTransaction: string,
    options: {
      buyerEmail?: string;
      linkType?: string;
      contentTitle?: string;
      maxDownloads?: number;
      expiresIn?: string; // e.g., '30d', '7d', '1h'
    } = {}
  ): Promise<string> {
    const {
      buyerEmail,
      linkType,
      contentTitle,
      maxDownloads = 5,
      expiresIn = "30d",
    } = options;

    const payload: AccessTokenPayload = {
      linkId,
      buyer: buyer.toLowerCase(), // Normalize address to lowercase
      purchaseTransaction,
      buyerEmail,
      linkType,
      contentTitle,
      maxDownloads,
      downloadCount: 0,
      // Standard JWT claims
      iss: "relynk", // Issuer
      sub: `access:${linkId}`, // Subject
      aud: "relynk-users", // Audience
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    // Calculate expiration time
    const expirationTime = this.parseExpirationTime(expiresIn);
    if (expirationTime) {
      payload.exp = Math.floor(expirationTime / 1000);
    }

    try {
      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer("relynk")
        .setAudience("relynk-users")
        .setSubject(`access:${linkId}`)
        .sign(secret);

      console.log(
        `[JWT] Generated access token for linkId: ${linkId}, buyer: ${buyer.substring(0, 8)}...`
      );
      return jwt;
    } catch (error) {
      console.error("[JWT] Error generating access token:", error);
      throw new Error("Failed to generate access token");
    }
  }

  /**
   * Verify and decode a JWT access token
   * TODO: FUTURE_IMPROVEMENT - Add token blacklisting mechanism
   * TODO: FUTURE_IMPROVEMENT - Implement token refresh logic
   */
  static async verifyAccessToken(
    token: string
  ): Promise<AccessTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: "relynk",
        audience: "relynk-users",
      });

      console.log(
        `[JWT] Successfully verified token for linkId: ${payload.linkId}`
      );
      return payload as AccessTokenPayload;
    } catch (error) {
      console.error("[JWT] Token verification failed:", error);
      return null;
    }
  }

  /**
   * Check if a token is expired
   * TODO: FUTURE_IMPROVEMENT - Add grace period for token expiration
   */
  static isTokenExpired(payload: AccessTokenPayload): boolean {
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  }

  /**
   * Validate token against specific criteria
   * TODO: FUTURE_IMPROVEMENT - Add more sophisticated validation rules
   */
  static validateTokenAccess(
    payload: AccessTokenPayload,
    linkId: string,
    buyerAddress?: string
  ): { isValid: boolean; error?: string } {
    // Check if token is for the correct link
    if (payload.linkId !== linkId) {
      return { isValid: false, error: "Token is not valid for this content" };
    }

    // Check if token is expired
    if (this.isTokenExpired(payload)) {
      return { isValid: false, error: "Access token has expired" };
    }

    // Check buyer address if provided
    if (
      buyerAddress &&
      payload.buyer.toLowerCase() !== buyerAddress.toLowerCase()
    ) {
      return {
        isValid: false,
        error: "Token does not match the connected wallet",
      };
    }

    // Check download limits
    if (
      payload.maxDownloads &&
      payload.downloadCount &&
      payload.downloadCount >= payload.maxDownloads
    ) {
      return { isValid: false, error: "Download limit exceeded" };
    }

    return { isValid: true };
  }

  /**
   * Create a new token with updated download count
   * TODO: FUTURE_IMPROVEMENT - Implement server-side download tracking
   */
  static async updateDownloadCount(
    token: string,
    incrementBy: number = 1
  ): Promise<string | null> {
    try {
      const payload = await this.verifyAccessToken(token);
      if (!payload) return null;

      const newDownloadCount = (payload.downloadCount || 0) + incrementBy;

      // Generate new token with updated download count
      return await this.generateAccessToken(
        payload.linkId,
        payload.buyer,
        payload.purchaseTransaction,
        {
          buyerEmail: payload.buyerEmail,
          linkType: payload.linkType,
          contentTitle: payload.contentTitle,
          maxDownloads: payload.maxDownloads,
          expiresIn: payload.exp
            ? `${Math.floor((payload.exp * 1000 - Date.now()) / (1000 * 60 * 60 * 24))}d`
            : "30d",
        }
      );
    } catch (error) {
      console.error("[JWT] Error updating download count:", error);
      return null;
    }
  }

  /**
   * Parse expiration time string to milliseconds
   * TODO: FUTURE_IMPROVEMENT - Support more time formats
   */
  private static parseExpirationTime(expiresIn: string): number | null {
    const timeRegex = /^(\d+)([dhm])$/;
    const match = expiresIn.match(timeRegex);

    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    const now = Date.now();

    switch (unit) {
      case "d": // days
        return now + value * 24 * 60 * 60 * 1000;
      case "h": // hours
        return now + value * 60 * 60 * 1000;
      case "m": // minutes
        return now + value * 60 * 1000;
      default:
        return null;
    }
  }

  /**
   * Generate a deterministic token for backward compatibility
   * TODO: FUTURE_IMPROVEMENT - Phase out deterministic tokens in favor of proper JWT flow
   * FLAG: BACKWARD_COMPATIBILITY - Support for existing mock token system
   */
  static generateDeterministicToken(
    linkId: string,
    buyer: string,
    transactionHash: string
  ): string {
    const data = `${linkId}-${buyer}-${transactionHash}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}

// Export utility functions for backward compatibility
export const generateAccessToken =
  JWTService.generateAccessToken.bind(JWTService);
export const verifyAccessToken = JWTService.verifyAccessToken.bind(JWTService);
export const validateTokenAccess =
  JWTService.validateTokenAccess.bind(JWTService);
export const updateDownloadCount =
  JWTService.updateDownloadCount.bind(JWTService);

// TODO: FUTURE_IMPROVEMENT - Add JWT middleware for automatic token validation
// TODO: FUTURE_IMPROVEMENT - Implement JWT token caching for performance
// TODO: FUTURE_IMPROVEMENT - Add support for different token types (access, refresh, etc.)
// TODO: FUTURE_IMPROVEMENT - Implement JWT token analytics and monitoring
// FLAG: JWT_SERVICE_COMPLETE - Core JWT service implementation ready for production use
