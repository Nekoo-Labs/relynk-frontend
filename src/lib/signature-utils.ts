import { LinkData } from "@/types/relynk";
import { keccak256, encodeAbiParameters, hashMessage } from "viem";

/**
 * Creates a hash of the link data that matches the smart contract's encoding
 */
export function createLinkDataHash(linkData: LinkData): `0x${string}` {
  return keccak256(
    encodeAbiParameters(
      [
        { name: "linkId", type: "string" },
        { name: "creator", type: "address" },
        { name: "linkType", type: "uint8" },
        { name: "amountType", type: "uint8" },
        { name: "usageType", type: "uint8" },
        { name: "amount", type: "uint256" },
        { name: "token", type: "address" },
        { name: "expires", type: "uint256" },
        { name: "metadata", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
      [
        linkData.linkId,
        linkData.creator,
        linkData.linkType,
        linkData.amountType,
        linkData.usageType,
        linkData.amount,
        linkData.token,
        linkData.expires,
        linkData.metadata,
        linkData.nonce,
      ]
    )
  );
}

/**
 * Creates an Ethereum signed message hash that matches what the smart contract expects
 * This adds the "\x19Ethereum Signed Message:\n32" prefix
 */
export function createEthereumSignedMessageHash(
  linkDataHash: `0x${string}`
): `0x${string}` {
  return hashMessage({ raw: linkDataHash });
}

/**
 * Creates the complete message hash that should be signed for link validation
 */
export function createSignableMessageHash(linkData: LinkData): `0x${string}` {
  const linkDataHash = createLinkDataHash(linkData);
  return createEthereumSignedMessageHash(linkDataHash);
}
