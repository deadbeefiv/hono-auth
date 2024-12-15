import type { Context } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import * as authService from "../services/authService.ts";
import * as authSchema from "../schemas/authSchema.ts";
import authMiddleware from "../middlewares/authMiddleware.ts";
// import roleMiddleware from "@/middlewares/roleMiddleware";

const authRoute = new OpenAPIHono();
const API_TAGS = ["Auth"];

// Register Component
authRoute.openAPIRegistry.registerComponent(
  "securitySchemes",
  "AuthorizationBearer",
  {
    type: "http",
    scheme: "bearer",
    in: "header",
    description: "Bearer token",
  }
);

// Register Route
authRoute.openapi(
  {
    method: "post",
    path: "/register",
    summary: "Register a new user",
    description:
      "Register a new user with name, email, password, and confirm password.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: authSchema.registerSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "User successfully registered",
      },
      400: {
        description: "Invalid input or registration failed",
      },
    },
    tags: API_TAGS,
  },
  async (c: Context) => {
    const body = await c.req.json();

    try {
      const user = await authService.register(body);

      return c.json({ data: user }, 201);
    } catch (error: Error | any) {
      return c.json({ error: error.message || "Registration failed!" }, 400);
    }
  }
);

// Login Route
authRoute.openapi(
  {
    method: "post",
    path: "/login",
    summary: "Log in a user",
    description: "Log in a user with email and password.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: authSchema.loginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Login successful",
      },
      401: {
        description: "Invalid email or password",
      },
    },
    tags: API_TAGS,
  },
  async (c: Context) => {
    const body = await c.req.json();

    try {
      const token = await authService.login(body);

      return c.json({ token }, 200);
    } catch (error: Error | any) {
      return c.json({ error: error.message || "Login failed!" }, 401);
    }
  }
);

// Auth Me
authRoute.openapi(
  {
    method: "get",
    path: "/me",
    summary: "Get user information",
    description: "Get user information including user ID, username, and role.",
    security: [{ AuthorizationBearer: [] }],
    middleware: [authMiddleware],
    responses: {
      200: {
        description: "User information successfully retrieved",
      },
      401: {
        description: "Refresh token is missing or invalid",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    try {
      const userId = c.get("userId") as string;
      const user = await authService.profile(userId);

      return c.json({ user }, 200);
    } catch (error: Error | any) {
      return c.json({ error: error.message || "Failed to get user!" }, 401);
    }
  }
);

// Get Instructors
authRoute.openapi(
  {
    method: "get",
    path: "/instructors",
    summary: "Get all Instructors signed into the platform",
    description: "Get all user information including user ID, username, and role.",
    security: [{ AuthorizationBearer: [] }],
    middleware: [authMiddleware],
    responses: {
      200: {
        description: "User information successfully retrieved",
      },
      401: {
        description: "Refresh token is missing or invalid",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    try {
      const users = await authService.instructors();

      return c.json({ instructors: users }, 200);
    } catch (error: Error | any) {
      return c.json({ error: error.message || "Failed to get user!" }, 401);
    }
  }
);

// Get Tokens
authRoute.openapi(
  {
    method: "get",
    path: "/tokens",
    summary: "Get all tokens in the platform",
    description: "Get all user information including user ID and refreshtokens.",
    security: [{ AuthorizationBearer: [] }],
    middleware: [authMiddleware],
    responses: {
      200: {
        description: "User information successfully retrieved",
      },
      401: {
        description: "Refresh token is missing or invalid",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    try {
      const users = await authService.tokens();

      return c.json({ tokens: users }, 200);
    } catch (error: Error | any) {
      return c.json({ error: error.message || "Failed to get user!" }, 401);
    }
  }
);

// Refresh Token Route
authRoute.openapi(
  {
    method: "post",
    path: "/refresh-token",
    summary: "Refresh access token",
    description: "Refresh the access token using the refresh token.",
    security: [{ AuthorizationBearer: [] }],
    middleware: [authMiddleware],
    responses: {
      200: {
        description: "Token successfully refreshed",
      },
      401: {
        description: "Refresh token is missing or invalid",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const { refreshToken } = await c.req.json();

    if (!refreshToken) {
      return c.json({ error: "Refresh token is required!" }, 401);
    }

    try {
      const token = await authService.regenToken(refreshToken, c.get("userId"));

      return c.json({ token }, 200);
    } catch (error: Error | any) {
      return c.json(
        { error: error.message || "Failed to refresh token!" },
        401
      );
    }
  }
);

// Logout Route
authRoute.openapi(
  {
    method: "post",
    path: "/logout",
    summary: "Log out a user",
    description: "Log out a user by invalidating the refresh token.",
    security: [{ AuthorizationBearer: [] }],
    middleware: [authMiddleware],
    responses: {
      200: {
        description: "Logout successful",
      },
      401: {
        description: "Refresh token is missing or invalid",
      },
      500: {
        description: "Failed to log out",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const {refreshToken} = await c.req.json();

    if (!refreshToken) {
      throw new Error("Refresh token is required!");
    }

    try {
      const userId = c.get("userId");
      await authService.logout(refreshToken, userId);

      return c.json({ message: "Logout successful!" }, 200);
    } catch (error: Error | any) {
      return c.json({ error: error.message || "Failed to logout!" }, 500);
    }
  }
);

export default authRoute;
