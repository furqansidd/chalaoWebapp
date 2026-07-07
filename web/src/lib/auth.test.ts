import { expect, test, describe } from "vitest";
import { signJwt, verifyJwt, getAuthenticatedUser } from "./auth";

describe("JWT Signature and Verification Utilities", () => {
  const secret = "super-secret-jwt-key-32-characters";
  const payload = {
    userId: "user-123",
    email: "user@example.com",
    role: "USER",
  };

  test("generates and verifies a valid JWT", () => {
    const token = signJwt(payload, secret);
    expect(token).toBeDefined();
    expect(token.split(".")).toHaveLength(3);

    const verified = verifyJwt(token, secret);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe(payload.role);
  });

  test("fails verification if token signature is modified", () => {
    const token = signJwt(payload, secret);
    const tamperedToken = token.slice(0, -5) + "abcde";
    const verified = verifyJwt(tamperedToken, secret);
    expect(verified).toBeNull();
  });

  test("fails verification if token signature is verified against a different secret", () => {
    const token = signJwt(payload, secret);
    const verified = verifyJwt(token, "wrong-secret-key-32-characters-long");
    expect(verified).toBeNull();
  });

  test("fails verification if token is expired", async () => {
    // Generate token with negative lifespan (already expired)
    const token = signJwt(payload, secret, -10);
    const verified = verifyJwt(token, secret);
    expect(verified).toBeNull();
  });

  test("extracts authenticated user from Request Authorization header", () => {
    process.env.JWT_SECRET = secret;
    const token = signJwt(payload, secret);
    
    const request = new Request("http://localhost", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = getAuthenticatedUser(request);
    expect(user).not.toBeNull();
    expect(user?.userId).toBe(payload.userId);
  });

  test("returns null if Authorization header is missing or malformed", () => {
    const requestNoAuth = new Request("http://localhost");
    expect(getAuthenticatedUser(requestNoAuth)).toBeNull();

    const requestMalformed = new Request("http://localhost", {
      headers: {
        Authorization: "Bearer invalidtokenhere",
      },
    });
    expect(getAuthenticatedUser(requestMalformed)).toBeNull();
  });
});
