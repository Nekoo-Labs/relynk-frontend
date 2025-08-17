"use client";

import { useState, useEffect, useCallback } from "react";
import { UnifiedIPFSService } from "@/lib/unified-ipfs-service";
import { useDebounce } from "./use-debounce";


export interface SlugValidationResult {
  isValid: boolean;
  isAvailable: boolean | null; // null when checking
  isChecking: boolean;
  error?: string;
}

const RESERVED_SLUGS = [
  "api", "admin", "dashboard", "pay", "create", "profile", 
  "auth", "login", "signup", "settings", "help", "support",
  "about", "contact", "terms", "privacy", "docs", "blog"
];

export function useSlugValidation(slug: string, debounceMs: number = 500) {
  const [result, setResult] = useState<SlugValidationResult>({
    isValid: true,
    isAvailable: null,
    isChecking: false,
  });

  const debouncedSlug = useDebounce(slug, debounceMs);

  const validateSlugFormat = useCallback((value: string): { isValid: boolean; error?: string } => {
    if (!value || value.trim() === "") {
      return { isValid: true };
    }

    // Check length
    if (value.length < 3) {
      return { isValid: false, error: "Slug must be at least 3 characters" };
    }
    if (value.length > 50) {
      return { isValid: false, error: "Slug must be less than 50 characters" };
    }

    // Check format - allow letters, numbers, hyphens, and underscores
    if (!/^[a-z0-9\-_]+$/.test(value)) {
      return { isValid: false, error: "Only lowercase letters, numbers, hyphens, and underscores allowed" };
    }

    // Check for consecutive hyphens or underscores
    if (value.includes("--") || value.includes("__")) {
      return { isValid: false, error: "Consecutive hyphens or underscores are not allowed" };
    }

    // Check start/end hyphens or underscores
    if (value.startsWith("-") || value.endsWith("-") || value.startsWith("_") || value.endsWith("_")) {
      return { isValid: false, error: "Slug cannot start or end with a hyphen or underscore" };
    }

    // Check reserved words
    if (RESERVED_SLUGS.includes(value.toLowerCase())) {
      return { isValid: false, error: "This slug is reserved and cannot be used" };
    }

    return { isValid: true };
  }, []);

  const checkSlugAvailability = useCallback(async (value: string): Promise<boolean> => {
    try {
      const existingLink = await UnifiedIPFSService.getPaymentLink(value);
      return !existingLink; // Available if no existing link found
    } catch (error) {
      console.error("Error checking slug availability:", error);
      return false; // Assume unavailable on error
    }
  }, []);

  useEffect(() => {
    const validateSlug = async () => {
      const trimmedSlug = debouncedSlug?.trim();
      
      // Reset state
      setResult(prev => ({ ...prev, isChecking: false, error: undefined }));

      // If empty, it's valid (will use auto-generated ID)
      if (!trimmedSlug) {
        setResult({
          isValid: true,
          isAvailable: null,
          isChecking: false,
        });
        return;
      }

      // First check format
      const formatValidation = validateSlugFormat(trimmedSlug);
      if (!formatValidation.isValid) {
        setResult({
          isValid: false,
          isAvailable: null,
          isChecking: false,
          error: formatValidation.error,
        });
        return;
      }

      // If format is valid, check availability
      setResult(prev => ({ ...prev, isChecking: true }));
      
      try {
        const isAvailable = await checkSlugAvailability(trimmedSlug);
        setResult({
          isValid: true,
          isAvailable,
          isChecking: false,
          error: isAvailable ? undefined : "This slug is already taken",
        });
      } catch (error) {
        setResult({
          isValid: true,
          isAvailable: false,
          isChecking: false,
          error: "Error checking availability",
        });
      }
    };

    validateSlug();
  }, [debouncedSlug, validateSlugFormat, checkSlugAvailability]);

  return result;
}