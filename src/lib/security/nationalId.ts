import crypto from "crypto";

function requireKey() {
  const key = process.env.NATIONAL_ID_ENCRYPTION_KEY;
  if (!key) throw new Error("Missing NATIONAL_ID_ENCRYPTION_KEY");
  // Accept base64 (32 bytes) or raw string; normalize to 32 bytes.
  const buf = /^[A-Za-z0-9+/=]+$/.test(key) ? Buffer.from(key, "base64") : Buffer.from(key, "utf8");
  if (buf.length < 32) {
    // Derive to 32 bytes
    return crypto.createHash("sha256").update(buf).digest();
  }
  return buf.subarray(0, 32);
}

export function encryptNationalId(nationalId: string) {
  const key = requireKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(nationalId, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptNationalId(enc: string) {
  const raw = Buffer.from(enc, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const key = requireKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

export function last4(nationalId: string) {
  const digits = nationalId.replace(/[^\d]/g, "");
  return digits.slice(-4);
}

