import crypto from 'crypto';

/**
 * Generates a cryptographically secure 32-byte hex nonce for replay attack prevention
 */
export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes SHA-256 hash of an origin URL or string
 */
export function hashUrl(url: string): Buffer {
  return crypto.createHash('sha256').update(url.trim()).digest();
}

/**
 * Format raw stroops (1 XLM = 10,000,000 stroops) to a readable human decimal string
 */
export function formatStroops(stroops: bigint | string | number, decimals: number = 7): string {
  const bi = typeof stroops === 'bigint' ? stroops : BigInt(stroops.toString());
  const factor = BigInt(10 ** decimals);
  const integerPart = bi / factor;
  const fractionalPart = bi % factor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fractionalStr.length > 0 ? `${integerPart}.${fractionalStr}` : integerPart.toString();
}

/**
 * Parse human token amount (e.g. "0.02") to Stroops integer
 */
export function parseStroops(amount: string, decimals: number = 7): bigint {
  const parts = amount.trim().split('.');
  const integerPart = BigInt(parts[0] || '0');
  let fractionalStr = (parts[1] || '').slice(0, decimals);
  fractionalStr = fractionalStr.padEnd(decimals, '0');
  const fractionalPart = BigInt(fractionalStr);
  return integerPart * BigInt(10 ** decimals) + fractionalPart;
}

/**
 * Validates that a string is a 64-char hex string (32 bytes)
 */
export function isValidNonce(nonce: string): boolean {
  return typeof nonce === 'string' && /^[0-9a-fA-F]{64}$/.test(nonce);
}
