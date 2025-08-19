import { LinkType } from '@/types/relynk';
import { api } from '@/services/api';

interface SendReceiptEmailParams extends Record<string, unknown> {
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

interface SendContentAccessEmailParams extends Record<string, unknown> {
  buyerEmail: string;
  contentTitle: string;
  creatorName?: string;
  accessUrl: string;
  accessToken: string;
  expiresAt?: string;
  transactionHash: string;
  purchaseDate: string;
}

interface EmailResponse {
  success: boolean;
  emailId?: string;
  message?: string;
  error?: string;
}

export class EmailService {
  
  /**
   * Send a transaction receipt email to the buyer
   */
  static async sendTransactionReceipt(params: SendReceiptEmailParams): Promise<EmailResponse> {
    try {
      const response = await api.post<EmailResponse>('/api/v1/email/send-receipt', params, {
        useRelativePath: true,
        skipAuth: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to send transaction receipt email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Send a content access email to the buyer
   */
  static async sendContentAccessEmail(params: SendContentAccessEmailParams): Promise<EmailResponse> {
    try {
      const response = await api.post<EmailResponse>('/api/v1/email/send-access', params, {
        useRelativePath: true,
        skipAuth: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to send content access email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Generate a secure access URL for content
   */
  static generateAccessUrl(linkId: string, accessToken: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/access/${linkId}?token=${accessToken}`;
  }
  
  /**
   * Generate a secure download URL for products
   */
  static generateDownloadUrl(linkId: string, transactionHash: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/download/${linkId}?tx=${transactionHash}`;
  }
  
  /**
   * Generate access token for content
   */
  static generateAccessToken(linkId: string, buyerAddress: string, transactionHash: string): string {
    // Create a simple token based on the transaction data
    // In production, this should be a proper JWT or encrypted token
    const data = `${linkId}-${buyerAddress}-${transactionHash}`;
    return Buffer.from(data).toString('base64url');
  }
  
  /**
   * Validate access token
   */
  static validateAccessToken(token: string, linkId: string, buyerAddress: string, transactionHash: string): boolean {
    try {
      const expectedToken = this.generateAccessToken(linkId, buyerAddress, transactionHash);
      return token === expectedToken;
    } catch {
      return false;
    }
  }
  
  /**
   * Format date for email display
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  }
  
  /**
   * Format expiration date
   */
  static formatExpirationDate(expiresAt: Date): string {
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'Expired';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`;
    } else {
      return this.formatDate(expiresAt);
    }
  }
}