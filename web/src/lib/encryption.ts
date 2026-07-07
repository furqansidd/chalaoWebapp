import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not defined");
  }
  // Convert key to Buffer. Must be exactly 32 bytes for aes-256.
  const keyBuffer = Buffer.from(key, "utf8");
  if (keyBuffer.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be exactly 32 bytes, got ${keyBuffer.length} bytes`);
  }
  return keyBuffer;
}

/**
 * Encrypts a string value using AES-256-GCM.
 * Output format is `ivHex:authTagHex:encryptedTextHex`.
 */
export function encrypt(text: string): string {
  if (!text) return text;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string value encrypted by the `encrypt` helper.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected iv:authTag:encryptedText");
  }

  const key = getKey();
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
