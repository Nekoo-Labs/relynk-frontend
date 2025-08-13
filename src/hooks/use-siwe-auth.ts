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
  const authInProgressRef = useRef(false);

  const isAuthenticated =
    !!session?.address &&
    session.address.toLowerCase() === address?.toLowerCase();
  const isConnecting = status === "loading";

  // Debug logging
  // useEffect(() => {
  //   console.log("🔍 SIWE Auth State:", {
  //     session: !!session,
  //     status,
  //     address: address?.slice(0, 6) + "...",
  //     isConnected,
  //     isAuthenticated,
  //     sessionAddress: session?.address?.slice(0, 6) + "...",
  //     autoSignInAttempted,
  //     isLoading
  //   });
  // }, [session, status, address, isConnected, isAuthenticated, autoSignInAttempted, isLoading]);

  const signInWithEthereum = useCallback(async () => {
    try {
      // Prevent concurrent authentication attempts
      if (authInProgressRef.current) {
        console.log("🚫 Authentication already in progress, skipping...");
        return;
      }

      authInProgressRef.current = true;
      setIsLoading(true);

      if (!address || !isConnected) {
        throw new Error("Wallet not connected");
      }

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: "Sign in with Ethereum to Relynk",
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

      // Better error handling for user cancellation
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        const errorName = error.name?.toLowerCase() || "";

        // Check for user cancellation patterns
        if (
          errorMessage.includes("user rejected") ||
          errorMessage.includes("user denied") ||
          errorMessage.includes("cancelled") ||
          errorMessage.includes("rejected") ||
          errorMessage.includes("user cancelled") ||
          errorName.includes("userrejected") ||
          errorName.includes("cancelled")
        ) {
          // User cancelled - don't retry, just reset state silently
          console.log("User cancelled SIWE authentication");
          return; // Exit without throwing to prevent recursive popups
        }
      }

      throw error;
    } finally {
      setIsLoading(false);
      authInProgressRef.current = false;
    }
  }, [address, isConnected, chainId, signMessageAsync]);

  // Store the function in ref to avoid dependency issues
  signInRef.current = signInWithEthereum;

  // Auto-trigger SIWE authentication when wallet is connected but not authenticated
  // DISABLED to prevent double signing - users can manually sign in
  useEffect(() => {
    // Disable auto sign-in to fix double signing issue
    const autoSignInEnabled = false;

    if (!autoSignInEnabled) return;

    // Add more specific conditions to prevent recursive calls
    const shouldAutoSignIn =
      isConnected &&
      address &&
      !isAuthenticated &&
      !isLoading &&
      !autoSignInAttempted &&
      !authInProgressRef.current && // Check if auth is already in progress
      status === "unauthenticated" && // Only when explicitly unauthenticated
      !session; // And no existing session

    if (shouldAutoSignIn && signInRef.current) {
      console.log("🚀 Auto-triggering SIWE authentication...", {
        isConnected,
        address: address?.slice(0, 6) + "...",
        isAuthenticated,
        status,
        session: !!session,
        authInProgress: authInProgressRef.current,
      });
      setAutoSignInAttempted(true);

      // Add a longer delay to prevent rapid-fire attempts
      setTimeout(() => {
        if (!authInProgressRef.current) {
          // Double-check before proceeding
          signInRef.current?.().catch((error) => {
            console.error("Auto SIWE sign-in failed:", error);
            // Reset the flag so user can try again manually
            setAutoSignInAttempted(false);
            authInProgressRef.current = false;
          });
        }
      }, 500); // Increased delay
    }
  }, [
    isConnected,
    address,
    isAuthenticated,
    isLoading,
    autoSignInAttempted,
    status,
    session, // Add session to dependencies
  ]);

  // Reset auto sign-in flag when wallet disconnects or address changes
  useEffect(() => {
    if (!isConnected || !address) {
      setAutoSignInAttempted(false);
      authInProgressRef.current = false; // Reset auth progress when disconnected
    }
  }, [isConnected, address]);

  // Reset auto sign-in flag when session becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setAutoSignInAttempted(false);
      authInProgressRef.current = false; // Reset auth progress when authenticated
    }
  }, [isAuthenticated]);

  // Handle session/address mismatch
  useEffect(() => {
    if (
      session?.address &&
      address &&
      isConnected && // Only handle mismatch when wallet is connected
      session.address.toLowerCase() !== address.toLowerCase() &&
      !isLoading // Don't interfere during authentication
    ) {
      console.log("Session address mismatch, signing out...", {
        sessionAddress: session.address,
        walletAddress: address,
      });
      // Sign out the old session
      signOut({ redirect: false });
      setAutoSignInAttempted(false);
    }
  }, [session?.address, address, isConnected, isLoading]);

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
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
