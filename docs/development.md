# Developer Guide

Welcome to the NestJS ERP development team. Follow this guide to set up your environment and understand the development workflow.

## 1. Prerequisites

- **Node.js**: v20 or higher.
- **Package Manager**: `pnpm` (REQUIRED). Do not use `npm` or `yarn`.
- **Database**: PostgreSQL 18+.

## 2. Local Setup

1. **Clone the repository**.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment variables**:
   Copy `.env.example` (or create one) with:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=postgres
   JWT_SECRET=your_secret_key
   ```

## 3. Common Scripts

| Command          | Description                                             |
| :--------------- | :------------------------------------------------------ |
| `npm run start:dev` | Start the NestJS dev server with HMR.                   |
| `npm run build`     | Compile the project to `dist/`.                         |
| `npm run lint`      | Run ESLint with auto-fix. **Must pass before PR.**      |
| `npm run format`    | Run Prettier to format code.                            |
| `npm run db:setup`  | Initialize DB schema, RLS policies, and Audit triggers. |

## 4. Coding Standards

- **No `any`**: TypeScript types must be strictly defined. Any use of `any` will fail CI linting.
- **Double-Entry**: All finance logic must ensure balancing.
- **RLS Awareness**: Always ensure `tenant_id` is handled correctly in entities (extending `BaseEntity`).

## 5. API Documentation

We use Swagger for API discovery.

- **URL**: `http://localhost:3000/api`
- **Authenticating**: Use the `/auth/login` endpoint to get a JWT, then use the "Authorize" button in Swagger.
