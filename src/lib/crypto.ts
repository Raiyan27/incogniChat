/**
 * End-to-End Encryption utilities using Web Crypto API
 * AES-GCM encryption with keys derived from room ID + secret
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;

/**
 * Derives an encryption key from room ID and secret using PBKDF2
 */
async function deriveKey(roomId: string, secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Use room ID as salt
  const salt = encoder.encode(roomId);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a message using AES-GCM
 * Returns base64-encoded string: IV + encrypted data
 */
export async function encryptMessage(
  message: string,
  roomId: string,
  secret: string
): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const key = await deriveKey(roomId, secret);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      encoder.encode(message)
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt message");
  }
}

/**
 * Decrypts a message using AES-GCM
 * Expects base64-encoded string: IV + encrypted data
 */
export async function decryptMessage(
  encryptedMessage: string,
  roomId: string,
  secret: string
): Promise<string> {
  try {
    const decoder = new TextDecoder();
    const key = await deriveKey(roomId, secret);

    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedMessage)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      encryptedData
    );

    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("Decryption failed:", error);
    // Return indicator that decryption failed
    return "🔒 [Encrypted message - decryption failed]";
  }
}

/**
 * Generates a random encryption secret
 */
export function generateSecret(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Validates if a string is a valid encryption secret
 */
export function isValidSecret(secret: string): boolean {
  return secret.length >= 16 && /^[0-9a-f]+$/i.test(secret);
}

/**
 * Stores encryption secret in session storage
 */
export function storeSecret(roomId: string, secret: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(`e2ee_secret_${roomId}`, secret);
  }
}

/**
 * Retrieves encryption secret from session storage
 */
export function getStoredSecret(roomId: string): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(`e2ee_secret_${roomId}`);
  }
  return null;
}

/**
 * Removes encryption secret from session storage
 */
export function removeSecret(roomId: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(`e2ee_secret_${roomId}`);
  }
}
