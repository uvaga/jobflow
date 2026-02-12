# JobFlow Frontend - Architecture & Conventions

This document provides detailed guidance for working with the JobFlow frontend application.

## 📁 Project Structure

```
jobflow-frontend/
├── src/
│   ├── assets/              # Static assets (images, icons, etc.)
│   ├── components/          # React components
│   │   ├── common/         # Reusable UI components
│   │   ├── features/       # Feature-specific components
│   │   └── layout/         # Layout components (Header, Footer, etc.)
│   ├── config/             # Configuration files
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components (route endpoints)
│   ├── services/           # API service layers
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions (currently empty)
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── .env.example            # Environment variable template
```

## 🎨 Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Core** | React | 19.2.0 | UI library |
| **Build Tool** | Vite | 7.2.4 | Fast dev server and bundler |
| **Language** | TypeScript | 5.9.3 | Type safety |
| **Routing** | React Router | 7.13.0 | Client-side routing |
| **State** | Zustand | 5.0.11 | Global state (auth) |
| **Server State** | React Query | 5.90.20 | Server state & caching |
| **HTTP Client** | Axios | 1.13.4 | API requests |
| **UI Framework** | Material-UI | 7.3.7 | Component library |
| **Forms** | Formik | 2.4.9 | Form management |
| **Validation** | Yup | 1.7.1 | Schema validation |
| **Date Utils** | date-fns | 4.1.0 | Date formatting |

## 🏗️ Architecture Patterns

### State Management Strategy

**Zustand (Global State)**
- **Purpose**: Client-side authentication state only
- **Persistence**: localStorage via persist middleware
- **Location**: `src/store/authStore.ts`
- **State Structure**:
  ```typescript
  {
    user: User | null,
    accessToken: string | null,
    refreshToken: string | null,
    isAuthenticated: boolean
  }
  ```
- **Actions**: `login()`, `logout()`, `updateTokens()`, `updateUser()`

**React Query (Server State)**
- **Purpose**: All server data fetching, caching, and synchronization
- **Configuration**: `src/config/queryClient.ts`
- **Cache Settings**:
  - `staleTime`: 5 minutes (queries), 0 (mutations)
  - `retry`: 1 (queries), 0 (mutations)
  - `refetchOnWindowFocus`: false
- **Query Key Factory Pattern**: Each hook file exports query keys
  ```typescript
  export const vacancyKeys = {
    all: ['vacancies'] as const,
    lists: () => [...vacancyKeys.all, 'list'] as const,
    list: (params: Params) => [...vacancyKeys.lists(), params] as const,
    details: () => [...vacancyKeys.all, 'detail'] as const,
    detail: (id: string) => [...vacancyKeys.details(), id] as const,
  };
  ```

### API Communication

**Axios Client** (`src/config/api.ts`)
- **Base URL**: `/api/v1` (proxied to backend via Vite)
- **Timeout**: 10 seconds
- **Credentials**: `withCredentials: true`

**Request Interceptor**:
- Automatically adds `Authorization: Bearer {accessToken}` header
- Reads token from localStorage

**Response Interceptor** (Token Refresh Flow):
1. Detects 401 errors (token expired)
2. Sets `isRefreshing` flag to prevent race conditions
3. Queues concurrent requests in `failedQueue`
4. Calls `/auth/refresh` with refreshToken
5. Updates both tokens in localStorage
6. Retries original request with new token
7. Processes queued requests
8. On refresh failure: clears tokens, redirects to `/login`

**Important**: Backend wraps all responses in `{ data: {...} }` via TransformInterceptor.
- Services must access `response.data.data` for nested unwrapping
- Exception: Some endpoints have custom wrappers (e.g., `response.data.vacancies`)

### Form Handling Pattern

All forms use **Formik + Yup** for consistency:

```typescript
// 1. Define validation schema
const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
});

// 2. Initial values
const initialValues = { email: '', password: '' };

// 3. Submit handler
const handleSubmit = useCallback(async (values: FormValues) => {
  try {
    const response = await apiCall(values);
    // Handle success
  } catch (error) {
    // Handle error
  }
}, [dependencies]);

// 4. Formik component
<Formik
  initialValues={initialValues}
  validationSchema={loginSchema}
  onSubmit={handleSubmit}
>
  {({ isSubmitting }) => (
    <Form>
      <FormTextField name="email" label="Email" type="email" />
      <Button type="submit" disabled={isSubmitting}>
        Submit
      </Button>
    </Form>
  )}
</Formik>
```

**FormTextField Component** (`src/components/common/FormTextField.tsx`):
- Wraps MUI TextField with Formik field bindings
- Automatic error display from Formik context
- Usage: `<FormTextField name="fieldName" label="Label" />`

## 🛣️ Routing Structure

