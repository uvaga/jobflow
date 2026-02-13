# JobFlow Backend - Development Guide

This file provides backend-specific conventions and implementation details for Claude Code when working with the NestJS backend.

## 📂 Project Structure

```
jobflow-backend/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── strategies/          # JWT strategies (access + refresh)
│   │   ├── auth.controller.ts   # Register, login, refresh, logout
│   │   ├── auth.service.ts      # Token generation and validation
│   │   └── auth.module.ts
│   ├── users/                   # User management module
│   │   ├── schemas/             # User Mongoose schema
│   │   ├── users.controller.ts  # Profile CRUD, saved vacancies
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── vacancies/               # Vacancy search and caching
│   │   ├── schemas/             # Vacancy Mongoose schema
│   │   ├── vacancies.controller.ts  # Search, dictionaries, detail
│   │   ├── vacancies.service.ts
│   │   ├── hh-api.service.ts    # HeadHunter API client
│   │   └── vacancies.module.ts
│   ├── vacancy-progress/        # Job application tracking
│   │   ├── schemas/             # VacancyProgress schema
│   │   ├── enums/               # Status enum
│   │   ├── vacancy-progress.controller.ts  # CRUD, statistics
│   │   ├── vacancy-progress.service.ts
│   │   └── vacancy-progress.module.ts
│   ├── employers/               # Employer details module
│   │   ├── employers.controller.ts  # Get employer by ID
│   │   ├── employers.service.ts
│   │   └── employers.module.ts
│   ├── common/                  # Shared utilities
│   │   ├── decorators/          # @Public(), @CurrentUser()
│   │   ├── guards/              # JwtAuthGuard, RefreshTokenGuard
│   │   ├── interceptors/        # Transform, Logging
│   │   └── filters/             # HttpExceptionFilter
│   ├── config/                  # Configuration module
│   │   └── configuration.ts     # App config (DB, JWT, API, CORS, rate limit, hhApi.locale)
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Bootstrap with global pipes/filters
├── test/
│   ├── e2e/                     # E2E test suites (146 passing tests)
│   │   ├── auth.e2e-spec.ts
│   │   ├── users.e2e-spec.ts
│   │   ├── vacancies.e2e-spec.ts
│   │   ├── vacancy-progress.e2e-spec.ts
│   │   └── integration.e2e-spec.ts
│   └── helpers/                 # Test utilities (AuthHelper, CleanupHelper)
├── .env                         # Environment configuration
└── package.json
```

## 🎯 Architecture Patterns

### Global Guards and Decorators

**JWT Guard (Applied Globally)**:
- All routes require authentication by default
- Use `@Public()` decorator to bypass authentication
- Attaches validated user to `request.user`

```typescript
// Protected by default (no decorator needed)
@Get('me')
getProfile(@CurrentUser() user: User) { }

// Public routes (must use @Public())
@Public()
@Post('register')
register(@Body() dto: RegisterDto) { }
```

**Refresh Token Guard**:
- Used only on `/auth/refresh` and `/auth/logout` endpoints
- Validates refresh tokens (different secret than access tokens)
- Must combine with `@Public()` to bypass default JWT guard

```typescript
@Public()
@UseGuards(RefreshTokenGuard)
@Post('refresh')
refreshToken(@CurrentUser() user: User) { }
```

### Response Transformation

**ALL responses are wrapped by TransformInterceptor**:
```typescript
// What you return in controller
return { accessToken: '...', user: {...} };

// What client receives
{ data: { accessToken: '...', user: {...} } }
```

**Frontend must unwrap**: `response.data.data` instead of `response.data`

### Authentication Flow

**Token Configuration**:
- Access tokens: 15 minutes (short-lived for security)
- Refresh tokens: 7 days (long-lived for UX)
- Both tokens use different secrets (JWT_SECRET vs JWT_REFRESH_SECRET)

**Password Security**:
- Hashed with bcrypt (10 rounds)
- Password field has `select: false` in schema
- Use `findByEmail(email, true)` to include password for validation

**Token Payload**:
```typescript
{ sub: user._id, email: user.email }
```

## 🗄️ Database Schemas

### User Schema
```typescript
{
  email: string (unique, lowercase, trimmed)
  password: string (select: false, bcrypt hashed)
  firstName: string
  lastName: string
  savedVacancies: [{                    // Subdocument array
    vacancy: ObjectId (ref 'Vacancy')   // Reference to permanently stored vacancy
    progress: [{                        // Embedded progress history
      status: VacancyProgressStatus     // 8 status values (saved, applied, etc.)
      statusSetDate: Date
    }]
  }]
  isActive: boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

### Vacancy Schema (Cached or Per-User Snapshot)
```typescript
{
  hhId: string (indexed, non-unique — multiple users can each have their own snapshot)
  name: string
  employer: {
    id: string, name: string, url: string
    logoUrls: object, trusted: boolean
    accreditedItEmployer?: boolean
  }
  salary: { from: number, to: number, currency: string, gross: boolean }
  area: { id: string, name: string, url: string }
  description: string
  url: string
  alternateUrl?: string                              // hh.ru human-readable URL
  schedule: { id: string, name: string }
  experience: { id: string, name: string }
  employment: { id: string, name: string }
  keySkills?: [{ name: string }]                     // Required skills
  professionalRoles?: [{ id: string, name: string }] // Job roles
  address?: object                                    // Office location
  contacts?: object                                   // Contact info
  workFormat?: [{ id: string, name: string }]         // Remote/office/hybrid
  workingHours?: [{ id: string, name: string }]       // Working hours type
  workScheduleByDays?: [{ id: string, name: string }] // Work days schedule
  acceptHandicapped?: boolean
  acceptKids?: boolean
  acceptTemporary?: boolean
  acceptIncompleteResumes?: boolean
  publishedAt: Date
  cacheExpiresAt?: Date (TTL index — absent for per-user snapshots, 7 days for cached)
}

