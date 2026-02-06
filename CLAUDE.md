# JobFlow - Project Guide

This file provides guidance to Claude Code (claude.ai/code) when working with this monorepo.

## 📁 Project Structure

```
jobflow/
├── CLAUDE.md                    # This file - project orchestrator
├── jobflow-backend/             # NestJS 11 backend
│   └── CLAUDE.md               # Backend-specific conventions
├── jobflow-frontend/            # React 19 + Vite frontend
│   └── CLAUDE.md               # Frontend-specific conventions
├── docker/                      # MongoDB initialization
└── package.json                 # Root orchestration scripts
```

## 🎯 Quick Navigation

- **Backend Development**: See [`jobflow-backend/CLAUDE.md`](./jobflow-backend/CLAUDE.md)
- **Frontend Development**: See [`jobflow-frontend/CLAUDE.md`](./jobflow-frontend/CLAUDE.md)

## 🚀 Quick Start

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

## 🏗️ Architecture Overview

### Monorepo Structure
- `jobflow-backend/` - NestJS 11 application (port 3000)
- `jobflow-frontend/` - Vite + React 19 application (port 3001)
- `docker/` - MongoDB initialization scripts
- Root `package.json` orchestrates Docker and concurrent dev servers

### Technology Stack

**Backend**: NestJS 11, TypeScript 5.7, Mongoose 9, class-validator, Passport JWT
**Frontend**: React 19, TypeScript 5.9, Vite 7, MUI 7, React Query 5, Zustand 5, Formik, Yup
**Database**: MongoDB 4.4 (Docker)
**Testing**: Jest (backend), Supertest (e2e tests - 138 passing)

## 🗄️ Database Access

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

**Database Collections**:
- `users` - User accounts and profiles
- `vacancies` - Cached vacancy data from hh.ru API (with TTL index, auto-deletes after 7 days)
- `vacancyprogresses` - User's job application tracking (8 status stages)

## 📝 Current Implementation Status

### ✅ Completed Features

**Authentication System** (Full-Stack):
- JWT authentication with refresh tokens (15m access, 7d refresh)
- Registration with validation (email, password strength, name)
- Login with credentials
- Automatic token refresh on 401 errors (frontend interceptor with request queuing)
- Logout endpoint that invalidates refresh token
- Global JWT guard on backend with `@Public()` decorator bypass
- Secure password hashing with bcrypt (10 rounds)
- Frontend Zustand store with localStorage persistence

**Backend Modules** (4 modules, 138 passing e2e tests):
- **Auth Module**: Register, login, refresh, logout endpoints
  - Dual JWT strategies (access + refresh with different secrets)
  - RefreshTokenGuard for token rotation
  - Password validation (min 8 chars, uppercase + lowercase + number)

- **Users Module**: Profile management and saved vacancies
  - GET/PUT `/users/me` - Profile CRUD
  - GET/POST/DELETE `/users/me/vacancies/:id` - Saved vacancies management
  - MongoDB `$addToSet` and `$pull` operators for array management

- **Vacancies Module**: hh.ru API integration
  - GET `/vacancies/search` - Search with filters and pagination
  - GET `/vacancies/dictionaries` - Reference data (areas, schedules, etc.)
  - GET `/vacancies/:id` - Individual vacancy with 7-day caching
  - Custom HhApiService for external API calls

- **VacancyProgress Module**: Job application tracking
  - Full CRUD operations with user isolation
  - Status enum: SAVED, APPLIED, INTERVIEW_SCHEDULED, INTERVIEW_COMPLETED, REJECTED, OFFER_RECEIVED, OFFER_ACCEPTED, WITHDRAWN
  - Statistics endpoint (counts by status)
  - Filtering and pagination support
  - Notes, tags, priority, interview date fields

**Frontend Pages**:
- **Home**: Landing page
- **Login/Register**: Formik + Yup validation forms with error handling
- **Search**: Main vacancy search with filters, pagination, full-width responsive design
  - Public page - accessible without authentication
  - Save button only visible for authenticated users
  - Filter panel (accordion-based): Salary, Experience, Schedule, Employment
  - Vacancy cards in responsive grid (1/2/3 columns)
  - Debounced search input (500ms)
  - Loading/error/empty states