**Route Configuration** (`src/App.tsx`)

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | Home | Public | Landing page |
| `/search` | Search | Public | Vacancy search (save button requires auth) |
| `/vacancy/:id` | VacancyDetail | Public | Vacancy details page |
| `/login` | Login | Public | User login |
| `/register` | Register | Public | User registration |
| `/vacancies` | SavedVacancies | Protected | User's saved vacancies (filterable, sortable) |
| `/vacancies/:id` | SavedVacancyDetail | Protected | Saved vacancy detail with progress management |
| `/vacancy-progress` | VacancyProgress | Protected | Job application tracking |
| `/profile` | Profile | Protected | User profile management |
| `/test-components` | ComponentTest | Public | Component testing page (dev) |

**Protected Routes** (`src/components/layout/ProtectedRoute.tsx`):
- Wraps protected routes with authentication check
- Redirects to `/login` if not authenticated
- Preserves intended location via `location.state.from`
- After login, redirects back to originally requested page

**Navigation Structure**:
```tsx
<Route path="/" element={<Layout />}>
  {/* Public routes */}
  <Route index element={<Home />} />
  <Route path="search" element={<Search />} />

  {/* Protected routes (wrapped with ProtectedRoute) */}
  <Route element={<ProtectedRoute />}>
    <Route path="vacancies" element={<SavedVacancies />} />
    <Route path="vacancies/:id" element={<SavedVacancyDetail />} />
    <Route path="vacancy-progress" element={<VacancyProgress />} />
  </Route>
</Route>
```

## 🧩 Component Architecture

### Layout Components (`src/components/layout/`)

**Layout.tsx**
- Root layout wrapper with flex column (sticky header, flex content, footer)
- Uses React Router `<Outlet />` for nested routes

**Header.tsx**
- Sticky app bar with navigation
- **Public Navigation**: "Search Jobs"
- **Authenticated Navigation**: "Search Jobs", "Saved", "Applications"
- **User Menu** (authenticated):
  - User name display
  - Profile link
  - Logout button
- **Guest Buttons** (not authenticated): "Login", "Sign Up"

**Footer.tsx**
- Page footer with copyright/links

**ProtectedRoute.tsx**
- Authentication guard for protected routes
- Redirects to login with location state preservation

### Common Components (`src/components/common/`)

**LoadingSpinner** - Centered Material-UI CircularProgress
**ErrorDisplay** - MUI Alert for error messages
**EmptyState** - Empty state placeholder with icon and message
**SearchBar** - Debounced search input with clear button
- **Key Feature**: Manages its own internal state for instant UI feedback
- **Debounce**: 300ms (configurable via `debounceMs` prop)
- **Performance**: Prevents parent re-renders during typing
- **Props**: `value`, `onChange`, `onSubmit`, `placeholder`, `disabled`, `debounceMs`

**Pagination** - MUI Pagination component wrapper
- Converts between 0-indexed API and 1-indexed UI
- Props: `page` (1-indexed), `totalPages`, `onChange`, `disabled`

**FormTextField** - Formik-integrated MUI TextField
- Auto-binds to Formik field context
- Shows validation errors automatically
- Props: `name`, `label`, `type`, `disabled`

### Feature Components (`src/components/features/`)

**VacancyCard**
- Displays single vacancy with employer logo, title, salary, location
- Optional save/unsave button (authenticated users only)
- Optional click handler for navigation
- Optional progress status chip and saved date display
- Props: `vacancy`, `onClick`, `showSaveButton`, `isSaved`, `onSave`, `hhId?`, `progressStatus?`, `savedDate?`

**ProgressStatusChip**
- Maps VacancyProgressStatus to colored MUI Chip components
- Colors: saved=grey, applied=blue, interview=orange, completed=info, rejected=red, offer=green, accepted=green, withdrawn=grey
- Props: `status` (VacancyProgressStatus)

**VacancyList**
- Renders grid of VacancyCard components (1/2/3 columns responsive)
- Wrapped with `React.memo` for performance
- Handles loading, error, and empty states
- Props: `vacancies`, `isLoading`, `error`, `onVacancyClick`, `onSave`, `showSaveButton`

**FilterPanel**
- Collapsible filter accordion with dynamic filter options
- **Data Sources**: Fetches dictionaries from hh.ru API via React Query
- **Filter Categories**:
  - **Location** (cascading): Country → Region → City
  - **Salary**: Minimum salary input + "Only with salary" checkbox
  - **Experience**: Employment experience level
  - **Schedule**: Work schedule type (full-time, remote, etc.)
  - **Employment**: Employment type (full/part-time, project, etc.)
  - **Professional Role**: Job role/specialization
  - **Industry**: Industry sector
- **Active Filter Count**: Shows badge with number of active filters
- **Actions**: "Apply Filters", "Clear All"
- Wrapped with `React.memo` for performance (prevents re-renders)

