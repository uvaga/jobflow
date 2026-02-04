# JobFlow Backend - NestJS Conventions

This file provides backend-specific guidance for the JobFlow NestJS application.

## 📁 Project Structure

```
jobflow-backend/
├── src/
│   ├── main.ts                      # Application bootstrap
│   ├── app.module.ts                # Root module
│   ├── config/
│   │   └── configuration.ts         # Type-safe configuration
│   ├── users/                       # Users module
│   │   ├── schemas/user.schema.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   ├── vacancies/                   # Vacancies module
│   │   ├── schemas/vacancy.schema.ts
│   │   ├── vacancies.controller.ts
│   │   └── vacancies.service.ts
│   └── vacancy-progress/            # Application tracking
│       ├── schemas/vacancy-progress.schema.ts
│       ├── vacancy-progress.controller.ts
│       └── vacancy-progress.service.ts
├── test/                            # E2E tests
├── .env                             # Environment variables (not in git)
├── .env.example                     # Environment template
└── nest-cli.json                    # NestJS configuration
```

## 🚀 Development Commands

```bash
npm run start:dev          # Watch mode with hot reload
npm run build              # Production build
npm run start:prod         # Run production build
npm run test               # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Run tests with coverage
npm run lint               # Run ESLint
npm run format             # Format with Prettier
```

## 🏗️ Architecture & Patterns

### Configuration Pattern
- Type-safe config via `src/config/configuration.ts`
- Access with `ConfigService.get('database.uri')`
- Environment variables in `.env` (use `.env.example` as template)

### Global Setup (in `main.ts`)
- ValidationPipe with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- CORS enabled from frontend origin (configurable)
- Global prefix: `/api/v1` (configurable via `API_PREFIX` and `API_VERSION`)

### Module Pattern
- ConfigModule is global (available everywhere)
- MongooseModule uses async factory pattern with ConfigService
- Follow NestJS best practices: Controllers handle HTTP, Services handle business logic

## 🗄️ Database (MongoDB + Mongoose)

### Connection
- MongoDB 4.4 via Mongoose
- Connection URI from `MONGODB_URI` env var
- Default: `mongodb://jobflow_user:jobflow_dev_password@localhost:27017/jobflow?authSource=jobflow`

### Database Schemas (Implemented)

#### User Schema (`src/users/schemas/user.schema.ts`)
- Email (unique, indexed), password (select: false), firstName, lastName
- savedVacancies array (references to Vacancy)
- Timestamps (createdAt, updatedAt)

#### Vacancy Schema (`src/vacancies/schemas/vacancy.schema.ts`)
- hhId (unique, indexed) - ID from hh.ru API
- Embedded objects: employer, salary, area, schedule, experience, employment
- Caching: cacheExpiresAt with TTL index (7 days default)
- Compound index on area.id + salary.from for filtering
- Mirrors hh.ru API response structure

#### VacancyProgress Schema (`src/vacancy-progress/schemas/vacancy-progress.schema.ts`)
- Tracks user's job application progress (NOT called "Application")
- References: userId, vacancyId
- Status enum: saved, applied, interview_scheduled, interview_completed, rejected, offer_received, offer_accepted, withdrawn
- Fields: notes, appliedAt, interviewDate, tags, priority
- Compound indexes: userId+status, userId+createdAt

## 🎯 NestJS Best Practices

### Dependency Injection
- Use constructor injection for all services
- Inject services through module imports
- Use `@Injectable()` decorator on all services

### DTOs & Validation
- Create DTOs with class-validator decorators
- Use `class-transformer` for type transformation
- Export interfaces for DTOs and entities
- Validate ALL incoming data

### Schema Patterns
- Use `@Schema()` decorator for all schemas
- Use `@Schema({ timestamps: true })` for automatic createdAt/updatedAt
- Create indexes using `SchemaFactory` after schema definition
- Export both class and Mongoose document type

### Error Handling
- Use NestJS exception filters
- Throw appropriate HTTP exceptions (BadRequestException, NotFoundException, etc.)
- Create custom exception filters for global error handling

### Configuration
- Use ConfigService for ALL environment variables
- Never hardcode configuration values
- Validate environment variables on startup

## 🔐 Authentication & Authorization

- JWT tokens with Passport
- Password hashing with bcrypt
- Protected routes use `@UseGuards(JwtAuthGuard)`
- Current user accessible via `@CurrentUser()` decorator

## 📡 API Endpoints

### Convention
All endpoints use `/api/v1` prefix

### Users Module
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update profile
- `GET /api/v1/users/me/vacancies` - Get saved vacancies
- `POST /api/v1/users/me/vacancies/:vacancyId` - Add vacancy (method: `addVacancy`)
- `DELETE /api/v1/users/me/vacancies/:vacancyId` - Remove vacancy (method: `removeVacancy`)

### Vacancies Module
- `GET /api/v1/vacancies` - Search vacancies
- `GET /api/v1/vacancies/:id` - Get vacancy details

### VacancyProgress Module
- `GET /api/v1/vacancy-progress` - Get all applications
- `POST /api/v1/vacancy-progress` - Create application tracking
- `GET /api/v1/vacancy-progress/:id` - Get single application
- `PATCH /api/v1/vacancy-progress/:id` - Update application
- `DELETE /api/v1/vacancy-progress/:id` - Delete application

## 🏷️ Naming Conventions

### VacancyProgress (NOT Application)
**Always use `VacancyProgress` terminology**:
- Schema: `VacancyProgress`
- Module directory: `src/vacancy-progress/`
- Service: `VacancyProgressService`
- Controller: `VacancyProgressController`
- DTOs: `CreateVacancyProgressDto`, `UpdateVacancyProgressDto`
- Enum: `VacancyProgressStatus` (in `src/vacancy-progress/enums/`)
- API endpoints: `/api/v1/vacancy-progress/*`
- Collection: `vacancyprogresses`

### Saved Vacancies Methods
**Use these exact method names**:
- `getSavedVacancies()` - Fetch user's saved vacancies
- `addVacancy(userId, vacancyId)` - Add vacancy to saved list
- `removeVacancy(userId, vacancyId)` - Remove vacancy from saved list

## 🌐 Environment Variables

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

## 📝 Important Files

- `src/main.ts` - Application bootstrap with global configuration
- `src/app.module.ts` - Root module with ConfigModule and MongooseModule
- `src/config/configuration.ts` - Type-safe environment configuration
- `.env` - Environment variables (not in git)
- `.env.example` - Environment variable template

## 🧪 Testing

### Unit Tests
- Test files: `*.spec.ts`
- Mock dependencies with Jest
- Test business logic in services

### E2E Tests
- Test files in `test/` directory
- Use Supertest for HTTP testing
- Test complete request/response cycles

## 🔍 Code Quality

```bash
npm run lint      # ESLint checks
npm run format    # Prettier formatting
npm run test      # Run tests
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Mongoose Documentation](https://mongoosejs.com)
- Root [`CLAUDE.md`](../CLAUDE.md) for project overview
