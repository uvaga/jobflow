# JobFlow - Implementation Plan for Claude Code

## Project Overview
Full-stack job search platform integrating with hh.ru API
- **Backend:** Node.js + NestJS 11 (TypeScript) ✅ **INITIALIZED**
- **Frontend:** React 18 + TypeScript + Vite
- **Database:** MongoDB + Mongoose
- **API Integration:** hh.ru OpenAPI
- **Architecture:** Monorepo structure

---

## Current Status
✅ Backend initialized with NestJS 11
✅ Core dependencies installed (@nestjs/mongoose, @nestjs/config, axios, class-validator, @nestjs/swagger)
⏳ Frontend needs initialization
⏳ Database connection setup needed
⏳ Authentication system needed

---

## Technology Stack (2026 Best Practices)

### Modern Updates Applied
This plan has been updated with modern best practices:

**Original → Updated:**
- ~~create-react-app~~ → **Vite** (faster builds, better DX)
- ~~react-query~~ → **@tanstack/react-query** (updated package name)
- JavaScript → **TypeScript** (type safety throughout)
- ~~Context API~~ → **Zustand** (simpler state management)
- Basic JWT → **JWT + Refresh Tokens** (better security)
- ~~localStorage only~~ → **Optimistic Updates** (better UX)
- No Docker → **Docker Compose** (easy local development)
- No versioning → **API Versioning** (/api/v1/)
- Basic validation → **Class-validator + Yup** (robust validation)

### Core Technologies

**Backend:**
- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS 11 (TypeScript)
- **Database:** MongoDB 7 + Mongoose 9
- **Authentication:** JWT with refresh tokens, bcrypt, Passport
- **Validation:** class-validator, class-transformer
- **API Docs:** Swagger/OpenAPI
- **Security:** Helmet, CORS, rate limiting (@nestjs/throttler)
- **HTTP Client:** Axios
- **Testing:** Jest, Supertest

**Frontend:**
- **Build Tool:** Vite 5
- **Framework:** React 18 + TypeScript
- **Routing:** React Router 6
- **State Management:**
  - Server State: TanStack Query (React Query) v5
  - Client State: Zustand
- **UI Framework:** Material-UI (MUI) v5
- **Forms:** Formik + Yup
- **HTTP Client:** Axios
- **Date Handling:** date-fns
- **Testing:** Vitest, React Testing Library

**DevOps & Tools:**
- **Containerization:** Docker + Docker Compose
- **Version Control:** Git with conventional commits
- **Code Quality:** ESLint, Prettier, TypeScript
- **API Testing:** Thunder Client / Postman
- **Package Manager:** npm

**Deployment Options:**
- **Backend:** Railway, Render, Heroku, DigitalOcean, AWS
- **Frontend:** Vercel (recommended), Netlify, Cloudflare Pages
- **Database:** MongoDB Atlas (recommended)

---

## Phase 1: Project Setup & Architecture

### Task 1.1: Backend Setup (COMPLETED ✅)
Backend is already initialized with:
- NestJS 11.0.1
- Mongoose 9.1.5
- TypeScript 5.7.3
- Swagger/OpenAPI support
- Class validation
- Axios for HTTP requests

**Additional packages to install:**
```bash
cd jobflow-backend
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install @nestjs/throttler # Rate limiting
npm install helmet # Security headers
npm install compression # Response compression
npm install -D @types/bcrypt @types/passport-jwt
```

**Files to create:**
- `.env` - Environment variables (MongoDB URI, JWT secret, port)
- `.env.example` - Template for environment variables
- `src/config/configuration.ts` - Type-safe configuration module
- `.gitignore` - Update to exclude .env, dist, coverage
- `docker-compose.yml` - Local MongoDB setup

### Task 1.2: Initialize Frontend with Vite
```bash
# Use Vite instead of create-react-app (faster, more modern)
npm create vite@latest jobflow-frontend -- --template react-ts
cd jobflow-frontend
npm install

# Core dependencies
npm install axios react-router-dom
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install formik yup
npm install date-fns # Better than moment.js
npm install zustand # Lightweight state management (alternative to Context API)

# Dev dependencies
npm install -D @types/node
```

**Files to create:**
- `.env` - Backend API URL
- `.env.example` - Template
- `src/config/api.ts` - Type-safe Axios configuration with interceptors
- `src/types/` - Shared TypeScript interfaces
- `vite.config.ts` - Vite configuration with proxy for API calls

### Task 1.3: Database Setup
**Option 1: Docker Compose (Recommended for development)**
Create `docker-compose.yml` in project root:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    container_name: jobflow-mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
volumes:
  mongodb_data:
```
Run: `docker-compose up -d`

**Option 2: MongoDB Atlas (Recommended for production)**
- Create free cluster at mongodb.com/atlas
- Get connection string
- Add to `.env` file

**Backend MongoDB Module:**
Configure in `app.module.ts` with proper error handling and connection pooling.

---

## Phase 2: Backend Core Structure

### Task 2.1: Create Database Schemas (Mongoose + NestJS)

**User Schema** (`src/users/schemas/user.schema.ts`):
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false }) // Exclude from queries by default
  password: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Vacancy' }], default: [] })
  savedVacancies: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  // timestamps: true adds createdAt and updatedAt automatically
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes for better performance
UserSchema.index({ email: 1 });
```