## 📄 Page Implementations

### Implemented Pages

**Home** (`src/pages/Home.tsx`)
- Landing page with hero section
- Links to search and authentication

**Login** (`src/pages/Login.tsx`)
- Formik form with email/password validation
- Error display for failed login
- Redirects to originally requested page after login (via `location.state.from`)
- Link to registration page

**Register** (`src/pages/Register.tsx`)
- Formik form with firstName, lastName, email, password
- Validation: email format, password strength (min 8 chars, uppercase + lowercase + number)
- Auto-login after successful registration
- Redirects to search page

**Search** (`src/pages/Search.tsx`) ⭐ **Fully Implemented**
- **Public Access**: Anyone can search and view results
- **Authenticated Features**: Save button only visible when logged in
- **State Management**: URL-driven (all filters in query params)
- **Components**:
  - SearchBar with 300ms debounce (minimum 3 characters for API call)
  - FilterPanel (drawer on mobile, sidebar on desktop)
  - VacancyList with responsive grid (1/2/3 columns)
  - Pagination with smooth scroll to top
- **Performance Optimizations**:
  - SearchBar manages own state (instant typing feedback)
  - FilterPanel wrapped with React.memo
  - VacancyList wrapped with React.memo
  - `placeholderData` in React Query (keeps old data while fetching)
- **Data Flow**:
  1. URL search params → Parse to filters
  2. Filters → API call (hh.ru API via backend proxy)
  3. Results → VacancyList rendering
  4. User interaction → Update URL → Re-fetch
- **Features**:
  - Real-time search with debouncing
  - Full filtering capabilities
  - Pagination (1-indexed UI, 0-indexed API)
  - Save/unsave vacancies (authenticated users)
  - Responsive design (mobile drawer, desktop sidebar)

**VacancyDetail** (`src/pages/VacancyDetail.tsx`)
- Public page showing vacancy from hh.ru API (via backend cache)
- Uses `useVacancy(id)` hook
- Save/unsave button for authenticated users
- Full description with HTML rendering, salary, location, employer info

**SavedVacancies** (`src/pages/SavedVacancies.tsx`) **Fully Implemented**
- Protected route showing user's saved vacancies from MongoDB
- **URL-driven state** via `useSearchParams` (same pattern as Search page)
- **Filters**: Progress status dropdown (8 statuses + "All")
- **Sort**: By saved date (newest/oldest) or name (A-Z/Z-A)
- **Pagination** with smooth scroll to top
- Uses `useSavedVacancies(params)` hook
- VacancyCard grid with ProgressStatusChip and saved date
- Click navigates to `/vacancies/:hhId` (saved vacancy detail)
- Loading skeletons, error/empty states

**SavedVacancyDetail** (`src/pages/SavedVacancyDetail.tsx`) **Fully Implemented**
- Protected route showing saved vacancy detail from MongoDB
- Uses `useSavedVacancyDetail(hhId)` hook
- **Sections**: Header (status chip, employer, salary, location, work format), Action buttons, Dates, Progress, Key Skills, Description, Additional Info
- **Progress management**: Status update dropdown, progress history timeline
- **Actions**: View on hh.ru, Refresh from hh.ru, Remove from Saved
- **Dates**: Saved date, Last updated, Published

### Placeholder Pages

**VacancyProgress** (`src/pages/VacancyProgress.tsx`)
- Protected route (authentication required)
- Should display job application tracking dashboard
- **TODO**: Implement with useVacancyProgress hook + status filters

**Profile** (`src/pages/Profile.tsx`)
- Protected route (authentication required)
- Should allow editing firstName, lastName, email
- **TODO**: Implement with useProfile + useUpdateProfile hooks

## 🪝 Custom Hooks

### Authentication Hooks (`src/hooks/useAuth.ts`)

**useLogin()**
- Mutation for user login
- Auto-updates auth store and redirects to `/search`
- Usage:
  ```typescript
  const loginMutation = useLogin();
  loginMutation.mutate({ email, password });
  ```

**useRegister()**
- Mutation for user registration
- Auto-updates auth store and redirects to `/search`
- Usage:
  ```typescript
  const registerMutation = useRegister();
  registerMutation.mutate({ email, password, firstName, lastName });
  ```

**useLogout()**
- Mutation for user logout
- Clears auth store, React Query cache, redirects to `/login`
- Calls backend API to invalidate refresh token
- Usage:
  ```typescript
  const logoutMutation = useLogout();
  logoutMutation.mutate();
  ```

### Vacancy Hooks (`src/hooks/useVacancies.ts`)

**useVacancy(id, enabled)**
- Query for single vacancy by ID
- Returns: `{ data, isLoading, error }`
- Caches for 5 minutes

