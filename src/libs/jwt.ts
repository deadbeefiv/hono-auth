import { passwordHash } from "../libs/password.ts";
import db from "./db.ts";
import { createJWT, validateJWT } from "oslo/jwt";
import { TimeSpan } from "oslo";

/**
 * Gets the secret token as an encoded ArrayBuffer.
 * @throws {Error} If the secret token is not defined.
 */
const getEncodedSecret = async (): Promise<ArrayBuffer> => {
  
  // const secret = process.env.JWT_SECRET;
  // Replace this with environment variable
  const secret = "58dff420ccb4171ecfd2e82ac8fef36d2a4cc6a4a64e40b29189e0d825f4814e";
  if (!secret) throw new Error("Secret token is not defined");

  return new TextEncoder().encode(secret).buffer as ArrayBuffer;
};

/**
 * Creates a JWT token with the specified parameters.
 * @param userId The user ID to include in the token.
 * @param expiresIn The expiration time as a TimeSpan object.
 * @returns The created JWT token.
 * @throws {Error} If token creation fails.
 */
const createToken = async (
  userId: string,
  expiresIn: TimeSpan
): Promise<string> => {
  const secret = await getEncodedSecret();
  const options = {
    subject: userId,
    expiresIn,
    includeIssuedTimestamp: true,
  };

  return await createJWT("HS256", secret, {}, options);
};

/**
 * Creates an access JWT token with a short expiration time.
 * @param userId The user ID to include in the token.
 * @param expiresInMinutes The number of minutes until the token expires.
 * @returns The created JWT token.
 * @throws {Error} If token creation fails.
 */
export const createAccessToken = async (
  userId: string,
  expiresInMinutes = 15
): Promise<string> => {
  try {
    return await createToken(userId, new TimeSpan(expiresInMinutes, "m"));
  } catch (error) {
    throw new Error("Failed to create access token.", { cause: error });
  }
};

/**
 * Validates a given JWT token against the secret token.
 * @param token The token to validate.
 * @returns The result of the validation.
 * @throws {Error} If token validation fails.
 */
export const validateToken = async (token: string): Promise<any> => {
  try {
    const secret = await getEncodedSecret();
    return await validateJWT("HS256", secret, token);
  } catch (error) {
    throw new Error("Failed to validate token.", { cause: error });
  }
};

/**
 * Creates a refresh JWT token with a longer expiration time and saves it to the database.
 * @param userId The user ID to create a refresh token for.
 * @param expiresInDays The number of days until the refresh token expires.
 * @returns The created refresh token.
 * @throws {Error} If token creation fails.
 */
export const createRefreshToken = async (
  userId: string,
  expiresInDays: number = 30
): Promise<string> => {
  try {
    const refreshToken = await createToken(
      userId,
      new TimeSpan(expiresInDays, "d")
    );
    const hashedToken = await passwordHash(refreshToken);

    await db.user.createToken(
      hashedToken, 
      userId,
      new Date(),
      new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    );

    return refreshToken;
  } catch (error) {
    throw new Error("Failed to create refresh token.", { cause: error });
  }
};
