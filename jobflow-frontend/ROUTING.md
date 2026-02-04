# JobFlow Frontend - Routing Structure

## Task 3.1: Setup Routing & Layout ✅ COMPLETED

This document describes the implemented routing structure for the JobFlow frontend application.

## Technology Stack

- **React Router v7** - Client-side routing
- **Material-UI v7** - UI components and theming
- **TanStack Query v5** - Server state management (configured in main.tsx)
- **Zustand** - Client state management (auth store)

## Route Structure

### Public Routes
- `/` - Home page (landing page with call-to-action)
- `/search` - Search vacancies (public access)
- `/vacancy/:id` - Vacancy detail page (public access)
- `/login` - User login
- `/register` - User registration

### Protected Routes (require authentication)
- `/saved` - Saved vacancies
- `/vacancy-progress` - Application tracking (displays as "My Applications")
- `/profile` - User profile management

## File Structure

```
src/
├── App.tsx                          # Main app with routing setup
├── main.tsx                         # Entry point with QueryClientProvider
├── components/
│   └── layout/
│       ├── Layout.tsx               # Main layout with Outlet
│       ├── Header.tsx               # Navigation bar with responsive menu
│       ├── Footer.tsx               # Footer with attribution
│       └── ProtectedRoute.tsx       # Authentication guard
├── pages/
│   ├── Home.tsx                     # Landing page
│   ├── Search.tsx                   # Search page (placeholder)
│   ├── VacancyDetail.tsx            # Vacancy details (placeholder)
│   ├── SavedVacancies.tsx           # Saved vacancies list (placeholder)
│   ├── VacancyProgress.tsx          # Application tracking (placeholder)
│   ├── Login.tsx                    # Login form (placeholder)
│   ├── Register.tsx                 # Registration form (placeholder)
│   └── Profile.tsx                  # User profile (placeholder)
├── store/
│   └── authStore.ts                 # Zustand auth state with persistence
├── types/
│   ├── user.ts                      # User-related TypeScript types
│   └── index.ts                     # Type exports
└── config/
    └── queryClient.ts               # React Query configuration
```

## Key Features Implemented

### 1. Nested Routing with Layout
- Uses React Router's `Outlet` component for nested layouts
- All pages render within the same Layout component
- Layout includes persistent Header and Footer

### 2. Protected Routes Pattern
- `ProtectedRoute` component wraps authenticated routes
- Redirects to login if user is not authenticated
- Preserves attempted location for redirect after login

### 3. Zustand Auth Store
- Persistent authentication state (uses localStorage)
- Type-safe with TypeScript
- Methods: login, logout, updateUser
- Auto-persists to localStorage with 'auth-storage' key

### 4. Material-UI Integration
- Custom theme configuration
- CssBaseline for consistent styling
- Responsive navigation with user menu
- Mobile-friendly design

### 5. React Query Setup
- Pre-configured QueryClient with sensible defaults
- 5-minute stale time for queries
- Single retry on failure
- Window focus refetch disabled
- DevTools available in development

## Naming Conventions

Following CLAUDE.md guidelines:

### ✅ Correct Naming
- **Route path:** `/vacancy-progress` (matches backend)
- **Component:** `VacancyProgress.tsx`
- **UI display:** "My Applications" (user-facing text only)

### ❌ Incorrect (avoided)
- Route path: `/applications`
- Component: `Applications.tsx`

## Vercel React Best Practices Applied

### Bundle Size Optimization
- ✅ **Direct imports** - No barrel file imports from MUI
- ✅ **Hoist static JSX** - Theme config hoisted outside component
- 🔜 Future: Dynamic imports for heavy components (lazy loading)

### Re-render Optimization
- ✅ **Zustand** - Efficient state management with selectors
- ✅ **Primitive dependencies** - Auth store uses primitive values
- ✅ **Functional setState** - Used in authStore for stable callbacks

### Rendering Performance
- ✅ **Conditional rendering** - Using ternary operators (not &&)
- ✅ **Static JSX hoisting** - Theme created outside component

## Usage

### Running the Frontend
```bash
cd jobflow-frontend
npm run dev
```

Frontend runs on: http://localhost:3001

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Navigation Examples

### Programmatic Navigation
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/search');
navigate('/vacancy/123');
```

### Link Components
```typescript
import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@mui/material';

<Button component={RouterLink} to="/search">
  Search Jobs
</Button>
```

### Protected Route Usage
The ProtectedRoute component automatically:
1. Checks authentication status via Zustand store
2. Redirects to `/login` if not authenticated
3. Preserves the attempted location
4. Allows access if authenticated

## Next Steps (Future Sprints)

### Sprint 1: Authentication
- Implement Login form with Formik + Yup
- Implement Register form
- Connect to backend auth API
- Add JWT token management
- Implement refresh token flow

### Sprint 2: Search Functionality
- Build SearchBar component with debouncing
- Create FilterPanel with MUI components
- Implement VacancyCard and VacancyList
- Add pagination component

### Sprint 3: Vacancy Details & Saving
- Complete VacancyDetail page
- Implement save/unsave functionality
- Add SavedVacancies list page

### Sprint 4: Application Tracking
- Complete VacancyProgress page
- Implement status tracking
- Add notes functionality

## Testing the Routing

### Manual Testing Checklist
- [x] Home page loads correctly
- [x] Navigation links work
- [x] Protected routes redirect to login when not authenticated
- [x] Header shows/hides menu items based on auth state
- [x] Footer displays correctly
- [x] All routes are accessible
- [x] 404 redirects to home
- [x] TypeScript compiles without errors

## Configuration Files

### vite.config.ts
API proxy configured for development:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

### tsconfig.json
- Strict mode enabled
- Path aliases configured (if needed)

## Notes

- All page components are currently placeholders with basic UI
- Forms will be implemented in Sprint 1
- Search functionality will be implemented in Sprint 2
- Application tracking will be implemented in Sprint 4
- The routing structure is complete and ready for feature implementation