**useVacancySearch(params, enabled)**
- Query for vacancy search with filters and pagination
- Returns: `PaginatedResponse<Vacancy>`
- Uses `placeholderData` to keep old data during loading

**useSavedVacancies(params?, enabled?)**
- Query for user's saved vacancies (requires authentication)
- Accepts `SavedVacanciesParams` for filtering (status), sorting (savedDate/name), pagination
- Returns: `SavedVacanciesResponse` `{ items: SavedVacancyEntry[], total, page, limit, totalPages }`
- Caches for 2 minutes

**useSavedVacancyDetail(hhId, enabled?)**
- Query for single saved vacancy detail by hh.ru ID
- Returns: `SavedVacancyEntry` `{ vacancy: Vacancy, progress: ProgressEntry[] }`
- Usage: `useSavedVacancyDetail('130401268')`

**useAddVacancy()**
- Mutation to save vacancy (backend fetches from hh.ru and stores permanently)
- Auto-invalidates saved vacancies cache, shows toast notification
- Usage: `addVacancy.mutate(hhId)`

**useRemoveVacancy()**
- Mutation to remove vacancy from saved list
- Auto-invalidates saved vacancies cache, shows toast notification
- Usage: `removeVacancy.mutate(hhId)`

**useRefreshSavedVacancy()**
- Mutation to re-fetch vacancy data from hh.ru API
- Auto-invalidates saved detail cache, shows toast notification
- Usage: `refreshVacancy.mutate(hhId)`

**useUpdateSavedVacancyProgress()**
- Mutation to update progress status (appends to progress history)
- Auto-invalidates saved list and detail caches, shows toast notification
- Usage: `updateProgress.mutate({ hhId, status: 'applied' })`

### HH.ru API Hooks (`src/hooks/useHhApi.ts`)

**useHhVacancySearch(params, enabled)**
- Search vacancies directly on hh.ru API
- Returns: `{ items, found, pages, page, per_page }`

**useHhVacancy(id, enabled)**
- Get single vacancy from hh.ru API
- Returns: Full vacancy details with description, skills, etc.

**useHhDictionaries(enabled)**
- Get filter dictionaries (employment, schedule, experience, currency)
- **Lazy-loaded**: Only fetches when `enabled=true`
- Cached for 1 hour
- Usage: `useHhDictionaries(expandedAccordions.has('experience'))`

**useHhCountries(enabled)**
- Get list of countries from hh.ru API
- **Lazy-loaded**: Fetches from `/areas/countries` endpoint (lightweight)
- Countries are top-level areas with basic info (id, name, url)
- Cached for 1 hour
- Returns: `HhAreaDetail[]`
- Usage: `useHhCountries(expandedAccordions.has('country'))`

**useHhRegionsByCountryId(countryId, enabled)**
- Get regions for a specific country
- **Lazy-loaded**: Fetches from `/areas/{countryId}` endpoint
- Only fetches when both `enabled=true` and `countryId` is provided
- Cached for 1 hour
- Returns: `HhAreaDetail[]` (regions only)
- Usage: `useHhRegionsByCountryId(selectedCountry, !!selectedCountry)`

**useHhCitiesByRegionId(regionId, enabled)**
- Get cities for a specific region
- **Lazy-loaded**: Fetches from `/areas/{regionId}` endpoint
- Only fetches when both `enabled=true` and `regionId` is provided
- Cached for 1 hour
- Returns: `HhAreaDetail[]` (cities only)
- Usage: `useHhCitiesByRegionId(selectedRegion, !!selectedRegion)`

**useHhProfessionalRoles(enabled)**
- Get flattened list of all professional roles
- **Lazy-loaded**: Only fetches when `enabled=true`
- Deduplicates and sorts alphabetically
- Cached for 1 hour
- Usage: `useHhProfessionalRoles(expandedAccordions.has('professionalRole'))`

**useHhIndustries(enabled)**
- Get flattened list of all industries
- **Lazy-loaded**: Only fetches when `enabled=true`
- Deduplicates and sorts alphabetically
- Cached for 1 hour
- Usage: `useHhIndustries(expandedAccordions.has('industry'))`

### User Hooks (`src/hooks/useUser.ts`)

**useProfile(enabled)**
- Query for current user profile
- Auto-enabled when authenticated
- Returns: `User`

**useUpdateProfile()**
- Mutation to update user profile
- Auto-updates auth store and invalidates cache
- Usage: `updateProfile.mutate({ firstName, lastName, email })`

### VacancyProgress Hooks (`src/hooks/useVacancyProgress.ts`)

**useVacancyProgress(filters, enabled)**
- Query for all vacancy progress records with optional filters
- Returns: `VacancyProgress[]`

**useVacancyProgressDetail(id, enabled)**
- Query for single vacancy progress record
- Returns: `VacancyProgress`

