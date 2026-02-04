# JobFlow Frontend Testing Guide

## Prerequisites

Before testing, ensure you have:
- Node.js 20+ installed
- All dependencies installed (`npm install` in both root and `jobflow-frontend`)
- MongoDB running (via Docker)

## Quick Start - Full Stack

### Option 1: Start Everything at Once (Recommended)
```bash
# From project root
npm run dev
```
This starts:
- MongoDB (Docker)
- Mongo Express (http://localhost:8081)
- Backend server (http://localhost:3000)
- Frontend dev server (http://localhost:3001)

### Option 2: Start Frontend Only
```bash
# From project root
npm run frontend:dev

# OR from jobflow-frontend directory
cd jobflow-frontend
npm run dev
```

Frontend will be available at: **http://localhost:3001**

## What You Can Test Now

### ✅ Available Pages (No Backend Required)

1. **Home Page** - `http://localhost:3001/`
   - Should show landing page
   - Navigation should work

2. **Login Page** - `http://localhost:3001/login`
   - Form UI should render
   - Validation should work (Formik + Yup)
   - ❌ Submission won't work until backend auth is ready

3. **Register Page** - `http://localhost:3001/register`
   - Form UI should render
   - Validation should work
   - ❌ Submission won't work until backend auth is ready

4. **Search Page** - `http://localhost:3001/search`
   - Page should render
   - Placeholder content visible
   - Will implement in Sprint 2

5. **Saved Vacancies** - `http://localhost:3001/saved`
   - Protected route (will redirect to login)
   - Page structure visible

6. **Applications** - `http://localhost:3001/vacancy-progress`
   - Protected route (will redirect to login)
   - Page structure visible

7. **Profile** - `http://localhost:3001/profile`
   - Protected route (will redirect to login)
   - Page structure visible

### ✅ Components You Can Test

#### 1. Common Components
Test these by importing them into any page:

**LoadingSpinner**:
```tsx
import { LoadingSpinner } from '@/components/common';
<LoadingSpinner message="Loading vacancies..." size={60} />
```

**ErrorDisplay**:
```tsx
import { ErrorDisplay } from '@/components/common';
<ErrorDisplay
  title="Failed to load data"
  message="Connection error"
  onRetry={() => console.log('Retry clicked')}
/>
```

**SearchBar**:
```tsx
import { SearchBar } from '@/components/common';
<SearchBar
  onSearch={(query) => console.log('Search:', query)}
  placeholder="Search vacancies..."
/>
```

**Pagination**:
```tsx
import { Pagination } from '@/components/common';
<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={(page) => console.log('Page:', page)}
  totalItems={100}
  itemsPerPage={10}
/>
```

**EmptyState**:
```tsx
import { EmptyState } from '@/components/common';
import WorkOffIcon from '@mui/icons-material/WorkOff';

<EmptyState
  icon={<WorkOffIcon sx={{ fontSize: 64 }} />}
  title="No vacancies found"
  description="Try adjusting your search filters"
  action={{
    label: "Clear Filters",
    onClick: () => console.log('Clear clicked')
  }}
/>
```

#### 2. Feature Components

**VacancyCard** (requires mock data):
```tsx
import { VacancyCard } from '@/components/features';

const mockVacancy = {
  _id: '1',
  hhId: '12345',
  name: 'Senior React Developer',
  employer: {
    id: 'emp1',
    name: 'Tech Corp',
    trusted: true,
  },
  salary: {
    from: 150000,
    to: 200000,
    currency: 'RUB',
    gross: false,
  },
  area: {
    id: '1',
    name: 'Moscow',
    url: 'https://hh.ru',
  },
  url: 'https://hh.ru/vacancy/12345',
  description: 'Great opportunity...',
  schedule: { id: 'remote', name: 'Remote' },
  experience: { id: 'between3And6', name: '3-6 years' },
  employment: { id: 'full', name: 'Full-time' },
  publishedAt: new Date().toISOString(),
  cacheExpiresAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

<VacancyCard
  vacancy={mockVacancy}
  onClick={(id) => console.log('Clicked:', id)}
  onSave={(id) => console.log('Save:', id)}
/>
```

**FilterPanel**:
```tsx
import { FilterPanel } from '@/components/features';

<FilterPanel
  onFilterChange={(filters) => console.log('Filters:', filters)}
  initialFilters={{}}
/>
```

### ✅ React Query DevTools

The React Query DevTools are available in development mode!

**How to access**:
1. Open frontend at http://localhost:3001
2. Look for the **TanStack Query icon** (flower icon) in the bottom-left corner
3. Click it to see:
   - All queries and their states
   - Cache data
   - Query keys
   - Refetch triggers

**What to check**:
- Query keys structure (hierarchical: `['vacancies', 'list', {...params}]`)
- Stale times (5 minutes for vacancies, 2 minutes for saved)
- Cache invalidation working after mutations

### ❌ What Won't Work Yet (Backend Not Ready)

1. **Authentication**
   - Login/Register forms won't submit successfully
   - Protected routes will redirect to login
   - Token-based auth not active

2. **API Calls**
   - Any data fetching will fail with 404 errors
   - Mutations won't work
   - Use mock data for now

## Testing with Backend (Once Ready)

### Step 1: Start Full Stack
```bash
npm run dev
```

### Step 2: Create Test User (via MongoDB)
```bash
# Connect to MongoDB
docker exec -it jobflow-mongodb mongosh -u jobflow_user -p jobflow_dev_password --authenticationDatabase jobflow

# Create test user
db.users.insertOne({
  email: "test@example.com",
  password: "$2b$10$...", // bcrypt hash of "password123"
  firstName: "Test",
  lastName: "User",
  savedVacancies: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Step 3: Test Authentication Flow

1. **Register**:
   - Go to http://localhost:3001/register
   - Fill form with valid data
   - Check Network tab (F12) for API call
   - Should redirect to /search on success

2. **Login**:
   - Go to http://localhost:3001/login
   - Use: test@example.com / password123
   - Check localStorage for `accessToken`
   - Should redirect to /search

3. **Protected Routes**:
   - Try accessing http://localhost:3001/saved
   - Should work when authenticated
   - Should redirect to /login when not authenticated

4. **Logout**:
   - Click logout button in header
   - Check localStorage cleared
   - Should redirect to /login

### Step 4: Test API Integration

**Check API calls in Network tab (F12)**:
- `GET /api/v1/users/me` - User profile
- `GET /api/v1/users/me/vacancies` - Saved vacancies
- `POST /api/v1/users/me/vacancies/:id` - Save vacancy
- `DELETE /api/v1/users/me/vacancies/:id` - Unsave vacancy

**Check React Query DevTools**:
- Queries should show loading → success states
- Cache should populate with data
- Mutations should trigger refetch

## Manual Testing Checklist

### UI/UX Testing
- [ ] All pages load without errors
- [ ] Navigation works (header links)
- [ ] Forms show validation errors
- [ ] Buttons have loading states
- [ ] Error messages are user-friendly
- [ ] Mobile responsive (resize browser)

### Component Testing
- [ ] LoadingSpinner displays correctly
- [ ] ErrorDisplay shows with retry button
- [ ] SearchBar accepts input and triggers search
- [ ] Pagination changes pages
- [ ] VacancyCard displays all info
- [ ] FilterPanel updates filters

### State Management
- [ ] Auth state persists after refresh (localStorage)
- [ ] Login updates auth store
- [ ] Logout clears auth store
- [ ] Protected routes work correctly

### Performance
- [ ] React Query caching works (no duplicate requests)
- [ ] Components don't re-render unnecessarily
- [ ] No console errors
- [ ] Fast page transitions

## Browser DevTools Checklist

### Console (F12)
- [ ] No errors or warnings
- [ ] React Query logs (if enabled)
- [ ] Network requests successful

### Network Tab
- [ ] API calls have correct URLs (/api/v1/...)
- [ ] Authorization headers present (Bearer token)
- [ ] Status codes: 200 (success), 401 (unauthorized)

### Application Tab
- [ ] localStorage has `accessToken`
- [ ] localStorage has `auth-storage` (Zustand persist)

### React DevTools
- [ ] Install React DevTools extension
- [ ] Check component tree
- [ ] Verify props/state
- [ ] Check hooks

## Common Issues & Solutions

### Issue: "Failed to fetch" errors
**Solution**: Backend not running. Start with `npm run dev` from root.

### Issue: Protected routes not working
**Solution**: Check localStorage for `accessToken`. Login first.

### Issue: CORS errors
**Solution**:
- Backend should have `CORS_ORIGIN=http://localhost:3001` in .env
- Vite proxy should be configured (already done in vite.config.ts)

### Issue: Components not rendering
**Solution**: Check console for errors. Verify imports use `@/` alias.

### Issue: Token mismatch
**Solution**: We fixed this! Both api.ts and authStore now use `accessToken`.

## Testing Tools

### Recommended Browser Extensions
- **React Developer Tools** - Component inspection
- **Redux DevTools** - Not needed (using Zustand)
- **Axe DevTools** - Accessibility testing
- **JSON Viewer** - Pretty API responses

### VS Code Extensions
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Error Lens** - Inline errors

## Next Steps

Once backend Sprint 1 (Authentication) is complete:
1. Test full authentication flow
2. Test protected routes
3. Test API integration with real data
4. Move to Sprint 2 (Vacancy Search)

## Quick Test Script

Create a test page to verify all components:

**File**: `jobflow-frontend/src/pages/ComponentTest.tsx`
```tsx
import { useState } from 'react';
import { Container, Typography, Box, Divider } from '@mui/material';
import {
  LoadingSpinner,
  ErrorDisplay,
  SearchBar,
  Pagination,
  EmptyState,
} from '@/components/common';
import { VacancyCard, FilterPanel } from '@/components/features';
import WorkOffIcon from '@mui/icons-material/WorkOff';

export default function ComponentTest() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const mockVacancy = {
    _id: '1',
    hhId: '12345',
    name: 'Senior React Developer',
    employer: {
      id: 'emp1',
      name: 'Tech Corp',
      trusted: true,
    },
    salary: {
      from: 150000,
      to: 200000,
      currency: 'RUB',
    },
    area: { id: '1', name: 'Moscow', url: 'https://hh.ru' },
    url: 'https://hh.ru/vacancy/12345',
    description: 'Great opportunity',
    schedule: { id: 'remote', name: 'Remote' },
    experience: { id: 'between3And6', name: '3-6 years' },
    employment: { id: 'full', name: 'Full-time' },
    publishedAt: new Date().toISOString(),
    cacheExpiresAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Component Test Page
      </Typography>

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          1. LoadingSpinner
        </Typography>
        <LoadingSpinner message="Loading vacancies..." />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          2. ErrorDisplay
        </Typography>
        <ErrorDisplay
          title="Failed to load data"
          message="Connection error occurred"
          onRetry={() => alert('Retry clicked!')}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          3. SearchBar
        </Typography>
        <SearchBar
          onSearch={(query) => setSearchQuery(query)}
          placeholder="Search vacancies..."
        />
        <Typography sx={{ mt: 1 }}>Search query: {searchQuery}</Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          4. Pagination
        </Typography>
        <Pagination
          currentPage={currentPage}
          totalPages={10}
          onPageChange={setCurrentPage}
          totalItems={100}
          itemsPerPage={10}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          5. EmptyState
        </Typography>
        <EmptyState
          icon={<WorkOffIcon sx={{ fontSize: 64 }} />}
          title="No vacancies found"
          description="Try adjusting your search filters"
          action={{
            label: 'Clear Filters',
            onClick: () => alert('Clear clicked!'),
          }}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          6. VacancyCard
        </Typography>
        <VacancyCard
          vacancy={mockVacancy}
          onClick={(id) => alert(`Clicked vacancy: ${id}`)}
          onSave={(id) => alert(`Save vacancy: ${id}`)}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          7. FilterPanel
        </Typography>
        <FilterPanel
          onFilterChange={(filters) => console.log('Filters:', filters)}
          initialFilters={{}}
        />
      </Box>
    </Container>
  );
}
```

**Add route to test page** in `App.tsx`:
```tsx
<Route path="/test-components" element={<ComponentTest />} />
```

Then visit: **http://localhost:3001/test-components**

---

## Summary

**Right now** (no backend):
- ✅ Test UI components visually
- ✅ Test form validation
- ✅ Test navigation
- ✅ Test responsive design
- ✅ Verify React Query DevTools

**After backend Sprint 1** (with auth):
- ✅ Test full authentication flow
- ✅ Test API integration
- ✅ Test protected routes
- ✅ Test state persistence

**Start testing**: `npm run dev` from project root! 🚀
