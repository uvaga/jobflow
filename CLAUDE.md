# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JobFlow is a monorepo job search application with a NestJS backend and React frontend, using MongoDB for persistence. The project follows modern TypeScript best practices with strict typing throughout.

## Development Commands

### Initial Setup
```bash
# From root directory
npm install
cd jobflow-backend && npm install
cd ../jobflow-frontend && npm install
```

### Running the Application
```bash
# Start everything (Docker + both dev servers)
npm run dev

# Stop all services (backend, frontend, and Docker)
npm run stop

# Start only Docker services (MongoDB + Mongo Express)
npm run docker:up

# Backend only (requires MongoDB running)
npm run backend:dev

# Frontend only
npm run frontend:dev
```

### Docker Management
```bash
npm run stop               # Stop all services (backend + frontend + Docker)
npm run docker:down        # Stop Docker containers only
npm run docker:restart     # Restart all containers
npm run docker:logs        # View all logs
npm run docker:logs:db     # View MongoDB logs only
npm run docker:clean       # Remove containers and volumes (data loss!)
npm run db:status          # Check MongoDB container status
```

### Backend Development
```bash
cd jobflow-backend

npm run start:dev          # Watch mode with hot reload
npm run build              # Production build
npm run start:prod         # Run production build
npm run test               # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Run tests with coverage
npm run lint               # Run ESLint
npm run format             # Format with Prettier
```

### Frontend Development
```bash
cd jobflow-frontend

npm run dev                # Development server (port 3001)
npm run build              # Production build
npm run preview            # Preview production build
npm run lint               # Run ESLint
npm run format             # Format with Prettier
```

## Architecture

### Monorepo Structure
- `jobflow-backend/` - NestJS 11 application
- `jobflow-frontend/` - Vite + React 19 application
- `docker/` - MongoDB initialization scripts
- Root `package.json` orchestrates Docker and concurrent dev servers

### Backend Architecture (NestJS)

**Configuration Pattern**:
- Type-safe config via `src/config/configuration.ts`
- Access with `ConfigService.get('database.uri')`
- Environment variables in `.env` (use `.env.example` as template)

**Global Setup** (in `main.ts`):
- ValidationPipe with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- CORS enabled from frontend origin (configurable)
- Global prefix: `/api/v1` (configurable via `API_PREFIX` and `API_VERSION`)

**Module Pattern**:
- ConfigModule is global (available everywhere)
- MongooseModule uses async factory pattern with ConfigService
- Follow NestJS best practices: Controllers handle HTTP, Services handle business logic

**Database**:
- MongoDB 4.4 via Mongoose
- Connection URI from `MONGODB_URI` env var
- Default: `mongodb://jobflow_user:jobflow_dev_password@localhost:27017/jobflow?authSource=jobflow`

**Database Schemas** (implemented):
- **User** (`src/users/schemas/user.schema.ts`):
  - Email (unique, indexed), password (select: false), firstName, lastName
  - savedVacancies array (references to Vacancy)
  - Timestamps (createdAt, updatedAt)

- **Vacancy** (`src/vacancies/schemas/vacancy.schema.ts`):
  - hhId (unique, indexed) - ID from hh.ru API
  - Embedded objects: employer, salary, area, schedule, experience, employment
  - Caching: cacheExpiresAt with TTL index (7 days default)
  - Compound index on area.id + salary.from for filtering
  - Mirrors hh.ru API response structure

- **VacancyProgress** (`src/vacancy-progress/schemas/vacancy-progress.schema.ts`):
  - Tracks user's job application progress (NOT called "Application" to avoid confusion)
  - References: userId, vacancyId
  - Status enum: saved, applied, interview_scheduled, interview_completed, rejected, offer_received, offer_accepted, withdrawn
  - Fields: notes, appliedAt, interviewDate, tags, priority
  - Compound indexes: userId+status, userId+createdAt
  - **Important**: Use "VacancyProgress" terminology in code, not "Application"

### Frontend Architecture (React + Vite)

**State Management**:
- **Server state**: TanStack React Query (5-minute stale time, 1 retry)
- **Client state**: Zustand for auth and UI state
- Query client configured in `src/config/queryClient.ts`

**API Communication**:
- Axios instance in `src/config/api.ts`
- Base URL: `/api/v1` (proxied to backend in dev)
- **Request interceptor**: Adds `Bearer` token from localStorage
- **Response interceptor**: Handles 401 (logout & redirect) and 403 (forbidden)

**Path Alias**:
- `@/` resolves to `src/` directory
- Use `import { apiClient } from '@/config/api'` instead of relative paths

**Vite Proxy**:
- All `/api` requests proxy to `http://localhost:3000` in development
- Change origin enabled for CORS

**Directory Conventions**:
- `components/common/` - Reusable components (buttons, inputs, etc.)
- `components/features/` - Feature-specific components
- `components/layout/` - Layout components (header, sidebar, etc.)
- `components/VacancyProgress/` - VacancyProgress-specific components (NOT `Applications/`)
- `pages/` - Route-level page components (e.g., `VacancyProgress.tsx`)
- `hooks/` - Custom React hooks
- `services/` - API service functions (use apiClient from `@/config/api`)
- `store/` - Zustand store definitions
- `types/` - TypeScript type definitions
- `utils/` - Utility functions