**useVacancyProgressStatistics(enabled)**
- Query for statistics (counts by status, recent activity)
- Returns: `VacancyProgressStatistics`

**useCreateVacancyProgress()**
- Mutation to create new vacancy progress record
- Auto-invalidates all vacancy progress queries
- Usage: `create.mutate({ vacancyId, status, notes, ... })`

**useUpdateVacancyProgress()**
- Mutation to update vacancy progress record
- Auto-invalidates specific item and all lists
- Usage: `update.mutate({ id, data: { status, notes, ... } })`

**useDeleteVacancyProgress()**
- Mutation to delete vacancy progress record
- Auto-invalidates all vacancy progress queries
- Usage: `deleteProgress.mutate(id)`

### Utility Hooks

**useDebounce(value, delay)** (`src/hooks/useDebounce.ts`)
- Delays updating value until user stops typing
- Default delay: 500ms
- Usage:
  ```typescript
  const [text, setText] = useState('');
  const debouncedText = useDebounce(text, 500);

  useEffect(() => {
    // API call with debouncedText
  }, [debouncedText]);
  ```

## 🔌 Service Layer

### Authentication Service (`src/services/authService.ts`)

```typescript
register(data: RegisterDto): Promise<AuthResponse>
login(data: LoginDto): Promise<AuthResponse>
logout(): Promise<void>
refreshToken(): Promise<AuthResponse>
```

**Response Format**:
```typescript
{
  accessToken: string,
  refreshToken: string,
  user: { _id, email, firstName, lastName }
}
```

### Vacancy Service (`src/services/vacancyService.ts`)

```typescript
fetchVacancy(id: string): Promise<Vacancy>
searchVacancies(params: VacancySearchParams): Promise<PaginatedResponse<Vacancy>>
fetchSavedVacancies(params?: SavedVacanciesParams): Promise<SavedVacanciesResponse>
fetchSavedVacancyDetail(hhId: string): Promise<SavedVacancyEntry>
addVacancy(hhId: string): Promise<void>
removeVacancy(hhId: string): Promise<void>
refreshSavedVacancy(hhId: string): Promise<Vacancy>
updateVacancyProgress(hhId: string, status: string): Promise<SavedVacancyEntry>
```

**Important**: All saved vacancy endpoints unwrap the TransformInterceptor wrapper:
```typescript
return (response.data as unknown as { data: T }).data;
```

### HH.ru API Service (`src/services/hhApiService.ts`)

