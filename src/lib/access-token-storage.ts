import crypto from 'crypto';

// Access record interface
export interface AccessRecord {
  linkId: string;
  buyer: string;
  purchaseTransaction: string;
  accessToken: string;
  createdAt: number;
  expiresAt?: number;
  downloadCount: number;
  maxDownloads?: number;
  buyerEmail: string;
}

// Mock storage for serverless environments (MVP solution)
// In production, this should be replaced with a proper database
const mockAccessRecords = new Map<string, AccessRecord>();

// Mock valid tokens for testing (these would be generated from actual purchases)
const MOCK_VALID_TOKENS = new Set([
  'mock-token-123',
  'demo-access-token',
  'test-content-access',
  'sample-product-token'
]);

// Helper function to create a deterministic token from transaction data
function createDeterministicToken(linkId: string, buyer: string, transactionHash: string): string {
  const data = `${linkId}-${buyer}-${transactionHash}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

// Helper function to validate if a token is legitimate
function isValidTokenFormat(token: string, linkId: string, buyer?: string, transactionHash?: string): boolean {
  // Check if it's a mock token
  if (MOCK_VALID_TOKENS.has(token)) {
    return true;
  }
  
  // Check if it's a deterministic token (if we have the original data)
  if (buyer && transactionHash) {
    const expectedToken = createDeterministicToken(linkId, buyer, transactionHash);
    return token === expectedToken;
  }
  
  // For MVP, accept any token that looks like a valid hash (16+ chars, hexadecimal)
  const tokenPattern = /^[a-fA-F0-9]{16,}$/;
  return tokenPattern.test(token);
}

// Store access record (for MVP, just store in memory)
export function storeAccessRecord(record: AccessRecord): void {
  const key = `${record.linkId}-${record.accessToken}`;
  mockAccessRecords.set(key, record);
  console.log(`[MVP] Stored access record for ${record.linkId} with token ${record.accessToken.substring(0, 8)}...`);
}

// Get access record with mock validation
export async function getAccessRecord(linkId: string, accessToken: string): Promise<AccessRecord | undefined> {
  // First check if we have a stored record
  const key = `${linkId}-${accessToken}`;
  const stored = mockAccessRecords.get(key);
  
  if (stored) {
    // Check if expired
    if (stored.expiresAt && stored.expiresAt <= Date.now()) {
      mockAccessRecords.delete(key);
      return undefined;
    }
    return stored;
  }
  
  // If no stored record, check if token format is valid and create mock record
  if (isValidTokenFormat(accessToken, linkId)) {
    const mockRecord: AccessRecord = {
      linkId,
      accessToken,
      buyer: '0x1234567890123456789012345678901234567890', // Mock buyer address
      purchaseTransaction: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // Mock transaction
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
      downloadCount: 0,
      maxDownloads: 5,
      buyerEmail: 'test@example.com'
    };
    
    // Store the mock record
    mockAccessRecords.set(key, mockRecord);
    console.log(`[MVP] Created mock access record for ${linkId} with token ${accessToken.substring(0, 8)}...`);
    
    return mockRecord;
  }
  
  return undefined;
}

// Update download count
export function incrementDownloadCount(linkId: string, accessToken: string): void {
  const key = `${linkId}-${accessToken}`;
  const record = mockAccessRecords.get(key);
  
  if (record) {
    record.downloadCount += 1;
    mockAccessRecords.set(key, record);
    console.log(`[MVP] Incremented download count for ${linkId} to ${record.downloadCount}`);
  }
}

// Clean up expired records (for MVP, just clean memory)
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, record] of mockAccessRecords.entries()) {
    if (record.expiresAt && record.expiresAt <= now) {
      mockAccessRecords.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[MVP] Cleaned up ${cleanedCount} expired access records`);
  }
}

// Get all access records for a specific link (for admin purposes)
export function getAccessRecordsForLink(linkId: string): AccessRecord[] {
  const linkRecords: AccessRecord[] = [];
  
  for (const record of mockAccessRecords.values()) {
    if (record.linkId === linkId) {
      linkRecords.push(record);
    }
  }
  
  return linkRecords;
}

// Get all access records for a specific buyer (for user dashboard)
export function getAccessRecordsForBuyer(buyerAddress: string): AccessRecord[] {
  const buyerRecords: AccessRecord[] = [];
  
  for (const record of mockAccessRecords.values()) {
    if (record.buyer.toLowerCase() === buyerAddress.toLowerCase()) {
      buyerRecords.push(record);
    }
  }
  
  return buyerRecords;
}

// Helper function to add a mock valid token (for testing)
export function addMockValidToken(token: string): void {
  MOCK_VALID_TOKENS.add(token);
  console.log(`[MVP] Added mock valid token: ${token.substring(0, 8)}...`);
}