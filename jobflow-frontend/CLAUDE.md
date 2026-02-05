# JobFlow Frontend - Development Guide

This file provides frontend-specific conventions and implementation details for Claude Code when working with the React frontend.

## 📂 Project Structure

```
jobflow-frontend/
├── src/
│   ├── pages/                   # Route components
│   │   ├── Home.tsx            # Landing page
│   │   ├── Login.tsx           # Login form (Formik + Yup)
│   │   ├── Register.tsx        # Registration form
│   │   ├── Search.tsx          # Main search with filters
│   │   ├── VacancyDetail.tsx   # Detail page (placeholder)
│   │   ├── SavedVacancies.tsx  # Saved list (placeholder)
│   │   ├── VacancyProgress.tsx # Application tracking (placeholder)
│   │   └── Profile.tsx         # User profile (placeholder)
│   ├── components/
│   │   ├── layout/             # Header, Footer, Layout, ProtectedRoute
│   │   ├── features/           # VacancyList, VacancyCard, FilterPanel
│   │   └── common/             # SearchBar, Pagination, LoadingSpinner, ErrorDisplay
│   ├── hooks/                  # Custom React Query hooks
│   │   ├── useAuth.ts          # Login, register, logout
│   │   ├── useVacancies.ts     # Search, saved, add, remove
│   │   ├── useUser.ts          # Profile CRUD
│   │   ├── useVacancyProgress.ts  # Application tracking
│   │   └── useDebounce.ts      # Debounce utility
│   ├── services/               # API clients
│   │   ├── authService.ts
│   │   ├── vacancyService.ts
│   │   ├── userService.ts
│   │   └── vacancyProgressService.ts
│   ├── store/                  # Zustand stores
│   │   ├── authStore.ts        # Auth state + persistence
│   │   └── searchStore.ts      # Search filters (not currently used)
│   ├── config/
│   │   ├── api.ts              # Axios client with interceptors
│   │   └── queryClient.ts      # React Query configuration
│   ├── types/                  # TypeScript interfaces
│   │   ├── vacancy.ts
│   │   ├── vacancyProgress.ts
│   │   └── user.ts
│   ├── App.tsx                 # Router + theme setup
│   └── main.tsx                # Entry point with providers
├── .env                        # Environment variables
└── package.json
```

## 🎯 Architecture Patterns

### State Management Strategy

**Zustand**: Auth state (persisted to localStorage)
```typescript
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (accessToken, refreshToken, user) => set({...}),
      logout: () => set({...}),
      updateTokens: (accessToken, refreshToken) => set({...}),
      updateUser: (userData) => set({...})
    }),
    { name: 'auth-storage' }
  )
);
```

**React Query**: Server state (vacancies, user data, applications)
- 5-minute stale time for queries
- 1 retry for queries, 0 retries for mutations
- Query key factory pattern for cache management

### Authentication Flow

**Complete Token Refresh Flow**:
1. Request interceptor adds `Authorization: Bearer {accessToken}` header
2. On 401 response:
   - Check `isRefreshing` flag (prevent race conditions)
   - If not refreshing, call `/auth/refresh` with refresh token
   - Queue failed requests during refresh
   - Update tokens in localStorage
   - Retry original request with new token
   - Process queued requests
3. On refresh failure, redirect to `/login`

**Implementation** (api.ts):
```typescript
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const { data } = await refreshTokenApi();
        // Update tokens
        useAuthStore.getState().updateTokens(data.accessToken, data.refreshToken);
        // Process queue
        failedQueue.forEach(({ resolve }) => resolve(api(originalRequest)));
        failedQueue = [];
        return api(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

**IMPORTANT**: Backend wraps responses in `{ data: {...} }` due to TransformInterceptor.
Frontend must access `response.data.data` instead of `response.data`.

### Protected Routes

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

**Usage in App.tsx**:
```typescript
<Route path="/saved" element={<ProtectedRoute><SavedVacancies /></ProtectedRoute>} />
```

## 🛣️ Routing Structure

**Public Routes**:
- `/` - Home (landing page)
- `/search` - Vacancy search with filters
- `/vacancy/:id` - Vacancy detail (placeholder)
- `/login` - Login form
- `/register` - Registration form

**Protected Routes** (require authentication):
- `/saved` - Saved vacancies list (placeholder)
- `/vacancy-progress` - Application tracking (placeholder)
- `/profile` - User profile management (placeholder)

**Layout**: All routes wrapped in `<Layout>` component with Header, main content area, Footer.

## 📡 API Integration

### Service Functions

**Auth Service** (authService.ts):
```typescript
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// IMPORTANT: Backend wraps responses in { data: {...} }
// Must access response.data.data instead of response.data

