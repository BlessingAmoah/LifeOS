# LifeOS Project Structure

## Backend Structure

```
backend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   ├── db.ts              # Database connection (PostgreSQL)
│   │   ├── env.ts             # Environment configuration
│   │   ├── azure.ts           # Azure Blob Storage config
│   │   └── mailer.ts          # Email service configuration
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.routes.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.routes.ts
│   │   ├── journal/           # TODO: Migrate from routes
│   │   ├── habits/            # TODO: Migrate from routes
│   │   ├── tasks/             # TODO: Migrate from routes
│   │   ├── reviews/           # TODO: Migrate from routes
│   │   └── health/            # TODO: Migrate from routes
│   ├── middleware/
│   │   ├── auth.middleware.ts # JWT authentication
│   │   └── error.middleware.ts # Error handling
│   ├── utils/
│   │   ├── jwt.ts             # JWT utilities
│   │   └── password.ts        # Password hashing utilities
│   └── routes/                # Legacy routes (to be migrated to modules)
│       ├── journals.ts
│       ├── habits.ts
│       ├── tasks.ts
│       ├── reviews.ts
│       ├── health.ts
│       └── documents.ts
├── package.json
└── tsconfig.json
```

## Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── login.tsx          # Login page
│   │   ├── signup.tsx         # Registration page
│   │   ├── verify.tsx         # Email verification page
│   │   ├── dashboard.tsx      # Dashboard page
│   │   ├── Login.tsx          # Login component
│   │   ├── Register.tsx       # Register component
│   │   ├── Dashboard.tsx      # Dashboard component
│   │   ├── Profile.tsx        # Profile page
│   │   ├── Journals.tsx       # Journals page
│   │   ├── Habits.tsx         # Habits page
│   │   ├── Tasks.tsx          # Tasks page
│   │   ├── Reviews.tsx        # Reviews page
│   │   ├── Health.tsx         # Health logs page
│   │   └── Documents.tsx      # Documents page
│   ├── components/
│   │   ├── Layout.tsx         # Main layout component
│   │   └── Layout.css         # Layout styles
│   ├── hooks/
│   │   ├── useAuth.ts         # Authentication hook
│   │   └── useApi.ts          # API query/mutation hooks
│   ├── services/
│   │   └── api.ts             # Axios API client
│   ├── context/
│   │   └── AuthContext.tsx     # Auth context (Zustand store)
│   ├── styles/                # Global styles (if needed)
│   ├── App.tsx                # Main app component
│   └── main.tsx               # Entry point
├── public/
├── package.json
└── vite.config.ts
```

## Key Changes

### Backend
- ✅ Separated `app.ts` and `server.ts` for better testability
- ✅ Created centralized `config/env.ts` for environment variables
- ✅ Moved utilities to `utils/` folder (JWT, password)
- ✅ Created modular structure with `modules/` folder
- ✅ Separated middleware into dedicated files
- ✅ Auth and Users modules fully migrated
- ⏳ Other modules still in routes/ (can be migrated incrementally)

### Frontend
- ✅ Created `services/` folder for API client
- ✅ Created `hooks/` folder for reusable hooks
- ✅ Created `context/` folder for state management
- ✅ Updated all imports to use new structure
- ✅ Added page aliases (login.tsx, signup.tsx, etc.)

## Migration Path

### Remaining Backend Modules
The following routes can be migrated to modules following the same pattern:
1. `routes/journals.ts` → `modules/journal/`
2. `routes/habits.ts` → `modules/habits/`
3. `routes/tasks.ts` → `modules/tasks/`
4. `routes/reviews.ts` → `modules/reviews/`
5. `routes/health.ts` → `modules/health/`
6. `routes/documents.ts` → `modules/documents/`

Each module should have:
- `*.service.ts` - Business logic
- `*.controller.ts` - Request/response handling
- `*.routes.ts` - Route definitions

### Frontend Components
Consider organizing components by feature:
- `components/Dashboard/`
- `components/Journal/`
- `components/Habits/`
- `components/Tasks/`

This can be done incrementally as features grow.