**Vacancy Schema** (`src/vacancies/schemas/vacancy.schema.ts`):
```typescript
@Schema({ timestamps: true })
export class Vacancy extends Document {
  @Prop({ required: true, unique: true, index: true })
  hhId: string; // ID from hh.ru API

  @Prop({ required: true })
  name: string;

  @Prop({ type: Object })
  employer: {
    id: string;
    name: string;
    url?: string;
    logoUrls?: {
      original?: string;
      '90'?: string;
      '240'?: string;
    };
    trusted: boolean;
  };

  @Prop({ type: Object })
  salary: {
    from?: number;
    to?: number;
    currency: string;
    gross?: boolean;
  };

  @Prop({ type: Object })
  area: {
    id: string;
    name: string;
    url: string;
  };

  @Prop({ required: true })
  url: string;

  @Prop()
  description: string;

  @Prop({ type: Object })
  schedule: { id: string; name: string };

  @Prop({ type: Object })
  experience: { id: string; name: string };

  @Prop({ type: Object })
  employment: { id: string; name: string };

  @Prop()
  publishedAt: Date;

  // Cache the full hh.ru response for 7 days
  @Prop({ type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
  cacheExpiresAt: Date;
}

export const VacancySchema = SchemaFactory.createForClass(Vacancy);
VacancySchema.index({ hhId: 1 });
VacancySchema.index({ 'area.id': 1, 'salary.from': 1 }); // Compound index for filtering
```

**VacancyProgress Schema** (`src/vacancy-progress/schemas/vacancy-progress.schema.ts`):
```typescript
export enum VacancyProgressStatus {
  SAVED = 'saved',
  APPLIED = 'applied',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_COMPLETED = 'interview_completed',
  REJECTED = 'rejected',
  OFFER_RECEIVED = 'offer_received',
  OFFER_ACCEPTED = 'offer_accepted',
  WITHDRAWN = 'withdrawn',
}

@Schema({ timestamps: true })
export class VacancyProgress extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vacancy', required: true })
  vacancyId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(VacancyProgressStatus),
    default: VacancyProgressStatus.SAVED
  })
  status: VacancyProgressStatus;

  @Prop({ trim: true, maxlength: 2000 })
  notes: string;

  @Prop()
  appliedAt?: Date;

  @Prop()
  interviewDate?: Date;

  @Prop({ type: [String], default: [] })
  tags: string[]; // For custom organization

  @Prop({ default: 0 })
  priority: number; // User-defined priority (0-5)
}

export const VacancyProgressSchema = SchemaFactory.createForClass(VacancyProgress);
VacancyProgressSchema.index({ userId: 1, status: 1 });
VacancyProgressSchema.index({ userId: 1, createdAt: -1 });
```

### Task 2.2: Create NestJS Modules (Best Practices)

**Module Structure:**
Each module should follow this structure:
```
module-name/
├── dto/
│   ├── create-entity.dto.ts
│   ├── update-entity.dto.ts
│   └── query-entity.dto.ts
├── entities/ (or schemas/)
│   └── entity.schema.ts
├── guards/
│   └── custom.guard.ts (if needed)
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.module.ts
└── module-name.controller.spec.ts
```

**Common Module** (`src/common/`) - Create first:
```typescript
// src/common/guards/jwt-auth.guard.ts - Reusable JWT guard
// src/common/decorators/current-user.decorator.ts - Get current user
// src/common/filters/http-exception.filter.ts - Global error handling
// src/common/interceptors/transform.interceptor.ts - Response transformation
// src/common/pipes/validation.pipe.ts - Custom validation
```

**Auth Module** (`src/auth/`):
```typescript
// auth.module.ts - Configure JWT strategy and PassportModule
// auth.controller.ts:
//   - POST /api/v1/auth/register
//   - POST /api/v1/auth/login
//   - POST /api/v1/auth/refresh (refresh token)
//   - POST /api/v1/auth/logout
// auth.service.ts - Bcrypt hashing, JWT generation, token validation
// strategies/jwt.strategy.ts - JWT authentication strategy
// strategies/refresh-token.strategy.ts - Refresh token strategy
// dto/register.dto.ts - Validation with class-validator
// dto/login.dto.ts
```

**Users Module** (`src/users/`):
```typescript
// users.controller.ts:
//   - GET /api/v1/users/me (current user profile)
//   - PUT /api/v1/users/me (update profile)
//   - GET /api/v1/users/me/vacancies (get saved vacancies)
//   - POST /api/v1/users/me/vacancies/:vacancyId (add vacancy)
//   - DELETE /api/v1/users/me/vacancies/:vacancyId (remove vacancy)
// users.service.ts - User CRUD, saved vacancies management (addVacancy, removeVacancy)
// users.module.ts
// dto/update-user.dto.ts
```

**Vacancies Module** (`src/vacancies/`):
```typescript
// vacancies.controller.ts:
//   - GET /api/v1/vacancies/search (with query params)
//   - GET /api/v1/vacancies/:id
//   - GET /api/v1/vacancies/dictionaries (areas, industries)
// vacancies.service.ts - Orchestration layer
// hh-api.service.ts - HTTP client wrapper for hh.ru API
// vacancies.module.ts - Import HttpModule
// dto/search-vacancies.dto.ts - Query validation with class-validator
// interfaces/hh-api-response.interface.ts - Type definitions
```

**VacancyProgress Module** (`src/vacancy-progress/`):
```typescript
// vacancy-progress.controller.ts:
//   - POST /api/v1/vacancy-progress
//   - GET /api/v1/vacancy-progress (with filters)
//   - GET /api/v1/vacancy-progress/:id
//   - PATCH /api/v1/vacancy-progress/:id
//   - DELETE /api/v1/vacancy-progress/:id
//   - GET /api/v1/vacancy-progress/statistics (dashboard data)
// vacancy-progress.service.ts - CRUD + business logic
// vacancy-progress.module.ts
// enums/vacancy-progress-status.enum.ts
// dto/create-vacancy-progress.dto.ts
// dto/update-vacancy-progress.dto.ts
// dto/query-vacancy-progress.dto.ts
```