**Frontend Infrastructure**:
- **State Management**: Zustand for auth (persisted), React Query for server state
- **API Client**: Axios with interceptors
  - Request interceptor: Adds `Authorization: Bearer {token}` header
  - Response interceptor: Automatic token refresh on 401 with request queuing
  - Unwraps backend TransformInterceptor wrapper (`response.data.data`)
- **Routing**: React Router with protected routes
  - Public routes: /, /search, /login, /register
  - Protected routes: /saved, /vacancy-progress, /profile
- **Components**: Reusable library
  - Layout: Header (with user menu), Footer, ProtectedRoute
  - Features: VacancyList, VacancyCard, FilterPanel
  - Common: SearchBar, Pagination, LoadingSpinner, ErrorDisplay
- **Forms**: Formik + Yup for all form validation
- **UI**: Material-UI 7 with custom theme, responsive design
- **Hooks**: Custom React Query hooks with query key factory pattern

### 🚧 Placeholder Pages (Future Implementation)
- Vacancy detail page (`/vacancy/:id`)
- Saved vacancies list page (`/saved`)
- Vacancy progress tracking page (`/vacancy-progress`)
- User profile management page (`/profile`)

## 🔑 Key Conventions

### API Naming Convention
**Backend uses specific method names for saved vacancies**:
- `getSavedVacancies()` → GET `/api/v1/users/me/vacancies`
- `addVacancy()` → POST `/api/v1/users/me/vacancies/:vacancyId`
- `removeVacancy()` → DELETE `/api/v1/users/me/vacancies/:vacancyId`

**Frontend must match**:
- Service functions: `fetchSavedVacancies()`, `addVacancy()`, `removeVacancy()`
- Hooks: `useSavedVacancies()`, `useAddVacancy()`, `useRemoveVacancy()`

### VacancyProgress Terminology
- The schema for tracking job applications is called `VacancyProgress` (NOT "Application")
- This avoids confusion with "app" or "application" referring to the software itself
- **Code**: Always use `VacancyProgress` in file names, component names, routes, functions
- **UI Text**: You MAY use "Applications" in display text only (page titles, button labels)

### Response Wrapping
**IMPORTANT**: Backend uses TransformInterceptor that wraps all responses in `{ data: {...} }`
- Frontend must access `response.data.data` instead of `response.data`
- This applies to ALL API endpoints

## 🌐 Environment Variables

### Backend `.env`
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://jobflow_user:jobflow_dev_password@localhost:27017/jobflow?authSource=jobflow

# JWT (must be different 64+ byte random strings)
JWT_SECRET=your-secure-secret-key-for-access-tokens-min-64-bytes
JWT_REFRESH_SECRET=your-secure-secret-key-for-refresh-tokens-min-64-bytes
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

API_PREFIX=api
API_VERSION=v1
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### Frontend `.env`
```bash
VITE_API_BASE_URL=/api/v1
```

## 💡 Development Notes

- MongoDB 4.4 is used for compatibility with older CPUs (no AVX instruction set requirement)
- Backend runs on port 3000, frontend on port 3001
- All API endpoints have `/api/v1` prefix
- Authentication uses dual tokens (access + refresh) stored in localStorage
- Access tokens: 15 minutes (short-lived for security)
- Refresh tokens: 7 days (long-lived for UX)
- Backend wraps all responses in `{ data: {...} }` via TransformInterceptor
- Frontend automatically refreshes tokens on 401 errors with request queuing
- React Query DevTools available in development mode
- 138 passing e2e tests on backend ensuring API stability
- The project uses conventional commits for git history

## 🔗 Important Files

### Infrastructure
- `docker-compose.yml` - Multi-container orchestration (MongoDB + Mongo Express)
- `docker/mongo-init/init.js` - MongoDB initialization (creates users, collections, indexes)
- `.gitignore` - Project-wide ignore patterns

### Root Configuration
- `package.json` - Orchestration scripts for full-stack development
- `CLAUDE.md` - This file (project overview and conventions)

### Subproject Documentation
- `jobflow-backend/CLAUDE.md` - Backend-specific patterns and conventions
- `jobflow-frontend/CLAUDE.md` - Frontend-specific patterns and conventions

---

**For detailed conventions and best practices, always refer to the CLAUDE.md file in the specific subdirectory you're working in.**
