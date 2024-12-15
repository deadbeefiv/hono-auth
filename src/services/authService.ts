import { z } from "@hono/zod-openapi";
import { registerSchema, loginSchema, Role } from "../schemas/authSchema.ts";
import { passwordHash, passwordVerify } from "../libs/password.ts";
import db from "../libs/db.ts";
import * as jwt from "../libs/jwt.ts";

/**
 * Registers a new user.
 *
 * @param data The user data to register.
 * @returns The registered user.
 * @throws {Error} If the email is already in use.
 */
export const register = async (data: z.infer<typeof registerSchema>) => {

    const { name, username, email, password } = registerSchema.parse(data);
    const hashedPassword = await passwordHash(password);
    const userData = {
      name: name,
      username: username,
      email: email,
      password: hashedPassword,
      id: '',
      role: Role.INSTRUCTOR
    }

    const user = await db.user.create(userData);
    return user;

//   return await db.$transaction(async (prisma) => {
//     const existingUser = await prisma.user.findFirst({
//       where: {
//         OR: [{ email: data.email }, { username: data.username }],
//       },
//     });

//     if (existingUser) {
//       throw new Error("Email or Username already registered!");
//     }

//     let role = await prisma.role.findUnique({
//       where: { name: "USER" },
//       select: { id: true },
//     });

//     if (!role) {
//       role = await prisma.role.create({
//         data: { name: "USER" },
//       });
//     }

//     const hashedPassword = await passwordHash(data.password);
//     const user = await prisma.user.create({
//       data: {
//         name: data.name,
//         username: data.username,
//         email: data.email,
//         password: hashedPassword,
//         roleId: role.id,
//       },
//     });

//     return { name: user.name, email: user.email };
//   });
};

/**
 * Logs in a user and returns JWT access and refresh tokens.
 *
 * @param data The login data (email/username and password).
 * @returns The generated access and refresh tokens.
 * @throws {Error} If the credentials are invalid.
 */
export const login = async (data: z.infer<typeof loginSchema>) => {
  const { username, password: inputPassword } = loginSchema.parse(data);
  const user = await db.user.user(username);

  if (!await passwordVerify(inputPassword, user.password)) {
    throw new Error("Invalid login credentials");
  }

  const [accessToken, refreshToken] = await Promise.all([
    jwt.createAccessToken(user.id),
    jwt.createRefreshToken(user.id),
  ]);

  return { accessToken, refreshToken };
};

/**
 * Retrieves the profile of a user by ID.
 *
 * @param userId The ID of the user to retrieve.
 * @returns The user profile.
 * @throws {Error} If the user does not exist.
 */
export const profile = async (userId: string) => {
  const user = await db.user.user(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

/**
 * Retrieves all the instructors registered on the platform
 *
 * @returns Array with all user profiles.
 * @throws {Error} If the user does not exist.
 */
export const instructors = async () => {
  const user = await db.user.getInstructors();
  return user;
};

/**
 * Retrieves all the refreshTokens stored in the database
 *
 * @returns Array with all user profiles.
 * @throws {Error} If the user does not exist.
 */
export const tokens = async () => {
  const user = await db.user.getTokens();
  return user;
};

/**
 * Processes a refresh token by either revoking it or regenerating a new token pair.
 *
 * @param refreshToken The refresh token to process.
 * @param userId The Id of the user being logged out.
 * @param action The action to take on the token. If "REVOKE", the token is revoked.
 * If "REGENERATE", a new token pair is generated and returned.
 * @returns If action is "REVOKE", returns a boolean indicating success. If action is
 * "REGENERATE", returns an object with the new access and refresh tokens.
 * @throws {Error} If the token is invalid or expired.
 */
const processToken = async (
  refreshToken: string,
  userId: string,
  action: "REVOKE" | "REGENERATE"
) => {
  
  const hashedToken = await db.user.getToken(userId);
  const validatedToken = passwordVerify(refreshToken, hashedToken.token);

  if (!validatedToken) {
    throw new Error('Failed to validate token.');
  }

  if (action === "REVOKE") {
    return await db.user.deleteToken(userId);
  }
  if (action === "REGENERATE") {
    const [newAccessToken, newRefreshToken] = await Promise.all([
      jwt.createAccessToken(userId),
      jwt.createRefreshToken(userId),
    ]);
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
  return true;
};

/**
 * Regenerates a new access and refresh token pair for the given refresh token.
 * @param refreshToken The refresh token to use for regenerating the tokens.
 * @param userId The Id of the user being logged out.
 * @returns The new access and refresh token pair as an object with `accessToken` and `refreshToken` properties.
 */
export const regenToken = async (refreshToken: string, userId: string): Promise<any> => {
  return await processToken(refreshToken, userId, "REGENERATE");
};

/**
 * Logs out a user by invalidating their refresh token.
 * @param refreshToken The refresh token to use for regenerating the tokens.
 * @param userId The user to revoke their token.
 * @returns A boolean indicating success.
 */
export const logout = async (refreshToken: string, userId: string) => {
  return await processToken(refreshToken, userId, "REVOKE");  
};