**Best Practices:**
- Use DTOs for ALL request/response validation
- Implement proper error handling with custom exception filters
- Use dependency injection properly (avoid circular dependencies)
- Add API versioning (`/api/v1/`)
- Use class-transformer to exclude sensitive fields (e.g., password)
- Implement request logging with custom interceptor
- Add rate limiting with @nestjs/throttler
- Use Swagger decorators for API documentation

### Task 2.3: Implement hh.ru API Integration

**File:** `src/vacancies/hh-api.service.ts`

```typescript
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, retry, catchError } from 'rxjs';

@Injectable()
export class HhApiService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(HhApiService.name);
  private readonly userAgent = 'JobFlow/1.0 (your-email@example.com)'; // Required by hh.ru

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('HH_API_BASE_URL', 'https://api.hh.ru');
  }

  /**
   * Search vacancies with filters
   * Docs: https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies
   */
  async searchVacancies(params: SearchVacanciesDto): Promise<HhVacanciesResponse> {
    const queryParams = {
      text: params.text,
      area: params.area,
      salary: params.salary,
      experience: params.experience,
      employment: params.employment,
      schedule: params.schedule,
      page: params.page || 0,
      per_page: params.per_page || 20,
      order_by: params.order_by || 'relevance',
      search_field: 'name,description', // Search in both fields
      only_with_salary: params.only_with_salary,
    };

    return this.makeRequest<HhVacanciesResponse>('/vacancies', queryParams);
  }

  /**
   * Get vacancy details by ID
   */
  async getVacancyById(id: string): Promise<HhVacancyDetail> {
    return this.makeRequest<HhVacancyDetail>(`/vacancies/${id}`);
  }

  /**
   * Get all dictionaries (areas, industries, experience, employment, schedule)
   */
  async getDictionaries(): Promise<any> {
    return this.makeRequest('/dictionaries');
  }

  /**
   * Get location/area tree
   */
  async getAreas(): Promise<HhArea[]> {
    return this.makeRequest<HhArea[]>('/areas');
  }

  /**
   * Get industries list
   */
  async getIndustries(): Promise<HhIndustry[]> {
    return this.makeRequest<HhIndustry[]>('/industries');
  }

  /**
   * Generic request method with error handling and retry logic
   */
  private async makeRequest<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.baseUrl}${endpoint}`, {
            params,
            headers: {
              'User-Agent': this.userAgent,
              'HH-User-Agent': this.userAgent,
            },
          })
          .pipe(
            retry({ count: 2, delay: 1000 }), // Retry failed requests
            catchError((error) => {
              this.logger.error(`HH API Error: ${error.message}`, error.stack);
              throw new HttpException(
                'Failed to fetch data from hh.ru',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Request to ${endpoint} failed`, error);
      throw error;
    }
  }
}
```

**Query Parameters to support:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| text | string | Search query | "JavaScript developer" |
| area | number | Location ID | 1 (Moscow), 2 (Saint Petersburg) |
| salary | number | Minimum salary | 100000 |
| experience | string | Experience level | noExperience, between1And3, between3And6, moreThan6 |
| employment | string | Employment type | full, part, project, volunteer, probation |
| schedule | string | Work schedule | fullDay, shift, flexible, remote, flyInFlyOut |
| page | number | Page number | 0 |
| per_page | number | Results per page (max 100) | 20 |
| order_by | string | Sort order | relevance, publication_time, salary_desc, salary_asc |
| only_with_salary | boolean | Only show jobs with salary | true |

**Important Notes:**
- hh.ru requires User-Agent header with contact email
- API has rate limits (check documentation)
- Some endpoints require authentication (employer features)
- Implement caching for dictionaries (they rarely change)
- Use pagination properly (max 2000 results total)

---

## Phase 3: Frontend Structure (React + TypeScript + Vite)

### Task 3.1: Setup Routing & Layout

**File:** `src/App.tsx`

**Project Structure:**
```
src/
├── components/        # Reusable components
│   ├── Layout/
│   ├── Search/
│   ├── Vacancy/
│   ├── VacancyProgress/  # Application tracking components
│   ├── Auth/
│   └── common/       # Shared components (Button, Input, etc.)
├── pages/            # Route components
│   ├── Home.tsx
│   ├── Search.tsx
│   ├── VacancyDetail.tsx
│   ├── SavedVacancies.tsx
│   ├── VacancyProgress.tsx  # Application tracking page (displays as "My Applications")
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Profile.tsx
├── hooks/            # Custom React hooks
├── services/         # API services
├── store/            # Zustand store
├── types/            # TypeScript types/interfaces
├── utils/            # Helper functions
├── config/           # Configuration
└── assets/           # Images, styles, etc.
```

**Routes with React Router v6:**
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="vacancy/:id" element={<VacancyDetail />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="saved" element={<SavedVacancies />} />
              <Route path="vacancy-progress" element={<VacancyProgress />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Auth routes */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Layout Components:**
```typescript
// src/components/Layout/Layout.tsx - Main layout with Outlet
// src/components/Layout/Header.tsx - Navigation bar with user menu
// src/components/Layout/Footer.tsx
// src/components/Layout/Sidebar.tsx - Collapsible filters sidebar (Material-UI Drawer)
// src/components/Layout/ProtectedRoute.tsx - Authentication guard
```

### Task 3.2: Create Core Components (TypeScript + Material-UI)

**Search Components:**
```typescript
// src/components/Search/SearchBar.tsx
// - Debounced input (use useDebouncedValue hook)
// - Autocomplete suggestions (optional)
// - Search button with loading state
// Props: onSearch, initialValue, isLoading

// src/components/Search/FilterPanel.tsx
// - Material-UI Accordion for filter groups
// - Salary range slider (MUI Slider)
// - Location select (MUI Autocomplete)
// - Experience checkboxes
// - Employment type chips
// - Reset filters button
// Props: filters, onFilterChange, onReset

// src/components/Search/VacancyCard.tsx
// - Material-UI Card with hover effect
// - Company logo, job title, salary
// - Location, employment type badges
// - Save button with optimistic update
// - Link to detail page
// Props: vacancy, isSaved, onSave

// src/components/Search/VacancyList.tsx
// - Grid or List view toggle
// - Loading skeletons (MUI Skeleton)
// - Empty state with illustration
// - Infinite scroll or pagination
// Props: vacancies, isLoading, view

// src/components/Search/Pagination.tsx
// - Material-UI Pagination component
// - Show results count
// Props: page, totalPages, onChange
```

**Vacancy Components:**
```typescript
// src/components/Vacancy/VacancyDetail.tsx
// - Full job description (sanitize HTML)
// - Company information card
// - Skills/requirements section
// - Action buttons (Save, Apply, Share)
// - Similar vacancies section
// Props: vacancy, isSaved, onSave

// src/components/Vacancy/SaveButton.tsx
// - IconButton with Bookmark icon
// - Filled/outlined state
// - Optimistic update with React Query
// - Toast notification on success/error
// Props: vacancyId, isSaved, onToggle

// src/components/Vacancy/ApplyButton.tsx
// - Opens modal/drawer with application form
// - Status selection
// - Notes textarea
// Props: vacancy, onApply
```

**Auth Components:**
```typescript
// src/components/Auth/LoginForm.tsx
// - Formik + Yup validation
// - Email and password fields
// - Remember me checkbox
// - Loading state on submit
// - Error display
// Props: onSubmit

// src/components/Auth/RegisterForm.tsx
// - Multi-step form (optional)
// - Email, password, firstName, lastName
// - Password strength indicator
// - Terms acceptance checkbox
// Props: onSubmit

// src/components/Profile/ProfileView.tsx
// - User information display
// - Statistics (saved, applied counts)
// - Edit button
// Props: user

// src/components/Profile/ProfileEdit.tsx
// - Editable form with Formik
// - Avatar upload (optional)
// - Job preferences section
// Props: user, onUpdate
```

**VacancyProgress Components:**
```typescript
// src/components/VacancyProgress/VacancyProgressCard.tsx
// - Material-UI Card with status color coding
// - Vacancy title and company
// - Status badge
// - Quick actions (edit status, add note)
// - Timeline of status changes
// Props: vacancyProgress, onUpdate

// src/components/VacancyProgress/VacancyProgressList.tsx
// - Filter by status
// - Sort by date
// - Group by status (Kanban-style optional)
// Props: vacancyProgressList, onStatusChange

// src/components/VacancyProgress/StatusBadge.tsx
// - Color-coded chip/badge
// - Icon for each status
// Props: status

// src/components/VacancyProgress/VacancyProgressModal.tsx
// - Edit application tracking details
// - Status dropdown
// - Rich text notes editor
// - Interview date picker
// Props: vacancyProgress, onSave, onClose
```

### Task 3.3: State Management & API Integration

**API Client Setup** (`src/config/api.ts`):
```typescript
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify'; // or MUI Snackbar

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**API Services** (`src/services/`):
```typescript
// src/services/authService.ts
export const authService = {
  register: (data: RegisterDto) => api.post('/auth/register', data),
  login: (data: LoginDto) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
};

// src/services/vacancyService.ts
export const vacancyService = {
  search: (params: SearchParams) => api.get('/vacancies/search', { params }),
  getById: (id: string) => api.get(`/vacancies/${id}`),
  getDictionaries: () => api.get('/vacancies/dictionaries'),
};

// src/services/userService.ts
export const userService = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: UpdateUserDto) => api.put('/users/me', data),
  getSavedVacancies: () => api.get('/users/me/vacancies'),
  addVacancy: (vacancyId: string) => api.post(`/users/me/vacancies/${vacancyId}`),
  removeVacancy: (vacancyId: string) => api.delete(`/users/me/vacancies/${vacancyId}`),
};

// src/services/vacancyProgressService.ts
export const vacancyProgressService = {
  getAll: (filters?: VacancyProgressFilters) => api.get('/vacancy-progress', { params: filters }),
  getById: (id: string) => api.get(`/vacancy-progress/${id}`),
  create: (data: CreateVacancyProgressDto) => api.post('/vacancy-progress', data),
  update: (id: string, data: UpdateVacancyProgressDto) => api.patch(`/vacancy-progress/${id}`, data),
  delete: (id: string) => api.delete(`/vacancy-progress/${id}`),
  getStatistics: () => api.get('/vacancy-progress/statistics'),
};
```

**State Management with Zustand** (`src/store/`):
```typescript
// src/store/authStore.ts - Global auth state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (token, user) => {
        localStorage.setItem('accessToken', token);
        set({ accessToken: token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        set({ accessToken: null, user: null, isAuthenticated: false });
      },
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    { name: 'auth-storage' }
  )
);

// src/store/searchStore.ts - Search filters state
export const useSearchStore = create<SearchState>((set) => ({
  filters: defaultFilters,
  searchText: '',
  setFilters: (filters) => set({ filters }),
  setSearchText: (text) => set({ searchText: text }),
  resetFilters: () => set({ filters: defaultFilters, searchText: '' }),
}));
```

**React Query Hooks** (`src/hooks/`):
```typescript
// src/hooks/useVacancies.ts
import { useQuery } from '@tanstack/react-query';

export const useVacancies = (params: SearchParams) => {
  return useQuery({
    queryKey: ['vacancies', params],
    queryFn: () => vacancyService.search(params),
    enabled: !!params.text || !!params.area,
    staleTime: 5 * 60 * 1000,
  });
};

export const useVacancyDetail = (id: string) => {
  return useQuery({
    queryKey: ['vacancy', id],
    queryFn: () => vacancyService.getById(id),
    enabled: !!id,
  });
};

// src/hooks/useVacancyProgress.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useVacancyProgress = (filters?: VacancyProgressFilters) => {
  return useQuery({
    queryKey: ['vacancyProgress', filters],
    queryFn: () => vacancyProgressService.getAll(filters),
  });
};

export const useCreateVacancyProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vacancyProgressService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancyProgress'] });
      toast.success('Application tracking created successfully');
    },
  });
};

