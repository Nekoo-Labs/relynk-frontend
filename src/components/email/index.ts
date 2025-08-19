export { EmailBaseTemplate } from './email-base-template';
export { TransactionReceiptTemplate } from './transaction-receipt-template';
export { ContentAccessTemplate } from './content-access-template';

// Email template types
export type EmailTemplateType = 'transaction-receipt' | 'content-access' | 'product-delivery';

// Common email props
export interface BaseEmailProps {
  buyerEmail: string;
  transactionHash: string;
  linkId: string;
}

export interface EmailMetadata {
  subject: string;
  previewText: string;
  templateType: EmailTemplateType;
}