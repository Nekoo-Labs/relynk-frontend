import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/jwt-service';
import { LinkType } from '@/types/relynk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      linkId,
      buyerAddress,
      transactionHash,
      buyerEmail,
      linkType,
      contentTitle,
      maxDownloads,
      expiresIn = '30d'
    } = body;

    // Validate required fields
    if (!linkId || !buyerAddress || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields: linkId, buyerAddress, transactionHash' },
        { status: 400 }
      );
    }

    // Generate JWT access token
    const accessToken = await JWTService.generateAccessToken(
      linkId,
      buyerAddress,
      transactionHash,
      {
        buyerEmail: buyerEmail || undefined,
        linkType: linkType === LinkType.CONTENT ? 'content' : 'product',
        contentTitle,
        maxDownloads: linkType === LinkType.PRODUCT ? maxDownloads || 5 : undefined,
        expiresIn
      }
    );

    return NextResponse.json({
      success: true,
      accessToken
    });

  } catch (error) {
    console.error('JWT generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}