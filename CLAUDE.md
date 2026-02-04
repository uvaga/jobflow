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
- **Full Implementation Plan**: See [`jobflow-implementation-plan.md`](./jobflow-implementation-plan.md)

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

**Backend**: NestJS 11, TypeScript 5.7, Mongoose 9, class-validator, Swagger
**Frontend**: React 19, TypeScript 5.9, Vite 7, MUI 7, React Query 5, Zustand 5
**Database**: MongoDB 4.4 (Docker)
**Testing**: Jest (backend), Supertest (e2e)

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
- `vacancies` - Cached vacancy data from hh.ru API (with TTL)
- `vacancyprogresses` - User's job application tracking

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

## 🌐 Environment Variables

### Backend `.env`
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://jobflow_user:jobflow_dev_password@localhost:27017/jobflow?authSource=jobflow
JWT_SECRET=your-secure-secret-key
JWT_EXPIRES_IN=1d
API_PREFIX=api
API_VERSION=v1
CORS_ORIGIN=http://localhost:3001
```

### Frontend `.env`
```bash
VITE_API_BASE_URL=/api/v1
```

## 📝 Development Notes

- MongoDB 4.4 is used for compatibility with older CPUs (no AVX instruction set requirement)
- Backend runs on port 3000, frontend on port 3001
- All API endpoints have `/api/v1` prefix
- Authentication uses JWT tokens stored in localStorage
- React Query DevTools available in development mode
- The project uses conventional commits for git history

## 🔗 Important Files

### Infrastructure
- `docker-compose.yml` - Multi-container orchestration
- `docker/mongo-init/init.js` - MongoDB initialization (creates users and collections)
- `.gitignore` - Project-wide ignore patterns

### Root Configuration
- `package.json` - Orchestration scripts for full-stack development
- `CLAUDE.md` - This file
- `jobflow-implementation-plan.md` - Complete implementation roadmap

---

**For detailed conventions and best practices, always refer to the CLAUDE.md file in the specific subdirectory you're working in.**
