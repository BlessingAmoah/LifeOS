# LifeOS

A private, cloud-hosted personal dashboard designed to help individuals intentionally manage their spiritual growth, health, habits, career development, and daily execution from a single platform.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Azure Deployment](#azure-deployment)
- [Database Migrations](#database-migrations)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Feature Status](#feature-status)
- [License](#license)

---

## Features

### Restored profile, Career, and Budget routes

The navigation avatar opens `/dashboard/profile` for account settings. Career
and Budget APIs used by the existing pages are registered again. Their tables
come from migrations `015`, `019`, and `020`; verify these are applied before
deploying to a new database. Restoring routes does not run migrations or seed data.

Focused regression checks:

```bash
npm --prefix backend run build
node --test backend/tests/*.test.js
cd frontend
node --test tests/*.test.mjs
```

### Core Modules

1. **Authentication** ✅
   - Email/password registration with verification
   - Email verification (6-digit code, 5-minute expiry)
   - Password reset and email change
   - JWT-based session management
   - Profile management with avatar upload

2. **Identity & Vision** ✅
   - Card-based identity dashboard (core values, identity statement, life pillars, rules/principles, strengths, growth areas)
   - Edit mode with auto-save functionality
   - Multiple vision boards (short-term and long-term)
   - Top 3 priorities tracking

3. **Journaling** ✅
   - Rich text/Markdown support
   - Search and filtering (by category, mood, tags, date range)
   - Mood tracking visualization (distribution chart, 30-day timeline)
   - Card-based view with categories: spiritual, health, career, reflection

4. **Habit Tracker** ✅
   - Daily/weekly habit tracking with streak calculation
   - Interactive calendar view with color-coded completion status
   - 37 predefined habits and 22 categories
   - Status options: Yes, No, Partially complete, Not today's task
   - Identity-based filtering
   - Streak notifications (7, 14, 30, 50, 100 day milestones)

5. **Tasks (Sprint Style)** ✅
   - Kanban board with drag-and-drop
   - Sprint planning and daily standup views
   - Task archiving by month
   - Time-specific tasks (morning to evening)
   - Retrospective notes
   - Priority and due date tracking

6. **Reviews** ✅
   - Daily, weekly, monthly, and quarterly reviews
   - Review templates (default, minimal, detailed)
   - Goal progress and habit effectiveness analysis
   - Review comparison over time (side-by-side)
   - Life balance radar chart (6 dimensions)
   - Strategic adjustments section

7. **Health Logging** ✅
   - Exercise, sleep, energy level tracking
   - Nutrition notes (enhanced with meals, calories, macros)
   - Weight and vitals tracking (blood pressure, heart rate)
   - Mental health check-ins (score, mood, stress level)
   - Health goals with progress tracking
   - Trends visualization (sleep, energy)
   - Weekly health summary

8. **Documents** ✅
   - Rich text editor for text documents
   - Hierarchical folder organization
   - File uploads to Azure Blob Storage
   - Folder navigation with breadcrumbs

9. **Projects** ✅
   - Project CRUD with status tracking
   - GitHub and deployment links
   - Image/diagram uploads
   - Grouped by status view

10. **Spiritual Life** ✅
    - Spiritual goals with progress tracking
    - Prayer/meditation logs with duration
    - Scriptures/affirmations storage with favorites
    - Spiritual reflections with prompts
    - Reflection prompts (system-wide and user-specific)

11. **Financial** ✅
    - Income and expense tracking
    - Recurring transactions
    - Account buckets (checking, savings, credit card, cash)
    - Budget categories (weekly/monthly/yearly)
    - Savings goals with emergency fund tracking
    - Investments portfolio (stocks, bonds, crypto, real estate)
    - Net worth snapshots with assets/liabilities breakdown
    - Financial dashboard with health indicators
    - Cash flow view (monthly income vs expenses)
    - CSV import with duplicate detection

12. **Books** ✅
    - Reading list with priority and categories
    - Currently reading with progress tracking
    - Completed books with ratings
    - Notes, highlights, quotes, and takeaways
    - Reading goals (books per year/month, category goals, streaks)
    - Dashboard view with reading progress

13. **Immigration** ✅
    - Status timeline (case type, current status, dates)
    - Document checklist with expiry tracking
    - Deadlines & reminders with critical flags
    - Case notes (lawyer advice, USCIS updates)
    - Uploaded documents (Azure Blob Storage)
    - Visa/application milestones tracking

14. **Career** ✅ (Partially Complete)
    - Career goals and skills roadmap
    - Role tracking (current, next, dream)
    - Quick role input from dashboard
    - Feedback notes and resume versions
    - Interview prep notes
    - Career milestones

15. **Technical Growth** ✅
    - Practice sessions (DSA, system design, coding challenges)
    - Engineering documentation (ADRs, design decisions)
    - Engineering wins (problems solved, features shipped)
    - Analytics endpoints for progress tracking

16. **Relational Patterns** ✅
    - Relationship journal entries
    - Conflict reflections
    - Communication patterns tracking
    - Boundaries notes
    - Lessons learned

### Additional Features

- **Dashboard**: 12 interactive widgets with grid layout
- **Global Search**: Search across all modules with clickable results
- **Notifications**: Habit streak milestones and reminders
- **Export Functionality**: PDF and CSV export for Journals, Tasks, Habits, Health, and Financial modules
- **Responsive Design**: Mobile-friendly interface

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Azure Database for PostgreSQL Flexible Server)
- **Hosting**: Azure (App Service, PostgreSQL, Blob Storage)
- **Authentication**: JWT-based
- **File Storage**: Azure Blob Storage
- **Charts**: Chart.js + react-chartjs-2
- **Drag & Drop**: @dnd-kit
- **PDF Export**: jsPDF

---

## Project Structure

```
LifeOS/
├── backend/          # Express API server
│   ├── src/
│   │   ├── app.ts           # Express app configuration
│   │   ├── server.ts        # Server entry point
│   │   ├── config/          # Configuration files
│   │   ├── modules/         # Feature modules (auth, users, etc.)
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utility functions
│   │   ├── routes/          # Legacy routes (being migrated to modules)
│   │   └── jobs/            # Background jobs (notifications)
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # React application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── context/         # State management (Zustand)
│   │   ├── utils/           # Utility functions (export, etc.)
│   │   └── data/            # Static data (predefined habits, etc.)
│   ├── package.json
│   └── vite.config.ts
├── database/         # PostgreSQL migrations and schema
│   ├── migrations/  # SQL migration files
│   ├── scripts/     # Migration scripts
│   └── package.json
└── azure/           # Azure deployment configurations
    ├── setup-resources.sh    # Automated Azure setup
    └── README.md             # Azure setup documentation
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure account (for PostgreSQL and deployment)
- Azure CLI installed (for deployment)
- No local database installation required

### Local Development

#### 1. Clone the Repository

```bash
git clone https://github.com/BlessingAmoah/LifeOS.git
cd LifeOS
```

#### 2. Set up Azure PostgreSQL Database

```bash
# Create Azure PostgreSQL Flexible Server (see Azure Deployment section)
# Get connection string from Azure Portal

# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:pass@server.postgres.database.azure.com:5432/postgres?sslmode=require"

# Run migrations
cd database
npm install
npm run migrate
```

#### 3. Set up the Backend

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@server.postgres.database.azure.com:5432/postgres?sslmode=require
JWT_SECRET=your-secret-key-change-in-production
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=lifeos-documents
PORT=3001
NODE_ENV=development
EOF

# Start backend (runs on http://localhost:3001)
npm run dev
```

#### 4. Set up the Frontend

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001/api" > .env

# Start frontend (runs on http://localhost:3000)
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:3001`.

---

## Azure Deployment

### Quick Setup (Automated)

Create all Azure resources (database, backend, frontend) with one command:

**Linux/macOS:**
```bash
cd azure
./setup-resources.sh
```

**Windows PowerShell:**
```powershell
cd azure
$password = Read-Host "Enter PostgreSQL password" -AsSecureString
.\setup-resources.ps1 -PostgresPassword $password
```

The script will:
- Create resource group
- Create Azure PostgreSQL Flexible Server
- Create Storage Account for documents
- Create Backend and Frontend App Services
- Configure all connection strings and environment variables
- Save all connection strings to `azure/.env` file

### After Setup

#### 1. Run Database Migrations

```bash
cd database
npm install

# Load DATABASE_URL from azure/.env
source ../azure/.env  # Linux/macOS
# Or set manually:
export DATABASE_URL="postgresql://lifeosadmin:password@lifeos-db.postgres.database.azure.com:5432/lifeos?sslmode=require"

# Run migrations
npm run migrate
```

#### 2. Deploy Applications with GitHub Actions

Push backend or frontend changes to `main` to trigger the corresponding
deployment workflow. For a manual rerun, open GitHub Actions, select
**Deploy Backend to Azure** or **Deploy Frontend to Azure**, and choose
**Run workflow** on `main`.

Both workflows use Azure OIDC with the repository secrets `AZURE_CLIENT_ID`,
`AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID`. They build and package the
applications on the runner; no local deployment ZIP is required.

### Manual Setup

For detailed manual setup instructions, see `azure/README.md`.

### Cost Estimation

**Development/Testing (Monthly)**
- PostgreSQL B1ms: ~$12/month
- App Service B1: ~$13/month
- App Service FREE: $0
- Storage Account: ~$0.02/GB
- **Total**: ~$25/month

**Production (Monthly)**
- PostgreSQL (scaled): $50-200/month
- App Service (scaled): $50-200/month
- Storage: $0.02/GB
- **Total**: $100-400/month (depending on scale)

---

## Database Migrations

All migrations are located in `database/migrations/`. To run migrations:

```bash
cd database
export DATABASE_URL="postgresql://user:pass@server.postgres.database.azure.com:5432/lifeos?sslmode=require"
npm run migrate
```

### Available Migrations

1. `001_initial_schema.sql` - Base tables (users, profiles, journals, habits, tasks, reviews, health_logs, documents)
2. `002_update_profiles_schema.sql` - Profile enhancements
3. `003_add_sprint_features.sql` - Sprint features for tasks
4. `004_add_review_enhancements.sql` - Review enhancements
5. `005_add_health_goals.sql` - Health goals table
6. `006_enhance_identity_vision.sql` - Identity and vision enhancements
7. `007_add_vision_boards.sql` - Vision boards table
8. `008_add_tasks_updated_at.sql` - Tasks updated_at field
9. `009_add_documents_folders_and_text.sql` - Documents enhancements
10. `010_add_habit_status.sql` - Habit status field
11. `011_add_task_archiving.sql` - Task archiving
12. `012_add_projects.sql` - Projects table
13. `013_add_projects_images.sql` - Project images
14. `014_add_task_time.sql` - Task time field
15. `015_add_financial_module.sql` - Financial module tables
16. `016_add_spiritual_life_module.sql` - Spiritual Life module tables
17. `017_add_investments_networth.sql` - Investments and net worth tables
18. `018_add_financial_enhancements.sql` - Financial enhancements
19. `019_add_career_module.sql` - Career module tables
20. `020_add_career_enhancements.sql` - Career enhancements
21. `021_add_technical_growth_module.sql` - Technical Growth module tables
22. `022_add_relational_patterns_module.sql` - Relational Patterns module tables
23. `023_add_books_module.sql` - Books module tables
24. `024_add_immigration_module.sql` - Immigration module tables
25. `025_add_financial_planning.sql` - Financial planning tables
26. `026_add_notifications.sql` - Notifications and reminders tables
27. `027_enhance_identity_fields_with_details.sql` - Identity fields enhancement (JSONB arrays)
28. `028_add_reviews_life_balance_and_strategic.sql` - Reviews life balance and strategic adjustments
29. `029_add_health_enhancements.sql` - Health enhancements (nutrition, vitals, mental health)

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify email

### Profiles
- `GET /api/profiles` - Get user profile
- `PUT /api/profiles` - Update profile

### Journals
- `GET /api/journals` - List journal entries (with search, filter, date range)
- `GET /api/journals/:id` - Get journal entry
- `POST /api/journals` - Create journal entry
- `PUT /api/journals/:id` - Update journal entry
- `DELETE /api/journals/:id` - Delete journal entry

### Habits
- `GET /api/habits` - List habits (with identity filter)
- `GET /api/habits/:id` - Get habit with logs
- `POST /api/habits` - Create habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/logs` - Log habit completion
- `DELETE /api/habits/:id/logs/:logId` - Delete habit log

### Tasks
- `GET /api/tasks` - List tasks (with sprint filter)
- `GET /api/tasks/:id` - Get task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Reviews
- `GET /api/reviews` - List reviews
- `GET /api/reviews/:id` - Get review
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Health
- `GET /api/health` - List health logs
- `GET /api/health/:id` - Get health log
- `POST /api/health` - Create health log
- `PUT /api/health/:id` - Update health log
- `DELETE /api/health/:id` - Delete health log
- `GET /api/health/goals` - List health goals
- `POST /api/health/goals` - Create health goal
- `PUT /api/health/goals/:id` - Update health goal
- `DELETE /api/health/goals/:id` - Delete health goal

### Documents
- `GET /api/documents` - List documents (with folder filter)
- `GET /api/documents/:id` - Get document
- `POST /api/documents` - Upload document (multipart/form-data)
- `DELETE /api/documents/:id` - Delete document
- `GET /api/folders` - List folders
- `POST /api/folders` - Create folder
- `DELETE /api/folders/:id` - Delete folder

### Financial
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/import` - Import transactions from CSV
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `GET /api/savings-goals` - List savings goals
- `POST /api/savings-goals` - Create savings goal
- `GET /api/investments` - List investments
- `POST /api/investments` - Create investment
- `GET /api/net-worth` - List net worth snapshots
- `GET /api/net-worth/latest` - Get latest net worth snapshot
- `POST /api/net-worth` - Create net worth snapshot
- `GET /api/financial/dashboard` - Get financial dashboard data

### Other Modules
- See `FEATURE_STATUS.md` for complete API endpoint documentation for all modules

---

## Troubleshooting

### Database Connection Error
- Verify Azure PostgreSQL server is running in Azure Portal
- Check DATABASE_URL format: `postgresql://user:pass@server.postgres.database.azure.com:5432/db?sslmode=require`
- Ensure firewall rules allow your IP address
- Verify SSL mode is set to `require` in connection string

### Port Already in Use
- Backend: Change PORT in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

### CORS Errors
- Ensure backend is running before frontend
- Check `VITE_API_URL` matches backend URL
- Verify backend CORS configuration allows frontend origin

### Azure Storage (Local Dev)
- For local development, you can use Azure Storage Emulator (Azurite)
- Or use a test storage account connection string
- File uploads will work but files won't persist locally without Azure Storage

### Frontend-Backend Connection (Production)
- Vite environment variables (`VITE_API_URL`) are only available at **build time**
- Build frontend with correct API URL:
  ```bash
  cd frontend
  VITE_API_URL=https://lifeos-backend.azurewebsites.net/api npm run build
  ```

### Data Persistence
- ✅ All data is stored in Azure PostgreSQL (persistent)
- ✅ 7-day automated backups enabled
- ✅ Database survives deployments (only code is updated)
- ✅ Documents stored in Azure Blob Storage (persistent)

### PostgreSQL Connection Issues
1. **Check firewall rules**:
   ```bash
   az postgres flexible-server firewall-rule list \
     --resource-group lifeos-rg \
     --name lifeos-db
   ```

2. **Add your IP**:
   ```bash
   MY_IP=$(curl -s https://api.ipify.org)
   az postgres flexible-server firewall-rule create \
     --resource-group lifeos-rg \
     --name lifeos-db \
     --rule-name AllowMyIP \
     --start-ip-address $MY_IP \
     --end-ip-address $MY_IP
   ```

### App Service Issues
1. **Check logs**:
   ```bash
   az webapp log tail --name lifeos-backend --resource-group lifeos-rg
   ```

2. **Check app settings**:
   ```bash
   az webapp config appsettings list \
     --name lifeos-backend \
     --resource-group lifeos-rg
   ```

3. **Restart app**:
   ```bash
   az webapp restart --name lifeos-backend --resource-group lifeos-rg
   ```

---

## Feature Status

For detailed feature status, roadmap, and implementation details, see [FEATURE_STATUS.md](./FEATURE_STATUS.md).

### Summary

- ✅ **13 core features** fully implemented and functional
- ✅ **41 major enhancements** completed
- ✅ **4 new feature modules** added (Financial, Spiritual Life, Books, Immigration)
- ✅ **Dashboard redesigned** with 12 interactive widgets
- ✅ **Export functionality** (PDF, CSV) for multiple modules
- ✅ **All planned enhancements** from original spec completed
- ✅ **Database schema** solid and extensible (36+ tables)
- ✅ **Azure infrastructure** set up and working
- ✅ **Authentication** production-ready
- ✅ **User experience** consistent and polished

### Recent Fixes

- ✅ Net worth `/latest` endpoint fixed
- ✅ Financial Snapshot widget layout fixed
- ✅ Identity card-based view with auto-save
- ✅ Task counting includes done tasks
- ✅ Career role input added
- ✅ Immigration display order fixed
- ✅ Analytics endpoints fixed
- ✅ Notifications job (streak calculation) fixed
- ✅ Books form submission fixed
- ✅ Dashboard reading progress fixed
- ✅ Habit date handling (local timezone) fixed

---

## License

MIT License - see LICENSE file for details.

---

## Additional Resources

- [Azure Setup Guide](./azure/README.md) - Detailed Azure deployment instructions
- [Feature Status](./FEATURE_STATUS.md) - Complete feature roadmap and status
- [Database Migrations](./database/migrations/) - All SQL migration files