**Direct hh.ru API Integration** (https://api.hh.ru)

```typescript
searchHhVacancies(params: HhSearchParams): Promise<HhSearchResponse>
getHhVacancy(id: string): Promise<HhVacancyDetail>
getHhDictionaries(): Promise<HhDictionaries>
getHhCountries(): Promise<HhAreaDetail[]>
getHhAreaById(id: string): Promise<HhAreaDetail>
getHhProfessionalRoles(): Promise<HhProfessionalRolesResponse>
getHhIndustries(): Promise<HhIndustriesResponse>
flattenProfessionalRoles(response): HhProfessionalRole[]
flattenIndustries(response): HhIndustryItem[]
```

**Cascading Location API Pattern**:
- `/areas/countries` → Lightweight country list
- `/areas/{countryId}` → Regions for selected country
- `/areas/{regionId}` → Cities for selected region

**Configuration**:
- Base URL: `https://api.hh.ru`
- Locale: `EN` (configurable via `VITE_HH_API_LOCALE`)
- Uses separate axios instance (not apiClient)

### User Service (`src/services/userService.ts`)

```typescript
getProfile(): Promise<User>
updateProfile(data: UpdateUserDto): Promise<User>
```

### VacancyProgress Service (`src/services/vacancyProgressService.ts`)

```typescript
getAll(filters?: VacancyProgressFilters): Promise<VacancyProgress[]>
getById(id: string): Promise<VacancyProgress>
create(data: CreateVacancyProgressDto): Promise<VacancyProgress>
update(id: string, data: UpdateVacancyProgressDto): Promise<VacancyProgress>
deleteVacancyProgress(id: string): Promise<void>
getStatistics(): Promise<VacancyProgressStatistics>
```

## 📦 Type Definitions

### API Types (`src/types/api.types.ts`)

```typescript
ApiResponse<T> { data: T, message?: string, statusCode: number }
ApiError { message: string, statusCode: number, error?: string, details?: Record }
PaginatedResponse<T> { data: T[], total: number, page: number, limit: number, totalPages: number }
```

### User Types (`src/types/user.ts`)

```typescript
User { id, email, firstName, lastName, createdAt?, updatedAt? }
LoginDto { email, password }
RegisterDto { email, password, firstName, lastName }
AuthResponse { accessToken, refreshToken?, user: User }
```

### Vacancy Types (`src/types/vacancy.ts`)

```typescript
Vacancy {
  _id: string,
  hhId: string,
  name: string,
  employer: { id, name, url?, logoUrls?, trusted, accreditedItEmployer? },
  salary?: { from?, to?, currency, gross? },
  area: { id, name, url },
  url: string,
  alternateUrl?: string,
  description: string,
  schedule?: { id, name },
  experience?: { id, name },
  employment?: { id, name },
  keySkills?: [{ name: string }],
  professionalRoles?: [{ id, name }],
  address?: object,
  contacts?: object,
  workFormat?: [{ id, name }],
  workingHours?: [{ id, name }],
  workScheduleByDays?: [{ id, name }],
  acceptHandicapped?: boolean,
  acceptKids?: boolean,
  acceptTemporary?: boolean,
  acceptIncompleteResumes?: boolean,
  publishedAt: string,
  cacheExpiresAt?: string,  // Optional — absent for saved vacancies
  createdAt: string,
  updatedAt: string
}

ProgressEntry { status: VacancyProgressStatus, statusSetDate: string }
SavedVacancyEntry { vacancy: Vacancy, progress: ProgressEntry[] }
SavedVacanciesResponse { items: SavedVacancyEntry[], total, page, limit, totalPages }
```

### VacancyProgress Types (`src/types/vacancyProgress.ts`)

```typescript
VacancyProgressStatus = 'saved' | 'applied' | 'interview_scheduled' |
  'interview_completed' | 'rejected' | 'offer_received' |
  'offer_accepted' | 'withdrawn'

VacancyProgress {
  _id: string,
  userId: string,
  vacancyId: string,
  status: VacancyProgressStatus,
  notes?: string,
  appliedAt?: string,
  interviewDate?: string,
  tags: string[],
  priority: number,
  createdAt: string,
  updatedAt: string
}
```

## 🎯 Key Conventions

### File Naming

- **Components**: PascalCase (e.g., `VacancyCard.tsx`, `SearchBar.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useVacancies.ts`, `useAuth.ts`)
- **Services**: camelCase with "Service" suffix (e.g., `authService.ts`, `vacancyService.ts`)
- **Types**: camelCase with ".types.ts" suffix (e.g., `api.types.ts`, `user.ts`)
- **Config**: camelCase (e.g., `api.ts`, `queryClient.ts`)

### Import Aliases

Vite configured with path alias: `@` → `./src`

```typescript
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/config/api';
import type { User } from '@/types';
```

### Component Export Pattern

**Default Exports** for components:
```typescript
export default function ComponentName() { ... }
```

**Named Exports** for utilities in barrel files (`index.ts`):
```typescript
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as ErrorDisplay } from './ErrorDisplay';
```

### TypeScript Patterns

**Interface vs Type**:
- Use `interface` for object shapes (extendable)
- Use `type` for unions, primitives, or complex types

**Props Typing**:
```typescript
interface ComponentProps {
  required: string;
  optional?: number;
  callback: (id: string) => void;
}

export default function Component({ required, optional, callback }: ComponentProps) { ... }
```

**React Query Generic Types**:
```typescript
useQuery<DataType, ErrorType>({ ... })
useMutation<ReturnType, ErrorType, VariablesType>({ ... })
```

### Performance Best Practices

**React.memo for Expensive Components**:
```typescript
const VacancyList = memo(function VacancyList({ vacancies }: Props) {
  // Component implementation
});
```

**useCallback for Stable References**:
```typescript
const handleClick = useCallback((id: string) => {
  navigate(`/vacancy/${id}`);
}, [navigate]);
```

**useMemo for Expensive Computations**:
```typescript
const savedVacancyIds = useMemo(() => {
  return new Set(savedVacancies.map(v => v.hhId));
}, [savedVacancies]);
```

**React Query Optimization**:
- Use `placeholderData` to keep old data during refetch
- Set appropriate `staleTime` to reduce unnecessary refetches
- Use query key factory pattern for cache invalidation
- **Lazy-loading**: Use `enabled` parameter to defer API calls until needed

**Lazy-Loading Pattern** (FilterPanel accordion tracking):
```typescript
// Track which accordions have been opened
const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

// Track expansion events
const handleAccordionChange = (name: string) => (_e, isExpanded: boolean) => {
  if (isExpanded) {
    setExpandedAccordions(prev => new Set(prev).add(name));
  }
};

// Load data only when accordion opened
const { data } = useHhCountries(expandedAccordions.has('country'));

// Apply to Accordion component
<Accordion onChange={handleAccordionChange('country')}>
```

### Search Input Performance Pattern

**Problem**: Controlled input causing lag when parent re-renders on every keystroke

**Solution** (implemented in SearchBar):
1. Component manages its own internal state for instant UI feedback
2. Debounce internal state before notifying parent
3. Parent receives updates only after debounce completes
4. Sibling components wrapped with React.memo to prevent re-renders

```typescript
// Internal state for instant typing feedback
const [localValue, setLocalValue] = useState(value);
const debouncedValue = useDebounce(localValue, 300);

// Sync with external value changes (e.g., URL navigation)
useEffect(() => {
  setLocalValue(value);
}, [value]);

// Notify parent only after debounce
useEffect(() => {
  if (debouncedValue !== value) {
    onChange(debouncedValue);
  }
}, [debouncedValue]);
```

## 🌐 Environment Variables

Create `.env` file from `.env.example`:

```bash
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Application Configuration
VITE_APP_NAME=JobFlow

# HH.ru API Configuration
VITE_HH_API_LOCALE=EN
VITE_HH_CACHE_HOURS=3
```

**Important**:
- All Vite env vars must be prefixed with `VITE_`
- Access in code: `import.meta.env.VITE_VAR_NAME`
- Default API URL: `/api/v1` (proxied to backend via Vite config)

## 🔄 App Workflow

### Application Initialization

1. **Entry Point** (`main.tsx`):
   - Cleanup old cache keys from localStorage
   - Wrap app with React.StrictMode
   - Wrap with QueryClientProvider (React Query)
   - Mount App component to `#root` div

2. **App Component** (`App.tsx`):
   - Create Material-UI theme
   - Wrap with ThemeProvider + CssBaseline
   - Setup BrowserRouter with route configuration
   - All routes nested under Layout component

3. **Layout Component**:
   - Renders Header (sticky) → Main content (Outlet) → Footer
   - Header displays different navigation based on auth state

### Authentication Flow

**Login**:
1. User submits login form (Formik validation)
2. `login()` service calls backend `/auth/login`
3. Backend returns `{ accessToken, refreshToken, user }`
4. Tokens stored in localStorage + Zustand auth store
5. User redirected to originally requested page (or `/search`)

**Token Refresh** (automatic on 401 errors):
1. API request receives 401 response
2. Response interceptor detects expired token
3. Sets `isRefreshing` flag, queues concurrent requests
4. Calls `/auth/refresh` with refreshToken
5. Updates tokens in localStorage
6. Retries original request with new accessToken
7. Processes queued requests
8. On failure: clears tokens, redirects to `/login`

**Logout**:
1. User clicks logout in Header menu
2. `logout()` service calls backend `/auth/logout` with refreshToken
3. Backend invalidates refresh token
4. Frontend clears tokens from localStorage + Zustand
5. React Query cache cleared
6. User redirected to `/login`

### Vacancy Search Flow

**Search Page** (`/search`):
1. Parse URL search params into filters object (single source of truth)
2. Extract search text from URL param `?text=...`
3. User types in SearchBar:
   - Characters appear instantly (internal state)
   - After 300ms debounce, parent notified
   - Parent updates URL with new search text
   - URL change triggers re-render with new filters
4. Minimum 3 characters required for API call
5. API call to hh.ru with search + filter params
6. Results displayed in responsive grid (1/2/3 columns)
7. User can filter (FilterPanel), paginate, or save vacancies

**Filter Application**:
1. User changes filter in FilterPanel
2. Filter state merged with existing filters
3. Page reset to 0
4. URL updated with new filter params
5. React Query detects URL change → refetch with new params
6. Results update automatically

**Pagination**:
1. User clicks page number
2. Page index updated in URL (converted from 1-indexed to 0-indexed)
3. Smooth scroll to top
4. React Query refetch with new page param
5. `placeholderData` keeps old results visible during loading

### Vacancy Saving Flow (Authenticated Users)

**Add to Saved**:
1. User clicks save icon on VacancyCard (from search results)
2. `useAddVacancy()` mutation calls backend `POST /users/me/vacancies/:hhId`
3. Backend fetches full vacancy from hh.ru API, stores permanently in MongoDB (no TTL)
4. Backend adds subdocument to user's `savedVacancies` array with initial progress `[{status: 'saved', statusSetDate: now}]`
5. React Query invalidates saved vacancies cache, toast shows "Vacancy saved"
6. UI updates to show filled save icon

**Remove from Saved**:
1. User clicks unsave icon on VacancyCard or "Remove from Saved" button on detail page
2. `useRemoveVacancy()` mutation calls backend `DELETE /users/me/vacancies/:hhId`
3. Backend removes subdocument from user's `savedVacancies` array
4. React Query invalidates cache, toast shows "Vacancy removed"
5. UI updates (list refreshes, detail page redirects to `/vacancies`)

**Update Progress**:
1. User selects new status from dropdown on SavedVacancyDetail page
2. `useUpdateSavedVacancyProgress()` mutation calls backend `PATCH /users/me/vacancies/:hhId/progress`
3. Backend appends new `{status, statusSetDate}` entry to progress array
4. React Query invalidates saved caches, toast shows "Progress updated"
5. Status chip updates, progress history shows new entry

**Refresh from hh.ru**:
1. User clicks "Refresh from hh.ru" button on SavedVacancyDetail page
2. `useRefreshSavedVacancy()` mutation calls backend `POST /users/me/vacancies/:hhId/refresh`
3. Backend fetches fresh data from hh.ru API, updates MongoDB document
4. React Query invalidates saved detail cache, toast shows "Vacancy refreshed"
5. Page displays updated vacancy data

### Protected Route Access

**Authenticated Access**:
1. User navigates to protected route (e.g., `/saved`)
2. ProtectedRoute checks `isAuthenticated` from Zustand
3. If authenticated, render route component
4. Component uses React Query hooks to fetch user-specific data

**Unauthenticated Access**:
1. User navigates to protected route
2. ProtectedRoute checks `isAuthenticated` → false
3. Save current location to `state.from`
4. Redirect to `/login`
5. After successful login, redirect back to `state.from`

## 🚀 Development Scripts

```bash
# Start development server (port 3001)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking (no emit)
npm run type-check

# Lint TypeScript/TSX files
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## 🧪 Testing Strategy

**Current State**: No test files yet

**Recommended Approach**:
- **Unit Tests**: Vitest for hooks and utility functions
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright (to match backend e2e pattern)

**Test Structure** (when implemented):
```
src/
├── components/
│   └── __tests__/
├── hooks/
│   └── __tests__/
└── services/
    └── __tests__/
```

## 🎨 Styling Approach

**Material-UI Theme** (`App.tsx`):
- Light mode palette
- Primary: `#1976d2` (blue)
- Secondary: `#dc004e` (pink)
- Custom font stack (system fonts)
- Button text transform disabled (textTransform: 'none')

**Global Styles** (`index.css`):
- CSS reset and normalization
- Base styles for body, html

**Component Styles**:
- MUI `sx` prop for component-level styling
- Responsive breakpoints: `xs`, `sm`, `md`, `lg`, `xl`
- Example:
  ```tsx
  <Box sx={{
    py: 3,
    px: { xs: 2, sm: 3, md: 4 },
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' }
  }}>
  ```

## 🐛 Common Issues & Solutions

### Issue: Search input feels laggy
**Cause**: Parent re-renders on every keystroke
**Solution**: SearchBar manages internal state + debounce, parent only receives debounced updates

### Issue: React Query not refetching after mutation
**Cause**: Cache not invalidated
**Solution**: Use `queryClient.invalidateQueries({ queryKey })` in mutation `onSuccess`

### Issue: API returning 401 even with valid token
**Cause**: Token expired, needs refresh
**Solution**: Response interceptor automatically handles refresh (check console for errors)

### Issue: Backend response structure mismatch
**Cause**: TransformInterceptor wrapping
**Solution**: Access `response.data.data` instead of `response.data` (or check specific endpoint format)

### Issue: Protected route redirects to login immediately after login
**Cause**: Token not persisted or auth state not updated
**Solution**: Check localStorage for tokens, verify Zustand persist middleware config

### Issue: Form validation not showing errors
**Cause**: FormTextField not connected to Formik context
**Solution**: Ensure FormTextField is inside `<Formik><Form>` wrapper

### Issue: Filters not updating URL
**Cause**: Not using setSearchParams correctly
**Solution**: Use `setSearchParams(buildUrlParams(text, filters), { replace: true })`

## 📚 Additional Resources

- [React 19 Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router v7](https://reactrouter.com/)
- [React Query (TanStack Query)](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Material-UI Documentation](https://mui.com/)
- [Formik Documentation](https://formik.org/)
- [Yup Validation](https://github.com/jquense/yup)
- [HH.ru API Documentation](https://github.com/hhru/api)

## 🎯 Next Steps for Implementation

1. **VacancyProgress Page**:
   - Fetch with `useVacancyProgress()` hook
   - Implement status filter tabs (Kanban-style?)
   - Add create/update/delete modals
   - Display statistics dashboard

2. **Profile Page**:
   - Fetch with `useProfile()` hook
   - Formik form with Yup validation
   - Update with `useUpdateProfile()` hook
   - Add password change functionality (backend support needed)

3. **Enhancements**:
   - Dark mode toggle
   - "Remember Me" checkbox on login
   - Password reset flow
   - Vacancy comparison feature
   - Export saved vacancies to PDF/CSV

---

**For root-level conventions and backend patterns, see:**
- Root: [`../CLAUDE.md`](../CLAUDE.md)
- Backend: [`../jobflow-backend/CLAUDE.md`](../jobflow-backend/CLAUDE.md)