// Optimistic updates example
export const useUpdateVacancyProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVacancyProgressDto }) =>
      vacancyProgressService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['vacancyProgress'] });
      const previous = queryClient.getQueryData(['vacancyProgress']);
      queryClient.setQueryData(['vacancyProgress'], (old: any) => ({
        ...old,
        data: old.data.map((progress: VacancyProgress) =>
          progress.id === id ? { ...progress, ...data } : progress
        ),
      }));
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['vacancyProgress'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancyProgress'] });
    },
  });
};

// src/hooks/useSavedVacancies.ts
export const useSavedVacancies = () => {
  return useQuery({
    queryKey: ['savedVacancies'],
    queryFn: userService.getSavedVacancies,
  });
};

export const useToggleSaveVacancy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vacancyId, isSaved }: { vacancyId: string; isSaved: boolean }) =>
      isSaved ? userService.removeVacancy(vacancyId) : userService.addVacancy(vacancyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedVacancies'] });
    },
  });
};

// src/hooks/useDebounce.ts - Utility hook
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
```

---

## Phase 4: Core Features Implementation

### Task 4.1: Authentication System (Modern JWT with Refresh Tokens)

**Backend Implementation:**

1. **Install Required Packages** (if not already done):
```bash
cd jobflow-backend
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install -D @types/bcrypt @types/passport-jwt
```

2. **Create Auth Module Structure:**
```typescript
// src/auth/auth.module.ts
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

