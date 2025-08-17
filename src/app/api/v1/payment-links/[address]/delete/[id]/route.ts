import { pinata } from "@/lib/pinata";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; address: string }> }
) {
  const { id: linkId, address } = await params;

  if (!linkId) {
    return NextResponse.json(
      { text: "Link ID parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Find the main payment link file
    const mainFile = await pinata.files.public.list().name(linkId).keyvalues({
      creator: address?.toLowerCase(),
      type: "payment-link",
    });

    if (mainFile.files.length === 0) {
      return NextResponse.json({ text: "Link not found" }, { status: 404 });
    }

    const filesToDelete: string[] = [];
    
    // Add main payment link file to deletion list
    filesToDelete.push(...mainFile.files.map((file) => file.id));

    // Try to retrieve the payment link data to find associated content
    try {
      const mainFileData = mainFile.files[0];
      const response = await fetch(`https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${mainFileData.cid}`);
      
      if (response.ok) {
        const linkData = await response.json();
        
        // Helper function to extract IPFS hash from various formats
        const extractIPFSHash = (input: string): string | null => {
          // Check if it's already an IPFS hash (starts with 'baf', 'Qm', etc.)
          if (/^(baf[a-z0-9]+|Qm[a-zA-Z0-9]+)$/.test(input)) {
            return input;
          }
          // Extract from IPFS URL format
          const urlMatch = input.match(/\/ipfs\/([a-zA-Z0-9]+)/);
          if (urlMatch) {
            return urlMatch[1];
          }
          // Extract from gateway URL format
          const gatewayMatch = input.match(/https?:\/\/[^\/]+\/ipfs\/([a-zA-Z0-9]+)/);
          if (gatewayMatch) {
            return gatewayMatch[1];
          }
          return null;
        };

        // Check for images in metadata
        if (linkData.metadata?.images && Array.isArray(linkData.metadata.images)) {
          for (const imageInput of linkData.metadata.images) {
            const imageHash = extractIPFSHash(imageInput);
            if (imageHash) {
              try {
                const imageFiles = await pinata.files.public.list().cid(imageHash);
                filesToDelete.push(...imageFiles.files.map((file) => file.id));
                console.log(`Found image to delete: ${imageHash}`);
              } catch (err) {
                console.warn(`Could not find image file for hash ${imageHash}:`, err);
              }
            }
          }
        }
        
        // Check for preview content images
        if (linkData.metadata?.previewContent?.images && Array.isArray(linkData.metadata.previewContent.images)) {
          for (const imageInput of linkData.metadata.previewContent.images) {
            const imageHash = extractIPFSHash(imageInput);
            if (imageHash) {
              try {
                const imageFiles = await pinata.files.public.list().cid(imageHash);
                filesToDelete.push(...imageFiles.files.map((file) => file.id));
                console.log(`Found preview image to delete: ${imageHash}`);
              } catch (err) {
                console.warn(`Could not find preview image file for hash ${imageHash}:`, err);
              }
            }
          }
        }

        // Check for videos in metadata (for product links)
        if (linkData.metadata?.videos && Array.isArray(linkData.metadata.videos)) {
          for (const videoInput of linkData.metadata.videos) {
            const videoHash = extractIPFSHash(videoInput);
            if (videoHash) {
              try {
                const videoFiles = await pinata.files.public.list().cid(videoHash);
                filesToDelete.push(...videoFiles.files.map((file) => file.id));
                console.log(`Found video to delete: ${videoHash}`);
              } catch (err) {
                console.warn(`Could not find video file for hash ${videoHash}:`, err);
              }
            }
          }
        }
      }
    } catch (retrievalError) {
      console.warn("Could not retrieve link data for cleanup:", retrievalError);
      // Continue with deletion of main file even if we can't clean up associated content
    }

    // Find any legacy metadata files (from before the fix)
    // Note: These would be standalone metadata files that were uploaded separately
    try {
      const metadataFiles = await pinata.files.public.list().keyvalues({
        type: "metadata",
        linkType: "payment", // or other link types
      });
      // Filter metadata files that might be related to this link
      const relatedMetadataFiles = metadataFiles.files.filter(file => 
        file.name && file.name.includes(linkId)
      );
      filesToDelete.push(...relatedMetadataFiles.map((file) => file.id));
    } catch (metadataError) {
      console.warn("Could not find legacy metadata files:", metadataError);
    }

    // Remove duplicates
    const uniqueFilesToDelete = [...new Set(filesToDelete)];
    
    if (uniqueFilesToDelete.length > 0) {
      await pinata.files.public.delete(uniqueFilesToDelete);
      console.log(`Deleted ${uniqueFilesToDelete.length} files for link ${linkId}`);
    }

    return NextResponse.json(
      { 
        text: "Link and associated content deleted successfully",
        success: true,
        deletedFiles: uniqueFilesToDelete.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { 
        text: "Error deleting link",
        error: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}
