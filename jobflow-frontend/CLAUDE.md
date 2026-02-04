# JobFlow Frontend - React + Vite Conventions

This file provides frontend-specific guidance for the JobFlow React application.

## 📁 Project Structure

```
jobflow-frontend/
├── src/
│   ├── main.tsx                     # React entry point
│   ├── App.tsx                      # Root component with routing
│   ├── components/
│   │   ├── common/                  # Reusable components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorDisplay.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── features/                # Feature-specific components
│   │   │   ├── VacancyCard.tsx
│   │   │   ├── VacancyList.tsx
│   │   │   └── FilterPanel.tsx
│   │   ├── layout/                  # Layout components
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── VacancyProgress/         # Application tracking (NOT Applications/)
│   ├── pages/                       # Route-level components
│   │   ├── Home.tsx
│   │   ├── Search.tsx
│   │   ├── VacancyDetail.tsx
│   │   ├── SavedVacancies.tsx
│   │   ├── VacancyProgress.tsx      # (displays as "My Applications")
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Profile.tsx
│   ├── hooks/                       # Custom React hooks
│   │   └── useVacancies.ts
│   ├── services/                    # API service functions
│   │   └── vacancyService.ts
│   ├── store/                       # Zustand stores
│   │   └── authStore.ts
│   ├── types/                       # TypeScript types
│   │   ├── vacancy.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── config/                      # Configuration
│   │   ├── api.ts                   # Axios instance
│   │   └── queryClient.ts           # React Query config
│   └── utils/                       # Utility functions
├── public/                          # Static assets
├── .env                             # Environment variables (not in git)
├── .env.example                     # Environment template
├── vite.config.ts                   # Vite configuration
└── tsconfig.json                    # TypeScript configuration
```

## 🚀 Development Commands

```bash
npm run dev                # Development server (port 3001)
npm run build              # Production build
npm run preview            # Preview production build
npm run lint               # Run ESLint
npm run format             # Format with Prettier
```

## 🏗️ Architecture & Patterns

### State Management

**Server State** (data from API):
- Use TanStack React Query (v5)
- 5-minute stale time by default
- 1 retry on failure
- Query client configured in `src/config/queryClient.ts`

**Client State** (UI state, auth):
- Use Zustand for lightweight state
- Auth state in `src/store/authStore.ts`
- Persist auth with zustand/middleware

### API Communication

**Axios Configuration** (`src/config/api.ts`):
- Base URL: `/api/v1` (proxied to backend in dev)
- **Request interceptor**: Adds `Bearer` token from localStorage
- **Response interceptor**: Handles 401 (logout & redirect) and 403 (forbidden)

**Vite Proxy** (in `vite.config.ts`):
- All `/api` requests proxy to `http://localhost:3000` in development
- Change origin enabled for CORS

### Path Aliases

- `@/` resolves to `src/` directory
- Use `import { apiClient } from '@/config/api'` instead of relative paths
- Configured in `vite.config.ts` and `tsconfig.json`

## 📂 Directory Conventions

### Components Organization

**`components/common/`** - Reusable, generic components:
- LoadingSpinner, ErrorDisplay, SearchBar, Pagination, EmptyState
- Should not depend on specific business logic
- Can be used anywhere in the app

**`components/features/`** - Feature-specific components:
- VacancyCard, VacancyList, FilterPanel
- Related to specific features but reusable within that context

**`components/layout/`** - Layout structure components:
- Header, Footer, Layout, ProtectedRoute
- Define the app structure and navigation

**`components/VacancyProgress/`** - Application tracking components:
- VacancyProgressCard, VacancyProgressList, etc.
- **Important**: Directory is `VacancyProgress/`, NOT `Applications/`

**`pages/`** - Route-level page components:
- One component per route
- Compose smaller components from `components/`

**`hooks/`** - Custom React hooks:
- Reusable stateful logic
- React Query hooks for data fetching
- Example: `useVacancies.ts`, `useAuth.ts`

**`services/`** - API service functions:
- Pure functions that call the API
- Use `apiClient` from `@/config/api`
- Example: `vacancyService.ts`

**`store/`** - Zustand store definitions:
- Global client state
- Example: `authStore.ts`