// src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });
    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.generateTokens(user);
  }

  private generateTokens(user: User) {
    const payload = { sub: user._id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}

// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user; // Attached to req.user
  }
}

// src/auth/dto/register.dto.ts
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}

// src/common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Usage in controllers:
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: User) {
  return user;
}
```

3. **Security Best Practices:**
- Hash passwords with bcrypt (salt rounds: 10-12)
- Use strong JWT secrets (minimum 256 bits)
- Short-lived access tokens (15 minutes)
- Longer refresh tokens (7 days)
- Store refresh tokens securely (httpOnly cookies recommended)
- Implement rate limiting on auth endpoints
- Add CORS configuration

**Frontend Implementation:**

1. **Create Auth Context/Store:**
```typescript
// Already covered in Task 3.3 with Zustand
```

2. **Create Auth Forms with Formik + Yup:**
```typescript
// src/pages/Login.tsx
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
});

export const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState('');

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const { data } = await authService.login(values);
      login(data.accessToken, data.user);
      navigate('/search');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" gutterBottom>
          Login
        </Typography>
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Field
                as={TextField}
                name="email"
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
              />
              <Field
                as={TextField}
                name="password"
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
              />
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 3 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Login'}
              </Button>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link component={RouterLink} to="/register">
                  Don't have an account? Register
                </Link>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};
```

3. **Protected Route Component:**
```typescript
// src/components/Layout/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
```

4. **Logout Functionality:**
```typescript
// In Header component
const logout = useAuthStore((state) => state.logout);
const navigate = useNavigate();