// Indexes
- hhId (non-unique index)
- area.id
- salary.from
- cacheExpiresAt (TTL, sparse — documents without field are not deleted)
```

**Save vs Cache**: Each user save creates a **separate vacancy document** (per-user snapshot) without `cacheExpiresAt`, making it permanent. The `hhId` field is non-unique — multiple users can each have their own snapshot of the same vacancy. Search-cached vacancies have a 7-day TTL with `cacheExpiresAt`. When a user removes a saved vacancy, the vacancy document is **cascade deleted** from the vacancies collection.

### VacancyProgress Schema
```typescript
{
  userId: ObjectId (ref User, indexed)
  vacancyId: ObjectId (ref Vacancy)
  status: enum [
    'SAVED', 'APPLIED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED',
    'REJECTED', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'WITHDRAWN'
  ]
  notes: string
  appliedAt: Date
  interviewDate: Date
  tags: string[]
  priority: number
  createdAt: Date
  updatedAt: Date
}

// Indexes
- userId
- (userId, status)
- (userId, createdAt)
```

## 🛣️ API Endpoints

### Authentication (Public)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user (returns access + refresh tokens)
- `POST /auth/refresh` - Get new tokens (requires refresh token)
- `POST /auth/logout` - Logout user (requires refresh token)

### Users (Protected)
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update profile (firstName, lastName)
- `PATCH /users/me/password` - Change password (requires current password verification)
- `GET /users/me/vacancies` - List saved vacancies (paginated, filter by status, sort by date/name)
- `GET /users/me/vacancies/:hhId` - Get saved vacancy detail with progress history
- `POST /users/me/vacancies/:hhId` - Save vacancy (fetches from external API, creates per-user snapshot in MongoDB)
- `DELETE /users/me/vacancies/:hhId` - Remove from saved list (cascade deletes vacancy document)
- `POST /users/me/vacancies/:hhId/refresh` - Re-fetch vacancy data from external API
- `PATCH /users/me/vacancies/:hhId/progress` - Update progress status (appends to progress history)

### Vacancies (Public)
- `GET /vacancies/search` - Search vacancies via external API
- `GET /vacancies/dictionaries` - Get reference data (areas, schedules, etc.)
- `GET /vacancies/:id` - Get vacancy by external ID (with 7-day caching)

### Employers (Public)
- `GET /employers/:id` - Get employer details from hh.ru API (proxied)

### Vacancy Progress (Protected)
- `POST /vacancy-progress` - Create application tracking
- `GET /vacancy-progress` - List applications (supports status filter, pagination)
- `GET /vacancy-progress/statistics` - Get counts by status
- `GET /vacancy-progress/:id` - Get single application
- `PATCH /vacancy-progress/:id` - Update application
- `DELETE /vacancy-progress/:id` - Delete application

**All endpoints use `/api/v1` prefix**

## 🔧 Key Conventions

### Naming Patterns

**Saved Vacancies API** (all use hhId — the external vacancy ID string):
- UsersService methods: `getSavedVacancies()`, `getSavedVacancyByHhId()`, `addVacancy()`, `removeVacancy()`, `refreshVacancy()`, `updateVacancyProgress()`
- VacanciesService methods: `saveVacancyFromHh()`, `refreshVacancyById()`, `deleteById()`
- Controller methods: `@Get('me/vacancies')`, `@Post('me/vacancies/:hhId')`, `@Patch('me/vacancies/:hhId/progress')`
- MongoDB operators: `$push` (add subdocument), `$pull` (remove)

**VacancyProgress (NOT "Application")**:
- Always use `VacancyProgress` in code (files, classes, routes, functions)
- Avoid confusion with "app" or "application" referring to the software
- UI text can display "Applications" for user-facing labels

### DTOs and Validation

**class-validator decorators on all DTOs**:
```typescript
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;
}
```

**Global ValidationPipe** (main.ts):
- `whitelist: true` - Removes unknown properties
- `forbidNonWhitelisted: true` - Throws error on unknown properties
- `transform: true` - Type transforms DTOs

### Service Patterns

**User Isolation**:
- VacancyProgress queries always filter by `userId`
- Example: `this.model.find({ userId, status })`

**Population**:
- Use `.populate('vacancyId')` to include vacancy details
- Use `.populate('userId', 'firstName lastName email')` for user data

**MongoDB Operators for Saved Vacancies**:
```typescript
// Add subdocument to savedVacancies array (per-user snapshot)
await this.userModel.findByIdAndUpdate(userId, {
  $push: {
    savedVacancies: {
      vacancy: vacancyObjectId,  // Each user gets their own vacancy document
      progress: [{ status: 'saved', statusSetDate: new Date() }]
    }
  }
});

