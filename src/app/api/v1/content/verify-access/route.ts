import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { pinata } from '@/lib/pinata';
import { 
  storeAccessRecord, 
  getAccessRecord, 
  incrementDownloadCount 
} from '@/lib/access-token-storage';
import { JWTService } from '@/lib/jwt-service';

// TODO: FUTURE_IMPROVEMENT - Fully migrate to JWT-only verification
// TODO: FUTURE_IMPROVEMENT - Add rate limiting for API endpoints
// TODO: FUTURE_IMPROVEMENT - Implement JWT token caching for performance
// TODO: FUTURE_IMPROVEMENT - Add comprehensive API request logging and monitoring
// TODO: FUTURE_IMPROVEMENT - Implement JWT token blacklisting for revoked access
// TODO: FUTURE_IMPROVEMENT - Add API versioning for backward compatibility
// TODO: FUTURE_IMPROVEMENT - Implement request validation middleware
// FLAG: JWT_MIGRATION_V1 - Hybrid approach supporting both JWT and mock tokens
// FLAG: API_SECURITY_ENHANCEMENTS - Enhanced security measures for production deployment

// Validation schema
const verifyAccessSchema = z.object({
  linkId: z.string().min(1, 'Link ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  buyerAddress: z.string().optional(),
});

// Helper function to generate access token
export function generateAccessToken(linkId: string, buyer: string, transactionHash: string): string {
  const data = `${linkId}-${buyer}-${transactionHash}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Re-export storage functions for backward compatibility
export { storeAccessRecord, getAccessRecord, incrementDownloadCount };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkId, accessToken, buyerAddress } = verifyAccessSchema.parse(body);

    console.log(`[API] Verifying access for linkId: ${linkId}, token: ${accessToken?.substring(0, 8)}...`);

    // TODO: FUTURE_IMPROVEMENT - Add request rate limiting
    // TODO: FUTURE_IMPROVEMENT - Implement token caching for performance
    
    // Try JWT verification first (preferred method)
    const jwtPayload = await JWTService.verifyAccessToken(accessToken);
    
    if (jwtPayload) {
      console.log(`[API] JWT token verified for linkId: ${linkId}`);
      
      // Validate JWT token access
      const validation = JWTService.validateTokenAccess(jwtPayload, linkId, buyerAddress);
      
      if (!validation.isValid) {
        console.log(`[API] JWT validation failed: ${validation.error}`);
        return NextResponse.json(
          { isValid: false, error: validation.error },
          { status: 403 }
        );
      }

      // Get link data from Pinata using the correct method
      let linkData;
      try {
        const linkResponse = await pinata.files.public.list().name(linkId).keyvalues({
          type: "payment-link", // Only return payment link files
        }).limit(1);
        
        if (linkResponse.files.length === 0) {
          console.error(`[API] Link not found in Pinata for linkId: ${linkId}`);
          return NextResponse.json(
            { isValid: false, error: 'Content not found' },
            { status: 404 }
          );
        }
        
        // Fetch the actual IPFSLinkData content using the CID
        const fileItem = linkResponse.files[0];
        const contentResponse = await fetch(`https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${fileItem.cid}`);
        
        if (!contentResponse.ok) {
          console.error(`[API] Failed to fetch IPFS content for CID: ${fileItem.cid}`);
          return NextResponse.json(
            { isValid: false, error: 'Content not found' },
            { status: 404 }
          );
        }
        
        const ipfsLinkData = await contentResponse.json();
        
        // Convert IPFSLinkData to PaymentLink format for frontend compatibility
        linkData = {
          id: ipfsLinkData.linkData.linkId,
          title: ipfsLinkData.metadata.title,
          description: ipfsLinkData.metadata.description,
          creator: ipfsLinkData.linkData.creator,
          linkType: ipfsLinkData.linkData.linkType,
          amountType: ipfsLinkData.linkData.amountType,
          usageType: ipfsLinkData.linkData.usageType,
          amount: ipfsLinkData.linkData.amount.toString(),
          token: ipfsLinkData.linkData.token,
          expires: new Date(Number(ipfsLinkData.linkData.expires) * 1000),
          isActive: true,
          isUsed: false,
          createdAt: new Date(ipfsLinkData.createdAt),
          updatedAt: new Date(ipfsLinkData.updatedAt),
          metadata: ipfsLinkData.metadata,
          ipfsHash: fileItem.cid,
          signature: ipfsLinkData.signature,
          originalLinkData: ipfsLinkData.linkData
        };
      } catch (error) {
        console.error(`[API] Error fetching link data from Pinata:`, error);
        return NextResponse.json(
          { isValid: false, error: 'Content not found' },
          { status: 404 }
        );
      }

      console.log(`[API] JWT-based access verified successfully for linkId: ${linkId}`);
      
      return NextResponse.json({
        isValid: true,
        accessRecord: {
          linkId: jwtPayload.linkId,
          buyer: jwtPayload.buyer,
          purchaseTransaction: jwtPayload.purchaseTransaction,
          buyerEmail: jwtPayload.buyerEmail,
          linkType: jwtPayload.linkType,
          contentTitle: jwtPayload.contentTitle,
          maxDownloads: jwtPayload.maxDownloads,
          downloadCount: jwtPayload.downloadCount,
          expiresAt: jwtPayload.exp ? new Date(jwtPayload.exp * 1000) : null,
          createdAt: jwtPayload.iat ? new Date(jwtPayload.iat * 1000) : new Date()
        },
        linkData,
        downloadUrl: `https://gateway.pinata.cloud/ipfs/${linkId}`,
        tokenType: 'jwt'
      });
    }

    // Fallback to mock token system for backward compatibility
    // FLAG: BACKWARD_COMPATIBILITY - Remove this section in future versions
    console.log(`[API] JWT verification failed, trying mock token system for linkId: ${linkId}`);
    
    // Get access record from mock system
    const accessRecord = await getAccessRecord(linkId, accessToken);
    
    if (!accessRecord) {
      console.log(`[API] No access record found for linkId: ${linkId}`);
      return NextResponse.json(
        { isValid: false, error: 'Invalid access token' },
        { status: 403 }
      );
    }

    // Check if access has expired
    if (accessRecord.expiresAt && new Date() > new Date(accessRecord.expiresAt)) {
      console.log(`[API] Access expired for linkId: ${linkId}`);
      return NextResponse.json(
        { isValid: false, error: 'Access has expired' },
        { status: 403 }
      );
    }

    // Verify buyer address if provided
    if (buyerAddress && accessRecord.buyer.toLowerCase() !== buyerAddress.toLowerCase()) {
      console.log(`[API] Buyer address mismatch for linkId: ${linkId}`);
      return NextResponse.json(
        { isValid: false, error: 'Access token does not match connected wallet' },
        { status: 403 }
      );
    }

    // Check download limits
    if (accessRecord.maxDownloads && accessRecord.downloadCount >= accessRecord.maxDownloads) {
      console.log(`[API] Download limit exceeded for linkId: ${linkId}`);
      return NextResponse.json(
        { isValid: false, error: 'Download limit exceeded' },
        { status: 403 }
      );
    }

    // Get link data from Pinata using the correct method
    let linkData;
    try {
      const linkResponse = await pinata.files.public.list().name(linkId).keyvalues({
        type: "payment-link", // Only return payment link files
      }).limit(1);
      
      if (linkResponse.files.length === 0) {
        console.error(`[API] Link not found in Pinata for linkId: ${linkId}`);
        return NextResponse.json(
          { isValid: false, error: 'Content not found' },
          { status: 404 }
        );
      }
      
      // Fetch the actual IPFSLinkData content using the CID
      const fileItem = linkResponse.files[0];
      const contentResponse = await fetch(`https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${fileItem.cid}`);
      
      if (!contentResponse.ok) {
        console.error(`[API] Failed to fetch IPFS content for CID: ${fileItem.cid}`);
        return NextResponse.json(
          { isValid: false, error: 'Content not found' },
          { status: 404 }
        );
      }
      
      const ipfsLinkData = await contentResponse.json();
      
      // Convert IPFSLinkData to PaymentLink format for frontend compatibility
      linkData = {
        id: ipfsLinkData.linkData.linkId,
        title: ipfsLinkData.metadata.title,
        description: ipfsLinkData.metadata.description,
        creator: ipfsLinkData.linkData.creator,
        linkType: ipfsLinkData.linkData.linkType,
        amountType: ipfsLinkData.linkData.amountType,
        usageType: ipfsLinkData.linkData.usageType,
        amount: ipfsLinkData.linkData.amount.toString(),
        token: ipfsLinkData.linkData.token,
        expires: new Date(Number(ipfsLinkData.linkData.expires) * 1000),
        isActive: true,
        isUsed: false,
        createdAt: new Date(ipfsLinkData.createdAt),
        updatedAt: new Date(ipfsLinkData.updatedAt),
        metadata: ipfsLinkData.metadata,
        ipfsHash: fileItem.cid,
        signature: ipfsLinkData.signature,
        originalLinkData: ipfsLinkData.linkData
      };
    } catch (error) {
      console.error(`[API] Error fetching link data from Pinata:`, error);
      return NextResponse.json(
        { isValid: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    console.log(`[API] Mock token access verified successfully for linkId: ${linkId}`);

    return NextResponse.json({
      isValid: true,
      accessRecord,
      linkData,
      downloadUrl: `https://gateway.pinata.cloud/ipfs/${linkId}`,
      tokenType: 'mock'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[API] Validation error:', error.errors);
      return NextResponse.json(
        { isValid: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    console.error('[API] Internal server error:', error);
    return NextResponse.json(
      { isValid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method for testing access verification
// TODO: FUTURE_IMPROVEMENT - Add GET endpoint rate limiting
// TODO: FUTURE_IMPROVEMENT - Add query parameter validation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get('linkId');
  const accessToken = searchParams.get('token');
  const buyerAddress = searchParams.get('buyerAddress');
  
  if (!linkId || !accessToken) {
    return NextResponse.json(
      {
        isValid: false,
        error: 'Missing linkId or token parameter',
      },
      { status: 400 }
    );
  }

  // Reuse the POST logic with JWT support
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ linkId, accessToken, buyerAddress })
  }));
}