const handleLogout = () => {
  logout();
  navigate('/login');
};
```

### Task 4.2: Vacancy Search & Display

**Backend:**
1. Create service method calling hh.ru API
2. Implement caching for dictionaries (areas, industries)
3. Add error handling for API failures
4. Transform hh.ru response to match frontend needs

**Frontend:**
1. Build search interface with text input
2. Create filter panel (salary, location, experience)
3. Implement pagination
4. Add loading states and error handling
5. Display vacancy cards with key information

### Task 4.3: Vacancy Details & Saving

**Backend:**
1. Endpoint to fetch full vacancy details
2. Endpoint to save vacancy to user's collection
3. Endpoint to remove saved vacancy

**Frontend:**
1. Vacancy detail page with full description
2. Save/unsave button with optimistic updates
3. Link to external hh.ru page
4. Responsive design for mobile

### Task 4.4: Application Tracking

**Backend:**
1. CRUD endpoints for applications
2. Status update endpoint
3. Filter applications by status
4. Sort by date

**Frontend:**
1. Application dashboard showing all applications
2. Status filter (saved, applied, interview, etc.)
3. Note-taking functionality
4. Timeline view of application process

---

## Phase 5: Advanced Features

### Task 5.1: Search Filters & Sorting

**Filters to implement:**
- Salary range (min/max)
- Location (city/area)
- Experience level (no experience, 1-3 years, 3-6 years, 6+ years)
- Employment type (full-time, part-time, contract)
- Schedule (remote, office, hybrid, flexible)
- Industry/specialization

**Sorting options:**
- Relevance (default)
- Publication date
- Salary (high to low)

### Task 5.2: User Profile Management

**Features:**
- Edit personal information
- Upload resume/CV (optional)
- Set job preferences (desired salary, location, etc.)
- Email notification settings

### Task 5.3: Dashboard & Statistics

**User Dashboard:**
- Total saved vacancies count
- Application status breakdown (chart/stats)
- Recent activity feed
- Quick search from dashboard

---

## Phase 6: Polish & Optimization

### Task 6.1: Error Handling & Validation

**Backend:**
- Global exception filter
- DTO validation with class-validator
- Proper HTTP status codes
- Error logging

**Frontend:**
- Form validation with Formik + Yup
- User-friendly error messages
- Retry logic for failed requests
- Toast notifications

### Task 6.2: Performance Optimization

**Backend:**
- Implement caching with Redis (optional)
- Database indexing for frequent queries
- Rate limiting for API endpoints

**Frontend:**
- Code splitting with React.lazy
- Image lazy loading
- Debounce search input
- Memoization with useMemo/useCallback

### Task 6.3: UI/UX Improvements

- Responsive design for all screen sizes
- Loading skeletons for better perceived performance
- Empty states with helpful messages
- Keyboard shortcuts (optional)
- Dark mode (optional)

### Task 6.4: Testing

**Backend:**
- Unit tests for services
- E2E tests for critical flows

**Frontend:**
- Component tests with React Testing Library
- Integration tests for user flows

---

## Phase 7: Deployment

### Task 7.1: Backend Deployment

**Options:**
- Heroku (easy, free tier available)
- Railway (modern, developer-friendly)
- DigitalOcean App Platform
- AWS EC2/Elastic Beanstalk

**Requirements:**
- Set environment variables
- Configure MongoDB connection (Atlas recommended)
- Set up CORS properly
- Enable HTTPS

### Task 7.2: Frontend Deployment

**Options:**
- Vercel (recommended for React)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

**Requirements:**
- Build production bundle
- Configure API endpoint URL
- Set up custom domain (optional)

### Task 7.3: Database

**MongoDB Atlas:**
- Create production cluster
- Configure IP whitelist
- Set up backup policy
- Create database user with appropriate permissions

---

## Quick Start Guide

### 1. Start MongoDB (Docker)
```bash
docker-compose up -d mongodb
```

### 2. Setup Backend Environment
```bash
cd jobflow-backend
cp .env.example .env
# Edit .env with your values
npm install
npm run start:dev
```

Backend will run on http://localhost:3000
Swagger docs available at http://localhost:3000/api

### 3. Setup Frontend
```bash
npm create vite@latest jobflow-frontend -- --template react-ts
cd jobflow-frontend
npm install
# Install all dependencies from Phase 1, Task 1.2
cp .env.example .env
# Edit .env with backend URL
npm run dev
```

Frontend will run on http://localhost:5173

### 4. Generate JWT Secrets
```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Development Order (Recommended Sprint Plan)

### Sprint 1: Setup & Authentication (Week 1)
**Backend:**
- ✅ NestJS initialized
- ✅ Configure MongoDB connection with Mongoose
- ✅ Create User schema with indexes
- ✅ Create Vacancy schema with indexes and TTL
- ✅ Create VacancyProgress schema with indexes
- [ ] Set up Auth module with JWT + refresh tokens
- [ ] Implement register/login/refresh endpoints
- [ ] Add validation DTOs
- [ ] Set up Swagger documentation
- [ ] Add rate limiting and security middleware
- [ ] Test with Postman/Thunder Client

**Frontend:**
- [ ] Initialize with Vite + TypeScript
- [ ] Install all dependencies
- [ ] Set up React Router with routes
- [ ] Create Layout components (Header, Footer)
- [ ] Implement Zustand auth store
- [ ] Create Login/Register pages with Formik + Yup
- [ ] Set up Axios interceptors
- [ ] Implement ProtectedRoute component
- [ ] Test authentication flow end-to-end

**Deliverable:** Working authentication system with JWT

---

### Sprint 2: Core Search Functionality (Week 2)
**Backend:**
- [ ] Create Vacancy schema with proper indexes
- [ ] Implement HhApiService with all methods
- [ ] Create Vacancies module (controller + service)
- [ ] Add search endpoint with filters DTO
- [ ] Implement caching for dictionaries
- [ ] Add error handling for API failures
- [ ] Test hh.ru API integration

**Frontend:**
- [ ] Create SearchBar component with debounce
- [ ] Implement FilterPanel with Material-UI
- [ ] Create VacancyCard and VacancyList components
- [ ] Set up React Query hooks (useVacancies)
- [ ] Add Pagination component
- [ ] Create Search page
- [ ] Implement loading states and skeletons
- [ ] Add empty states
- [ ] Test search with various filters

**Deliverable:** Working vacancy search with filters

---

### Sprint 3: Vacancy Details & Saving (Week 3)
**Backend:**
- [ ] Add GET /vacancies/:id endpoint
- [ ] Implement saved vacancies in User model
- [ ] Create endpoints for add/remove vacancy (addVacancy, removeVacancy methods)
- [ ] Add GET /users/me/vacancies endpoint (getSavedVacancies)
- [ ] Implement proper error handling