export const register = async (dto: RegisterDto): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', dto);
  return response.data.data; // Unwrap TransformInterceptor wrapper
};

export const login = async (dto: LoginDto): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', dto);
  return response.data.data;
};

export const logout = async (): Promise<void> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  await api.post('/auth/logout', null, {
    headers: { Authorization: `Bearer ${refreshToken}` }
  });
};

export const refreshToken = async (): Promise<AuthResponse> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  const response = await api.post('/auth/refresh', null, {
    headers: { Authorization: `Bearer ${refreshToken}` }
  });
  return response.data.data;
};
```

**Vacancy Service** (vacancyService.ts):
```typescript
export const searchVacancies = async (
  params: VacancySearchParams
): Promise<PaginatedResponse<Vacancy>> => {
  const response = await api.get('/vacancies/search', { params });
  return response.data.data;
};

export const fetchSavedVacancies = async (): Promise<Vacancy[]> => {
  const response = await api.get('/users/me/vacancies');
  return response.data.data;
};

export const addVacancy = async (vacancyId: string): Promise<void> => {
  await api.post(`/users/me/vacancies/${vacancyId}`);
};

export const removeVacancy = async (vacancyId: string): Promise<void> => {
  await api.delete(`/users/me/vacancies/${vacancyId}`);
};
```

### React Query Hooks

**Query Key Factory Pattern**:
```typescript
export const vacancyKeys = {
  all: ['vacancies'] as const,
  lists: () => [...vacancyKeys.all, 'list'] as const,
  list: (params: VacancySearchParams) => [...vacancyKeys.lists(), params] as const,
  details: () => [...vacancyKeys.all, 'detail'] as const,
  detail: (id: string) => [...vacancyKeys.details(), id] as const,
  saved: () => [...vacancyKeys.all, 'saved'] as const,
};
```

**Custom Hooks** (useVacancies.ts):
```typescript
export const useVacancySearch = (params: VacancySearchParams) => {
  return useQuery({
    queryKey: vacancyKeys.list(params),
    queryFn: () => searchVacancies(params),
  });
};

export const useAddVacancy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addVacancy,
    onSuccess: () => {
      // Invalidate saved vacancies cache
      queryClient.invalidateQueries({ queryKey: vacancyKeys.saved() });
    },
  });
};
```

## 🎨 UI Components

### Component Conventions

**Memoization**: Use `React.memo()` for list items and cards
```typescript
export const VacancyCard = React.memo(({ vacancy, isSaved, onSaveToggle }: Props) => {
  // Component implementation
});
```

**Loading States**: Use MUI `CircularProgress` or `LoadingSpinner` component
**Error States**: Use `ErrorDisplay` component with optional retry button
**Empty States**: Display meaningful messages with icon

### Form Handling (Formik + Yup)

**Pattern for all forms**:
```typescript
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain lowercase letter')
    .matches(/[A-Z]/, 'Must contain uppercase letter')
    .matches(/\d/, 'Must contain number')
    .required('Password is required'),
});

<Formik
  initialValues={{ email: '', password: '' }}
  validationSchema={validationSchema}
  onSubmit={handleSubmit}
>
  {({ errors, touched, isSubmitting }) => (
    <Form>
      <Field name="email">
        {({ field }) => (
          <TextField
            {...field}
            error={touched.email && Boolean(errors.email)}
            helperText={touched.email && errors.email}
            disabled={isSubmitting}
          />
        )}
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <CircularProgress size={24} /> : 'Submit'}
      </Button>
    </Form>
  )}
