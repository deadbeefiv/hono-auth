# Hono Auth

**Hono-Auth** is a simple authentication boilerplate built with Hono.js using Deno and TypeScript, designed to provide essential auth functionality. This project includes four key authentication endpoints and leverages Deno.Kv for database management, Zod for validation, and Swagger UI for API documentation.

## Features

- User Authentication: Includes user registration, login, logout, and token refresh.
- Zod Validation: Schema validation for secure data handling.
- Swagger UI: Auto-generated API docs for easy testing and integration.
- Dynamic Role Access Control: Enhanced role management allowing for flexible access control based on user roles and hierarchy.
- Role Hierarchy Filtering: Implemented filtering logic to ensure only appropriate roles are included in access checks, improving security and clarity.

## Tech Stack (Framework & Libraries)

- Hono.js (Deno & TypeScript)
- Deno.Kv (In-memory, MySQL, or Docker Image)
- Swagger UI (Scalar)
- Zod (Data Validation)

## Roadmap
- [x] Run with Deno using Deno.Kv
- [] Separate middleware
- [] Role-based Access Control
- [] Add Oauth

## Endpoints

| Endpoint            | Method | Description          |
| ------------------- | ------ | -------------------- |
| /auth/register      | POST   | Register a new user  |
| /auth/login         | POST   | Log in a user        |
| /auth/refresh-token | POST   | Refresh access token |
| /auth/logout        | POST   | Log out a user       |
| /auth/me            | GET    | Get user information |

## Setup and Usage

<details>
  <summary>Click to expand</summary>
  
1. Clone the repository:

```bash
  git clone https://github.com/deadbeefiv/hono-auth.git
  cd hono-auth
  bun install
```
2. Install dependencies
  With Deno
  ```bash title="Deno"
      deno install
  ```
3. Create a `.env` file in the root directory:

   ```bash
     cp .env.example .env
     nano .env # Edit the variables as needed (see below)

     #... (.env)
     DATABASE_URL=postgresql://user:password@localhost:5432/database?schema=public
     JWT_SECRET=your-secret-token
     SALT_ROUNDS=10 # Number of rounds for password hashing
   ```

4. Start the server:

   ```bash
     deno task start

     # Open http://localhost:3000/ui in your browser
   ```

   </details>

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the GitHub repository.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for more information. This project is also a fork of [hono-auth](https://github.com/zckyachmd/hono-auth.git) who built it to run with Bun and Prisam