**Frontend:**
- [ ] Create VacancyDetail page
- [ ] Implement SaveButton with optimistic updates
- [ ] Create SavedVacancies page
- [ ] Set up React Query hooks for saving
- [ ] Add toast notifications
- [ ] Implement navigation between pages
- [ ] Add share functionality (optional)
- [ ] Responsive design for mobile

**Deliverable:** Users can view and save vacancies

---

### Sprint 4: Application Tracking (Week 4)
**Backend:**
- [x] Create VacancyProgress schema with status enum
- [x] Implement VacancyProgress module structure
- [ ] Implement VacancyProgress service (full CRUD)
- [ ] Implement VacancyProgress controller endpoints
- [ ] Add filtering by status
- [ ] Add statistics endpoint for dashboard
- [ ] Test all endpoints

**Frontend:**
- [ ] Create VacancyProgress page with tabs/filters (displays as "My Applications" to users)
- [ ] Implement VacancyProgressCard component
- [ ] Create VacancyProgressModal for editing
- [ ] Add StatusBadge with color coding
- [ ] Implement status change functionality
- [ ] Add notes functionality
- [ ] Create simple dashboard with statistics
- [ ] Add date filters and sorting

**Deliverable:** Complete application tracking system

---

### Sprint 5: Polish, Testing & Deployment (Week 5)
**Backend:**
- [ ] Add global exception filter
- [ ] Implement request logging
- [ ] Add compression middleware
- [ ] Set up proper CORS
- [ ] Write unit tests for services
- [ ] Write E2E tests for critical flows
- [ ] Performance optimization (indexes, caching)
- [ ] Security audit

**Frontend:**
- [ ] UI/UX improvements
- [ ] Add loading skeletons everywhere
- [ ] Implement dark mode (optional)
- [ ] Code splitting and lazy loading
- [ ] Bundle size optimization
- [ ] Write component tests
- [ ] Accessibility improvements
- [ ] Cross-browser testing

**Deployment:**
- [ ] Set up MongoDB Atlas
- [ ] Deploy backend (Railway/Render/Heroku)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)
- [ ] Configure HTTPS
- [ ] Test production deployment
- [ ] Set up monitoring (optional)

**Deliverable:** Production-ready application

---

### Post-MVP Features (Future Sprints)
- Resume upload and management
- Job recommendations algorithm
- Email notifications for new matches
- Application deadline reminders
- Chrome extension for quick save
- Company reviews integration
- Salary insights and analytics
- Interview preparation resources
- Calendar integration
- Team/collaborative features

---

## Environment Variables

### Backend `.env`
```bash
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://admin:password@localhost:27017/jobflow?authSource=admin
# Production (MongoDB Atlas):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobflow?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your-256-bit-secret-key-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-token-secret-different-from-jwt-secret
JWT_REFRESH_EXPIRES_IN=7d

# External APIs
HH_API_BASE_URL=https://api.hh.ru
HH_USER_AGENT=JobFlow/1.0 (your-email@example.com)

# Security
CORS_ORIGIN=http://localhost:5173
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# Optional: Redis (for caching)
# REDIS_URL=redis://localhost:6379
```

### Backend `.env.example`
```bash
NODE_ENV=development
PORT=3000
API_VERSION=v1
MONGODB_URI=mongodb://admin:password@localhost:27017/jobflow?authSource=admin
JWT_SECRET=change-me-to-a-secure-random-string-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-to-another-secure-random-string
JWT_REFRESH_EXPIRES_IN=7d
HH_API_BASE_URL=https://api.hh.ru
HH_USER_AGENT=JobFlow/1.0 (your-email@example.com)
CORS_ORIGIN=http://localhost:5173
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

### Frontend `.env`
```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=JobFlow
VITE_ENABLE_DEVTOOLS=true
```

### Frontend `.env.example`
```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=JobFlow
VITE_ENABLE_DEVTOOLS=true
```

### Docker Compose Configuration

Create `docker-compose.yml` in project root:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: jobflow-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: jobflow
    volumes:
      - mongodb_data:/data/db
    networks:
      - jobflow-network

  backend:
    build:
      context: ./jobflow-backend
      dockerfile: Dockerfile
    container_name: jobflow-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/jobflow?authSource=admin
    depends_on:
      - mongodb
    volumes:
      - ./jobflow-backend:/app
      - /app/node_modules
    networks:
      - jobflow-network

  frontend:
    build:
      context: ./jobflow-frontend
      dockerfile: Dockerfile
    container_name: jobflow-frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000/api/v1
    depends_on:
      - backend
    volumes:
      - ./jobflow-frontend:/app
      - /app/node_modules
    networks:
      - jobflow-network

volumes:
  mongodb_data:

networks:
  jobflow-network:
    driver: bridge
```

### Backend Dockerfile
```dockerfile
# jobflow-backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Frontend Dockerfile
```dockerfile
# jobflow-frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

---

## API Endpoints Summary

### Authentication
- POST /api/v1/auth/register
- POST /api/v1/auth/login

### Users
- GET /api/v1/users/me (profile)
- PUT /api/v1/users/me (update profile)
- GET /api/v1/users/me/vacancies (get saved vacancies)
- POST /api/v1/users/me/vacancies/:vacancyId (add vacancy)
- DELETE /api/v1/users/me/vacancies/:vacancyId (remove vacancy)

### Vacancies
- GET /api/v1/vacancies?text=&area=&salary=&page= (search)
- GET /api/v1/vacancies/:id (get details)
- GET /api/v1/vacancies/dictionaries

