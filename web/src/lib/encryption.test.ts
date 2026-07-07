import { expect, test, describe } from "vitest";
import { encrypt, decrypt } from "./encryption";

describe("PII Encryption Helper", () => {
  test("encrypts and decrypts values correctly using AES-256-GCM", () => {
    const key = "42424242424242424242424242424242"; // 32 characters / 256 bits
    process.env.ENCRYPTION_KEY = key;

    const originalText = "42101-1234567-1";
    
    const encrypted = encrypt(originalText);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(originalText);
    expect(encrypted).toContain(":"); // Should contain iv:authTag:encryptedText

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  test("throws an error if ENCRYPTION_KEY is missing or invalid length", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("secret")).toThrow();

    process.env.ENCRYPTION_KEY = "short-key";
    expect(() => encrypt("secret")).toThrow();
  });
});