**Component Naming Example**:
- ✅ `components/VacancyProgress/VacancyProgressCard.tsx`
- ✅ `pages/VacancyProgress.tsx`
- ✅ `services/vacancyProgressService.ts`
- ❌ `components/Applications/ApplicationCard.tsx`
- ❌ `pages/Applications.tsx`

## Key Conventions

### NestJS Best Practices
- Use dependency injection for all services
- Create DTOs with class-validator decorators
- Use Mongoose schemas with `@Schema()` decorator
- Use `@Schema({ timestamps: true })` for automatic createdAt/updatedAt
- Create indexes using `SchemaFactory` after schema definition
- Export both class and Mongoose schema type
- Export interfaces for DTOs and entities
- Handle errors with NestJS exception filters
- Use ConfigService for all environment variables

### React Best Practices
- Use React Query for server state (data fetching)
- Use Zustand for client state (auth, UI state)
- Create custom hooks for reusable logic
- Use MUI components consistently
- Handle loading and error states in UI
- Use Formik + Yup for form validation

### TypeScript
- Strict mode enabled on both frontend and backend
- Use interfaces for data structures
- Avoid `any` - use `unknown` if type is truly unknown
- Export types from `types/` directory on frontend

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://jobflow_user:jobflow_dev_password@localhost:27017/jobflow?authSource=jobflow
JWT_SECRET=your-secure-secret-key
JWT_EXPIRES_IN=1d
API_PREFIX=api
API_VERSION=v1
CORS_ORIGIN=http://localhost:3001
```

### Frontend (.env - if needed)
```
VITE_API_BASE_URL=/api/v1
```

## Database Access

**MongoDB Web UI**: http://localhost:8081
- Username: `admin`
- Password: `admin123`

**Database Users**:
- Root admin: `jobflow_admin` / `jobflow_dev_password` (all databases)
- Application user: `jobflow_user` / `jobflow_dev_password` (jobflow database only)

**MongoDB CLI**:
```bash
docker exec -it jobflow-mongodb mongosh -u jobflow_user -p jobflow_dev_password --authenticationDatabase jobflow
```

## Important Files

### Backend
- `src/main.ts` - Application bootstrap with global configuration
- `src/app.module.ts` - Root module with ConfigModule and MongooseModule
- `src/config/configuration.ts` - Type-safe environment configuration
- `.env` - Environment variables (not in git)
- `.env.example` - Environment variable template

### Frontend
- `src/main.tsx` - React entry point with QueryClientProvider
- `src/App.tsx` - Root component with MUI ThemeProvider
- `src/config/api.ts` - Axios instance with auth interceptors
- `src/config/queryClient.ts` - React Query configuration
- `vite.config.ts` - Vite configuration with proxy

### Infrastructure
- `docker-compose.yml` - Multi-container orchestration
- `docker/mongo-init/init.js` - MongoDB initialization (creates users and collections)

## Technology Stack

**Backend**: NestJS 11, TypeScript 5.7, Mongoose 9, class-validator, Swagger
**Frontend**: React 19, TypeScript 5.9, Vite 7, MUI 7, React Query 5, Zustand 5, Formik, Axios
**Database**: MongoDB 4.4 (Docker)
**Testing**: Jest (backend), Supertest (e2e)

## Database Collections

After starting the application, the following collections are created in MongoDB:
- `users` - User accounts and profiles
- `vacancies` - Cached vacancy data from hh.ru API (with TTL)
- `vacancyprogresses` - User's job application tracking

## Naming Conventions

**VacancyProgress vs Application**:
- The schema for tracking job applications is called `VacancyProgress` (not `Application`)
- This avoids confusion with "app" or "application" referring to the software itself
- **Backend:** Always use `VacancyProgress` in all code:
  - Schema: `VacancyProgress`
  - Module directory: `src/vacancy-progress/`
  - Service: `VacancyProgressService`
  - Controller: `VacancyProgressController`
  - DTOs: `CreateVacancyProgressDto`, `UpdateVacancyProgressDto`
  - Enum: `VacancyProgressStatus` (in `src/vacancy-progress/enums/`)
  - API endpoints: `/api/v1/vacancy-progress/*`
  - Collection: `vacancyprogresses`
- **Frontend code:** Always use `VacancyProgress` in all code elements:
  - Page component: `VacancyProgress.tsx` (NOT `Applications.tsx`)
  - Route path: `/vacancy-progress` (NOT `/applications`)
  - Component directory: `components/VacancyProgress/`
  - Service file: `services/vacancyProgressService.ts`
  - Type interfaces: `VacancyProgress`, `VacancyProgressStatus`
  - Hook names: `useVacancyProgress`, `useCreateVacancyProgress`
- **Frontend UI text:** You MAY use "Application" in display text only:
  - Page titles: "My Applications" ✅
  - Button labels: "Track Application" ✅
  - Navigation menu: "Applications" ✅
  - Breadcrumbs: "Home > Applications" ✅
  - But NOT in: file names, component names, route paths, variable names, function names ❌

## Notes

- MongoDB 4.4 is used for compatibility with older CPUs (no AVX instruction set requirement)
- The project uses conventional commits for git history
- Backend runs on port 3000, frontend on port 3001
- All API endpoints have `/api/v1` prefix
- React Query DevTools available in development mode
- Authentication uses JWT tokens stored in localStorage
- Database schemas follow NestJS + Mongoose best practices with proper indexing