### VacancyProgress (Application Tracking)
- POST /api/vacancy-progress
- GET /api/vacancy-progress
- GET /api/vacancy-progress/:id
- PATCH /api/vacancy-progress/:id
- DELETE /api/vacancy-progress/:id
- GET /api/vacancy-progress/statistics

---

## Additional Resources

### hh.ru API Documentation
- Base URL: https://api.hh.ru
- No authentication required for basic vacancy search
- Rate limits: Check documentation for current limits
- Key endpoints:
  - GET /vacancies - Search vacancies
  - GET /vacancies/{id} - Get vacancy details
  - GET /areas - Get locations
  - GET /dictionaries - Get all dictionaries

### Useful Libraries
- **Backend:** helmet (security), compression (gzip), rate-limiter-flexible
- **Frontend:** date-fns (date formatting), react-icons, react-helmet (SEO)

---

## Modern Development Best Practices & Tips

### General Guidelines

1. **TypeScript First** - Use TypeScript for both frontend and backend. Define interfaces/types before implementing features.

2. **Backend Structure:**
   - Set up all schemas with proper indexes first
   - Implement DTOs for validation before controllers
   - Use NestJS dependency injection properly
   - Add Swagger documentation as you build
   - Test API endpoints with REST Client or Postman

3. **Frontend Structure:**
   - Define TypeScript types matching backend DTOs
   - Use React Query for all server state
   - Use Zustand for client-only state (UI, filters)
   - Implement loading/error states from the start
   - Use Vite's dev server with HMR for fast development

4. **Security from Day One:**
   - Never commit `.env` files
   - Use strong JWT secrets (generate with: `openssl rand -base64 32`)
   - Hash passwords with bcrypt (10+ rounds)
   - Implement rate limiting on auth endpoints
   - Validate ALL user input with class-validator/Yup
   - Sanitize HTML when displaying user content
   - Add helmet.js for security headers

5. **Error Handling:**
   - Create global exception filter in NestJS
   - Use custom error classes
   - Return consistent error structure
   - Log errors properly (consider Winston/Pino)
   - Show user-friendly error messages on frontend

6. **Testing Strategy:**
   - Write unit tests for business logic
   - Use Jest for both backend and frontend
   - Test critical paths (auth, application creation)
   - E2E tests for main user flows

7. **Performance:**
   - Index MongoDB fields used in queries
   - Cache hh.ru dictionaries (they rarely change)
   - Implement pagination properly (cursor-based for large datasets)
   - Use React Query's caching effectively
   - Lazy load routes with React.lazy()
   - Optimize bundle size (check with `vite-bundle-visualizer`)

8. **Git Workflow:**
   - Use conventional commits (feat:, fix:, docs:, etc.)
   - Create feature branches
   - Commit logical units of work
   - Write meaningful commit messages

9. **Testing hh.ru API:**
   - Test API directly with curl/Postman first
   - Understand response structure before creating schemas
   - Check rate limits and implement backoff
   - Handle API errors gracefully
   - Cache responses when appropriate

10. **Development Order:**
    - ✅ Backend initialized
    - → Set up database schemas with indexes
    - → Implement auth system (most critical)
    - → Create basic CRUD endpoints
    - → Initialize frontend with Vite
    - → Implement auth UI and routing
    - → Build search functionality (backend + frontend together)
    - → Add vacancy details and saving
    - → Implement application tracking
    - → Polish UI/UX
    - → Add advanced features
    - → Testing and optimization
    - → Deployment

### Code Quality Tools

**Backend:**
```bash
# ESLint + Prettier (already configured)
npm run lint
npm run format

# TypeScript checking
npm run build

# Tests
npm run test
npm run test:e2e
npm run test:cov
```

**Frontend:**
```bash
# Install dev tools
npm install -D eslint-plugin-react-hooks
npm install -D @typescript-eslint/eslint-plugin
npm install -D prettier

# Add to package.json scripts:
"lint": "eslint src --ext ts,tsx",
"format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
"type-check": "tsc --noEmit"
```

### Useful VS Code Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Thunder Client (API testing)
- MongoDB for VS Code
- GitLens
- Error Lens

### Documentation Resources
- NestJS: https://docs.nestjs.com
- React Query: https://tanstack.com/query/latest
- Material-UI: https://mui.com
- Mongoose: https://mongoosejs.com
- hh.ru API: https://api.hh.ru/openapi/redoc
- Vite: https://vitejs.dev

---

## Minimal Viable Product (MVP) Checklist

Essential features to launch:
- [ ] User registration and login
- [ ] Search vacancies by text query
- [ ] Display search results with pagination
- [ ] View full vacancy details
- [ ] Save/unsave vacancies
- [ ] View saved vacancies list
- [ ] Basic user profile
- [ ] Responsive design for mobile

Nice-to-have for MVP:
- [ ] Advanced filters (salary, location, experience)
- [ ] Application tracking with status
- [ ] Dashboard with statistics
- [ ] Email notifications

Post-MVP features:
- [ ] Resume upload and management
- [ ] Job recommendations based on profile
- [ ] Application deadline reminders
- [ ] Company reviews integration
- [ ] Salary insights and analytics

---

## Success Metrics

- Successfully integrate with hh.ru API
- User can search and find relevant vacancies
- Authentication works reliably
- Application state is persisted correctly
- Responsive UI works on mobile devices
- No console errors in production
- Fast load times (<3 seconds)

---

**This plan is ready to be used with Claude Code. Start with Phase 1, Task 1.1 and proceed sequentially. Each task is designed to be actionable and specific.**
