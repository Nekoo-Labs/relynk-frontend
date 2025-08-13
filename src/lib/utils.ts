import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a number string to a format compatible with viem's parseUnits
 * Converts scientific notation (e.g., "1e-10") to decimal format (e.g., "0.0000000001")
 * @param value - The number string to normalize
 * @returns A normalized decimal string suitable for parseUnits
 */
export function normalizeNumberForParseUnits(value: string): string {
  if (!value || value.trim() === '') {
    return '0';
  }

  try {
    // Parse the number to handle scientific notation
    const num = parseFloat(value);

    // Check if the number is valid
    if (isNaN(num) || !isFinite(num) || num < 0) {
      throw new Error(`Invalid number: ${value}`);
    }

    // Convert to fixed decimal notation with sufficient precision
    // Use 18 decimal places to handle most token decimals
    const normalized = num.toFixed(18);

    // Remove trailing zeros after decimal point
    const trimmed = normalized.replace(/\.?0+$/, '');

    // If the result is empty or just a decimal point, return '0'
    return trimmed === '' || trimmed === '.' ? '0' : trimmed;
  } catch (error) {
    console.error('Error normalizing number for parseUnits:', error);
    throw new Error(`Invalid number format: ${value}`);
  }
}