// Remove subdocument from array + cascade delete vacancy document
// 1. Find user's specific vacancy via populate + hhId match
// 2. Delete the vacancy document from vacancies collection
await this.vacancyModel.findByIdAndDelete(vacancyObjectId);
// 3. Remove subdocument from user's savedVacancies array
await this.userModel.findByIdAndUpdate(userId, {
  $pull: { savedVacancies: { vacancy: vacancyObjectId } }
});

// Update progress (push new status entry — uses populate to find user's vacancy ObjectId)
await this.userModel.updateOne(
  { _id: userId, 'savedVacancies.vacancy': vacancyObjectId },
  { $push: { 'savedVacancies.$.progress': { status, statusSetDate: new Date() } } }
);
```

## 🧪 Testing

### Test Structure
- **E2E Tests**: 152 passing tests across 5 test files
- **Test Database**: Uses separate database (cleaned between tests)
- **Test Helpers**:
  - `AuthHelper` - Registers/logs in test users, provides auth headers
  - `CleanupHelper` - Cleans collections between tests
  - `MockHhApiService` - Mocks external API with 3 test vacancies

### Running Tests
```bash
# All tests
npm test

# E2E tests only
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

### Test Fixtures
- `testUsers` - 3 test users (user1, user2, user3)
- `testVacancies` - 3 test vacancies
- `testVacancyProgress` - Sample application tracking data

## 🔐 Environment Variables

**Required in `.env`**:
```bash
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://jobflow_user:jobflow_dev_password@localhost:27017/jobflow?authSource=jobflow

# JWT (must be different 64+ byte random strings)
JWT_SECRET=your-secure-secret-key-for-access-tokens-min-64-bytes
JWT_REFRESH_SECRET=your-secure-secret-key-for-refresh-tokens-min-64-bytes
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API
API_PREFIX=api
API_VERSION=v1
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# HH.ru API
HH_API_LOCALE=EN
```

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start development server (requires MongoDB running)
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Format code
npm run format

# Lint
npm run lint

# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- test/e2e/auth.e2e-spec.ts
```

## 📝 Common Patterns

### Controller with Auth
```typescript
@Controller('users')
export class UsersController {
  // Protected by default (global guard)
  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return this.usersService.findById(user._id);
  }

  // Protected with DTO validation
  @Put('me')
  updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto
  ) {
    return this.usersService.update(user._id, dto);
  }
}
```

### Service with User Isolation
```typescript
@Injectable()
export class VacancyProgressService {
  async findAll(userId: string, filters?: QueryDto) {
    // Always filter by userId for security
    const query = { userId };
    if (filters?.status) query.status = filters.status;

    return this.model
      .find(query)
      .populate('vacancyId')
      .sort({ createdAt: -1 });
  }
}
```

### External API Client
```typescript
@Injectable()
export class HhApiService {
  private readonly baseUrl = 'https://api.hh.ru';
  private readonly httpService: HttpService;
  private readonly locale: string;  // from HH_API_LOCALE env var (default: 'EN')

  async searchVacancies(params: SearchDto) {
    try {
      // All requests include locale parameter for localized responses
      const paramsWithLocale = { ...params, locale: this.locale };
      const response = await firstValueFrom(
        this.httpService.get('/vacancies', {
          params: paramsWithLocale,
          headers: { 'User-Agent': 'JobFlow/1.0' }
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('HH API Error', error);
      throw new HttpException('Search failed', HttpStatus.BAD_GATEWAY);
    }
  }

  // Also supports: getEmployerById(id) → GET /employers/{id} on hh.ru API
}
```

## 🐛 Common Issues

### Issue: Refresh endpoint returns 401
**Cause**: Global JWT guard blocking the endpoint
**Solution**: Combine `@Public()` with `@UseGuards(RefreshTokenGuard)`

### Issue: Frontend receives wrong data structure
**Cause**: TransformInterceptor wraps all responses in `{ data: {...} }`
**Solution**: Frontend must access `response.data.data`

### Issue: Password validation fails
**Cause**: Password field has `select: false` by default
**Solution**: Use `findByEmail(email, true)` to include password

### Issue: Tests fail with "request is not a function"
**Cause**: Wrong import syntax for supertest
**Solution**: Use `import request from 'supertest'` (default import)

### Issue: Token expiry type error
**Cause**: TypeScript strict mode on JwtModule options
**Solution**: Use type assertion `as any` on expiresIn option

---

**For full-stack conventions and root-level commands, refer to `/CLAUDE.md` in the project root.**
