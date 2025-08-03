"use client";

import { ProfileData } from "@/types/profile";
import { pinata } from "./pinata";

/**
 * Service for handling profile data storage and retrieval from IPFS using Pinata
 * Uses signed URLs for secure client-side uploads without exposing API keys
 */
export class ProfileIPFSService {
  private static readonly PINATA_GATEWAY = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs`;

  /**
   * Upload profile data to IPFS using signed URL
   */
  public static async uploadProfile(
    profileData: ProfileData,
    creatorAddress: string
  ): Promise<string> {
    try {
      // Get signed upload URL from our API
      const urlRequest = await fetch(
        `/api/v1/profiles/${creatorAddress}/upload`
      );
      if (!urlRequest.ok) {
        throw new Error("Failed to get upload URL");
      }
      const urlResponse = (await urlRequest.json()) as { url: string };

      // Create a JSON file from the profile data
      const jsonContent = JSON.stringify(profileData, null, 2);
      const file = new File(
        [jsonContent],
        `relynk-profile-${profileData.name}.json`,
        {
          type: "application/json",
        }
      );

      // Upload using Pinata SDK with signed URL (safe for client-side)
      const upload = await pinata.upload.public
        .file(file)
        .keyvalues({
          type: "profile",
          creator: creatorAddress.toLowerCase(),
          name: profileData.name,
          createdAt: Date.now().toString(),
          version: "1.0.0",
        })
        .url(urlResponse.url);

      const uploadResult = upload;

      if (!uploadResult.cid) {
        throw new Error("No IPFS hash returned from upload");
      }

      console.log("Profile data uploaded to IPFS:", {
        hash: uploadResult.cid,
        data: profileData,
      });
      return uploadResult.cid;
    } catch (error) {
      console.error("Failed to upload profile to IPFS:", error);
      throw error;
    }
  }

  /**
   * Retrieve profile data from IPFS
   * @param ipfsHash The IPFS hash to retrieve
   * @returns Promise<ProfileData | null> The profile data or null if not found
   */
  static async getProfile(ipfsHash: string): Promise<ProfileData | null> {
    try {
      const response = await fetch(`${this.PINATA_GATEWAY}/${ipfsHash}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Profile not found for IPFS hash: ${ipfsHash}`);
          return null;
        }
        throw new Error(`Failed to retrieve profile: ${response.statusText}`);
      }

      const profileData = await response.json();

      // Validate the structure
      if (!this.validateProfileData(profileData)) {
        throw new Error("Invalid profile data structure");
      }

      return profileData as ProfileData;
    } catch (error) {
      console.error("Failed to retrieve profile from IPFS:", error);
      return null;
    }
  }

  /**
   * Pin content to ensure it stays available
   * @param ipfsHash The IPFS hash to pin
   */
  static async pinContent(ipfsHash: string): Promise<void> {
    try {
      // The content is already pinned when uploaded via Pinata
      // This method is kept for compatibility with the existing interface
      console.log(`Content already pinned: ${ipfsHash}`);
    } catch (error) {
      console.error("Failed to pin content:", error);
      throw error;
    }
  }

  /**
   * Validate profile data structure
   */
  private static validateProfileData(data: unknown): boolean {
    try {
      const profile = data as Record<string, unknown>;

      return Boolean(
        data &&
          typeof data === "object" &&
          typeof profile.name === "string" &&
          typeof profile.bio === "string" &&
          Array.isArray(profile.links) &&
          profile.links.every((link: unknown) => {
            const linkObj = link as Record<string, unknown>;
            return (
              typeof linkObj.id === "string" &&
              typeof linkObj.title === "string" &&
              typeof linkObj.url === "string"
            );
          })
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Get profile by creator address (searches through Pinata keyvalues)
   * @param creatorAddress The creator's address
   * @returns Promise<ProfileData | null> The profile data or null if not found
   */
  static async getProfileByCreator(
    creatorAddress: string
  ): Promise<{ profileData: ProfileData; ipfsHash: string } | null> {
    try {
      // Use our API to get the profile files for this creator
      const response = await fetch(`/api/v1/profiles/${creatorAddress}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get profile files: ${response.statusText}`);
      }

      const files = (await response.json()) as { data: Array<{ cid: string }> };

      if (!files.data || files.data.length === 0) {
        return null;
      }

      // Get the most recent profile (first in the list)
      const latestFile = files.data[0];
      const profileData = await this.getProfile(latestFile.cid);

      if (!profileData) {
        return null;
      }

      return {
        profileData,
        ipfsHash: latestFile.cid,
      };
    } catch (error) {
      console.error("Failed to get profile by creator:", error);
      return null;
    }
  }

  /**
   * Delete a profile from IPFS (unpin from Pinata)
   * @param ipfsHash The IPFS hash to delete
   * @param creatorAddress The creator's address
   * @returns Promise<boolean> Success status
   */
  static async deleteProfile(
    ipfsHash: string,
    creatorAddress: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/v1/profiles/${creatorAddress}/delete/${ipfsHash}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete profile: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error("Failed to delete profile:", error);
      return false;
    }
  }
}