**`types/`** - TypeScript type definitions:
- Interfaces and types
- Mirror backend DTOs where applicable
- Export from `types/index.ts`

**`utils/`** - Utility/helper functions:
- Pure functions with no side effects
- Date formatting, validation helpers, etc.

## 🎨 Component Best Practices

### React Patterns

**Memoization**:
- Use `memo()` for expensive list components
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for stable event handlers

**Data Fetching**:
- Always use React Query hooks for server data
- Handle loading, error, and success states
- Use query keys consistently (see `useVacancies.ts`)

**Forms**:
- Use Formik for form state management
- Use Yup for validation schemas
- Handle submission states properly

### Material-UI (MUI) Usage

- Import from `@mui/material` and `@mui/icons-material`
- Use MUI components for consistency
- Customize theme in `App.tsx` if needed
- Use `sx` prop for styling

## 🏷️ Naming Conventions

### VacancyProgress (NOT Application)

**In Code** (file names, components, routes, functions):
- ✅ `components/VacancyProgress/VacancyProgressCard.tsx`
- ✅ `pages/VacancyProgress.tsx`
- ✅ `services/vacancyProgressService.ts`
- ✅ Route path: `/vacancy-progress`
- ✅ Type interfaces: `VacancyProgress`, `VacancyProgressStatus`
- ✅ Hook names: `useVacancyProgress`, `useCreateVacancyProgress`

**In UI Text** (user-facing labels):
- ✅ Page titles: "My Applications"
- ✅ Button labels: "Track Application"
- ✅ Navigation menu: "Applications"
- ✅ Breadcrumbs: "Home > Applications"

### Saved Vacancies API Calls

**Service functions must match backend**:
- `fetchSavedVacancies()` → GET `/api/v1/users/me/vacancies`
- `addVacancy(vacancyId)` → POST `/api/v1/users/me/vacancies/:vacancyId`
- `removeVacancy(vacancyId)` → DELETE `/api/v1/users/me/vacancies/:vacancyId`

**React Query hooks**:
- `useSavedVacancies()` - Fetch saved vacancies
- `useAddVacancy()` - Mutation to add vacancy
- `useRemoveVacancy()` - Mutation to remove vacancy

## 📡 API Integration

### React Query Hooks Pattern

```typescript
// Query for fetching data
export function useVacancies(params: SearchParams) {
  return useQuery({
    queryKey: ['vacancies', params],
    queryFn: () => searchVacancies(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation for modifying data
export function useAddVacancy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addVacancy,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['savedVacancies'] });
    },
  });
}
```

### Query Keys Convention

Use hierarchical query keys for better cache management:

```typescript
export const vacancyKeys = {
  all: ['vacancies'] as const,
  lists: () => [...vacancyKeys.all, 'list'] as const,
  list: (params: SearchParams) => [...vacancyKeys.lists(), params] as const,
  details: () => [...vacancyKeys.all, 'detail'] as const,
  detail: (id: string) => [...vacancyKeys.details(), id] as const,
  saved: () => [...vacancyKeys.all, 'saved'] as const,
};
```

## 🌐 Environment Variables

```bash
VITE_API_BASE_URL=/api/v1
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## 🎯 TypeScript Best Practices

- Strict mode enabled
- Use interfaces for data structures
- Avoid `any` - use `unknown` if type is truly unknown
- Export types from `types/` directory
- Mirror backend DTOs where applicable

## 📝 Important Files

- `src/main.tsx` - React entry point with QueryClientProvider
- `src/App.tsx` - Root component with MUI ThemeProvider and routing
- `src/config/api.ts` - Axios instance with auth interceptors
- `src/config/queryClient.ts` - React Query configuration
- `vite.config.ts` - Vite configuration with proxy and path aliases

## 🧪 Testing

- Component tests with React Testing Library (future)
- Integration tests for user flows (future)
- Use Vitest as test runner (future)

## 🔍 Code Quality

```bash
npm run lint      # ESLint checks
npm run format    # Prettier formatting
```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Material-UI Documentation](https://mui.com)
- [Vite Documentation](https://vitejs.dev)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- Root [`CLAUDE.md`](../CLAUDE.md) for project overview