</Formik>
```

**Validation Rules** (must match backend):
- Email: valid format, required
- Password: min 8 chars, uppercase + lowercase + number
- First/Last name: min 2 chars, required
- Confirm password: must match password field

### Responsive Design

**Breakpoints** (MUI theme):
- `xs`: 0px+ (mobile)
- `sm`: 600px+ (tablet portrait)
- `md`: 900px+ (tablet landscape)
- `lg`: 1200px+ (desktop)
- `xl`: 1536px+ (large desktop)

**Common Patterns**:
```typescript
// Grid columns
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>
    <VacancyCard />
  </Grid>
</Grid>

// Responsive drawer (mobile vs desktop)
const isMobile = useMediaQuery(theme.breakpoints.down('md'));

{isMobile ? (
  <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
    <FilterPanel />
  </Drawer>
) : (
  <Box sx={{ width: 280 }}>
    <FilterPanel />
  </Box>
)}
```

## 🔧 Key Conventions

### Naming Patterns

**Saved Vacancies API** (must match backend):
- Service: `fetchSavedVacancies()`, `addVacancy()`, `removeVacancy()`
- Hooks: `useSavedVacancies()`, `useAddVacancy()`, `useRemoveVacancy()`
- Endpoints: `GET /users/me/vacancies`, `POST /users/me/vacancies/:id`, `DELETE /users/me/vacancies/:id`

**VacancyProgress (NOT "Application")**:
- Always use `VacancyProgress` in code (files, types, hooks, services)
- UI text can display "Applications" or "My Applications" for user-facing labels
- Avoids confusion with "app" or "application" referring to the software

### TypeScript Conventions

**Strict Mode**: Enabled
- No implicit any
- Strict null checks
- Strict function types

**Interface Naming**:
```typescript
// DTOs (match backend)
interface RegisterDto { }
interface LoginDto { }
interface UpdateUserDto { }

// Responses
interface AuthResponse { }
interface PaginatedResponse<T> { }

// Domain models
interface User { }
interface Vacancy { }
interface VacancyProgress { }
```

### File Naming

- Components: PascalCase (`VacancyCard.tsx`)
- Services: camelCase (`authService.ts`)
- Hooks: camelCase (`useVacancies.ts`)
- Stores: camelCase (`authStore.ts`)
- Types: camelCase (`vacancy.ts`)

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 3001)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Type check
npm run type-check
```

## 🎨 Theme Configuration

```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' }, // Blue
    secondary: { main: '#dc004e' }, // Pink
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' } // No uppercase buttons
      }
    }
  }
});
```

## 🔐 Environment Variables

**.env file**:
```bash
VITE_API_BASE_URL=/api/v1
```

**Usage in code**:
```typescript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
```

## 📝 Common Patterns

### Logout Flow
```typescript
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      // Clear auth state and cache regardless of API success
      useAuthStore.getState().logout();
      queryClient.clear();
      window.location.href = '/login';
    },
  });
};
```

### Search with Debouncing
```typescript
const [searchText, setSearchText] = useState('');
const debouncedSearchText = useDebounce(searchText, 500);

const { data, isLoading } = useVacancySearch({
  query: debouncedSearchText,
  page,
  limit: 20
});
```

### Pagination
```typescript
const handlePageChange = (event: unknown, newPage: number) => {
  setPage(newPage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

<Pagination
  count={Math.ceil(total / limit)}
  page={page}
  onChange={handlePageChange}
  showFirstButton
  showLastButton
/>
```

## 🐛 Common Issues

### Issue: API returns 401 for authenticated requests
**Cause**: Access token expired, refresh flow not working
**Solution**: Check token refresh interceptor, ensure refresh token is stored

### Issue: Data not updating after mutation
**Cause**: React Query cache not invalidated
**Solution**: Add `onSuccess` to mutation with `queryClient.invalidateQueries()`

### Issue: Protected route not redirecting
**Cause**: `isAuthenticated` not updated in Zustand store
**Solution**: Verify `login()` sets `isAuthenticated: true`

### Issue: Form validation not matching backend
**Cause**: Yup schema differs from backend DTOs
**Solution**: Ensure Yup validation matches backend class-validator rules

### Issue: Response data structure incorrect
**Cause**: Backend wraps responses in `{ data: {...} }` via TransformInterceptor
**Solution**: Access `response.data.data` instead of `response.data`

---

**For full-stack conventions and root-level commands, refer to `/CLAUDE.md` in the project root.**
