import crypto from "crypto";


export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is not set.");
  }
  return secret;
}

function base64url(str: string | Buffer, encoding: BufferEncoding = "utf8"): string {
  const buf = typeof str === "string" ? Buffer.from(str, encoding) : str;
  return buf.toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export interface UserSessionPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Sign user details into a standard JWT token.
 * Default expiration is 24 hours from creation.
 */
export function signJwt(payload: UserSessionPayload, secret: string, expiresInSeconds: number = 86400): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const encodedPayload = base64url(JSON.stringify({ ...payload, exp }));
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", secret).update(signatureInput).digest();
  const encodedSignature = base64url(signature);
  
  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Verifies the signature and expiration of a JWT token.
 * Returns parsed UserSessionPayload if valid, or null.
 */
export function verifyJwt(token: string, secret: string): UserSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [header, payload, signature] = parts;
    const signatureInput = `${header}.${payload}`;
    const expectedSignature = base64url(crypto.createHmac("sha256", secret).update(signatureInput).digest());
    
    // Timing safe comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature, "utf8");
    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    if (sigBuf.length !== expectedBuf.length) {
      return null;
    }
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    
    const decodedPayload = JSON.parse(base64urlDecode(payload));
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    
    return {
      userId: decodedPayload.userId,
      email: decodedPayload.email,
      role: decodedPayload.role,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies JWT from Request Authorization header.
 */
export function getAuthenticatedUser(request: Request): UserSessionPayload | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  const secret = getJwtSecret();
  return verifyJwt(token, secret);
}
