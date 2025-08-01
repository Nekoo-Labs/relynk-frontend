"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { SiweMessage } from "siwe";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

export function useSiweAuth() {
  const { data: session, status } = useSession();
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [autoSignInAttempted, setAutoSignInAttempted] = useState(false);
  const signInRef = useRef<(() => Promise<void>) | null>(null);

  const isAuthenticated = !!session?.address && session.address.toLowerCase() === address?.toLowerCase();
  const isConnecting = status === "loading";

  // Debug logging
  useEffect(() => {
    console.log("SIWE Auth State:", {
      session,
      status,
      address,
      isConnected,
      isAuthenticated,
      sessionAddress: session?.address,
      autoSignInAttempted
    });
  }, [session, status, address, isConnected, isAuthenticated, autoSignInAttempted]);

  const signInWithEthereum = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!address || !isConnected) {
        throw new Error("Wallet not connected");
      }

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: "Sign in with Ethereum to Paylynk",
        uri: window.location.origin,
        version: "1",
        chainId: chainId || 1,
        nonce: generateNonce(),
      });

      const messageString = message.prepareMessage();

      // Sign the message
      const signature = await signMessageAsync({
        message: messageString,
      });

      // Sign in with NextAuth
      const result = await signIn("credentials", {
        message: JSON.stringify(message),
        signature,
        redirect: false,
      });

      console.log("Sign in result:", result);

      if (result?.ok) {
        // Don't automatically redirect to dashboard, let the calling component handle it
        console.log("SIWE authentication successful");
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("SIWE sign in failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, chainId, signMessageAsync]);

  // Store the function in ref to avoid dependency issues
  signInRef.current = signInWithEthereum;

  // Auto-trigger SIWE authentication when wallet is connected but not authenticated
  useEffect(() => {
    const shouldAutoSignIn =
      isConnected &&
      address &&
      !isAuthenticated &&
      !isLoading &&
      !autoSignInAttempted &&
      status !== "loading";

    if (shouldAutoSignIn && signInRef.current) {
      console.log("Auto-triggering SIWE authentication...");
      setAutoSignInAttempted(true);
      signInRef.current().catch((error) => {
        console.error("Auto SIWE sign-in failed:", error);
        // Reset the flag so user can try again manually
        setAutoSignInAttempted(false);
      });
    }
  }, [isConnected, address, isAuthenticated, isLoading, autoSignInAttempted, status]);

  // Reset auto sign-in flag when wallet disconnects or address changes
  useEffect(() => {
    if (!isConnected || !address) {
      setAutoSignInAttempted(false);
    }
  }, [isConnected, address]);

  // Handle session/address mismatch
  useEffect(() => {
    if (session?.address && address && session.address.toLowerCase() !== address.toLowerCase()) {
      console.log("Session address mismatch, signing out...", {
        sessionAddress: session.address,
        walletAddress: address
      });
      // Sign out the old session
      signOut({ redirect: false });
      setAutoSignInAttempted(false);
    }
  }, [session?.address, address]);

  const logout = async () => {
    // Sign out from NextAuth session
    await signOut({ redirect: false });

    // Disconnect the wallet
    disconnect();

    // Reset auto sign-in flag
    setAutoSignInAttempted(false);

    // Redirect to home page
    router.push("/");
  };

  return {
    session,
    isAuthenticated,
    isConnecting: isConnecting || isLoading,
    isLoading,
    signInWithEthereum,
    logout,
    address: session?.address || address,
  };
}

export function useRequireSiweAuth() {
  const { isAuthenticated, isConnecting } = useSiweAuth();
  
  // Don't redirect here - let the auth guard handle the authentication flow
  // The auth guard will show the sign-in UI instead of redirecting
  
  return { isAuthenticated, isConnecting };
}

// Helper function to generate a random nonce
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}