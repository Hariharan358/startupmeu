# TaskFlow — Task Management Application

TaskFlow is a modern, full-featured task management web application where users can register, log in, and manage their personal tasks with priorities, statuses, due dates, search, filtering, and a live statistics dashboard.

## Key Features

- **User Authentication** — Register and log in with email and password. Sessions persist across reloads. Protected routes redirect unauthenticated users to login.
- **Task CRUD** — Create, read, update, and delete tasks with title, description, status, priority, and optional due date.
- **Status Management** — Change task status between Pending, In Progress, and Completed.
- **Priority Levels** — Assign Low, Medium, or High priority to tasks.
- **Search** — Search tasks by title or description with debounced input.
- **Filtering** — Filter tasks by status and priority.
- **Sorting** — Sort tasks by creation date or due date, ascending or descending.
- **Dashboard** — Live statistics including total tasks, pending, in progress, completed, completion rate percentage, and recent tasks — all calculated from the authenticated user's actual data.
- **Responsive Design** — Works across desktop, tablet, and mobile with a collapsible sidebar.
- **Security** — Row-level security enforces per-user data isolation at the database level. Users can only access their own tasks.
- **UX Polish** — Loading indicators, empty states, error messages, confirmation dialogs for destructive actions, and accessible form labels.

## Technologies Used

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Icons | Lucide React |
| Backend / Database | Supabase (PostgreSQL, Auth, Row-Level Security) |
| Data Access | Supabase JS client (direct-to-database with RLS) |

### Architecture Note

The original specification called for a MERN stack (MongoDB, Express, React, Node). This implementation uses **Supabase** as the backend, which provides the same capabilities — authentication, protected data access, per-user ownership enforcement, and server-side validation — through PostgreSQL with row-level security policies rather than a custom Express API. This architecture is more secure because ownership checks are enforced at the database level, not just in application middleware.

## Architecture and Folder Structure

```
taskflow/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AppLayout.tsx    # Layout wrapper with sidebar + outlet
│   │   ├── ConfirmDialog.tsx# Delete confirmation modal
│   │   ├── ErrorMessage.tsx # Error alert with dismiss
│   │   ├── LoadingSpinner.tsx
│   │   ├── ProtectedRoute.tsx # Auth guard for protected pages
│   │   ├── Sidebar.tsx      # Navigation sidebar (responsive)
│   │   └── TaskCard.tsx     # Task list item card
│   ├── context/
│   │   └── AuthContext.tsx  # Auth provider (session, profile, sign in/up/out)
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client singleton
│   │   ├── tasks.ts         # Task data access functions (CRUD, stats)
│   │   └── format.ts        # Date formatting and style helpers
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── TaskDetailPage.tsx
│   │   ├── TaskFormPage.tsx # Create & edit
│   │   └── TasksPage.tsx    # All tasks with search/filter/sort
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── App.tsx              # Router and route definitions
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind + global styles
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.app.json
├── vite.config.ts
└── README.md
```

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A Supabase project (already provisioned in this environment)

## Environment Variable Configuration

The following environment variables are required in a `.env` file at the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are pre-populated in this environment. For a fresh setup, create a `.env` file based on these variables. **Never commit `.env` to version control.**

## Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/taskflow-mern.git
cd taskflow-mern

# Install dependencies
npm install

# Create .env file with your Supabase credentials
# (See Environment Variable Configuration above)
```

## Running the Application

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:5173
```

## Production Build

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## Type Checking and Linting

```bash
# Run TypeScript type checking
npm run typecheck

# Run ESLint
npm run lint
```

## API / Data Access Documentation

TaskFlow uses Supabase's direct-to-database access pattern with row-level security (RLS). The frontend communicates with PostgreSQL tables through the Supabase JS client, and all access control is enforced at the database level.

### Authentication

| Action | Method | Description |
|--------|--------|-------------|
| Register | `supabase.auth.signUp()` | Creates auth user + profile row |
| Login | `supabase.auth.signInWithPassword()` | Authenticates and creates session |
| Logout | `supabase.auth.signOut()` | Destroys session |
| Current User | `supabase.auth.getSession()` | Returns current session |

### Tasks

All task operations are scoped to the authenticated user via RLS policies. The `user_id` column defaults to `auth.uid()`, so even if a client omits it, the database fills it from the session.

| Operation | Table Access | Notes |
|-----------|-------------|-------|
| List Tasks | `SELECT FROM tasks` | Supports search (ilike), status filter, priority filter, sort by created_at or due_date |
| Create Task | `INSERT INTO tasks` | RLS ensures user_id = auth.uid() |
| View Task | `SELECT FROM tasks WHERE id = ?` | RLS blocks access to other users' tasks |
| Update Task | `UPDATE tasks` | RLS USING + WITH CHECK ensure ownership |
| Change Status | `UPDATE tasks SET status` | Same ownership enforcement |
| Delete Task | `DELETE FROM tasks` | RLS USING ensures ownership |
| Dashboard Stats | `SELECT status FROM tasks` | Computed client-side from user's tasks |

### Example: Creating a Task

```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert({
    title: 'Finish quarterly report',
    description: 'Compile Q3 metrics and submit to finance',
    status: 'pending',
    priority: 'high',
    due_date: '2026-10-15T00:00:00.000Z',
  })
  .select()
  .single();
```

### Example: Fetching Tasks with Filters

```typescript
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('status', 'in_progress')
  .eq('priority', 'high')
  .order('due_date', { ascending: true });
```

## Security and Authentication

### Authentication Flow

1. Users register with name, email, and password via Supabase Auth (email/password).
2. Passwords are hashed by Supabase Auth — plaintext passwords are never stored.
3. On successful registration, a profile row is created in the `profiles` table linked to the auth user.
4. On login, Supabase issues a JWT session token that persists in the browser.
5. Protected routes check for an active session and redirect to login if absent.

### Row-Level Security (RLS)

Both `profiles` and `tasks` tables have RLS enabled with the following policies:

- **profiles**: Users can SELECT, INSERT, and UPDATE only their own profile row (`auth.uid() = id`).
- **tasks**: Users can SELECT, INSERT, UPDATE, and DELETE only tasks where `auth.uid() = user_id`.

This means:
- Users **cannot** access or modify other users' tasks — the database enforces this, not just the frontend.
- Even if a malicious client sends another user's task ID, the RLS policy blocks the query.
- The `user_id` column defaults to `auth.uid()`, so users cannot assign tasks to someone else.

### Database-Level Validation

- Title: required, max 200 characters (CHECK constraint)
- Description: max 2000 characters (CHECK constraint)
- Status: must be `pending`, `in_progress`, or `completed` (CHECK constraint)
- Priority: must be `low`, `medium`, or `high` (CHECK constraint)
- Email: unique constraint on profiles

### JWT and Session Handling

- JWTs are managed by the Supabase client and stored in browser localStorage by default.
- Sessions auto-refresh when the token is near expiry.
- **Security trade-off**: localStorage-based tokens are accessible to JavaScript on the same origin, making them potentially vulnerable to XSS. For a production application with higher security requirements, consider using HttpOnly cookies with CSRF protection. This implementation uses localStorage for simplicity as is common in SPA applications.

## Screenshots

> Screenshots will be added after the application is deployed and tested.
>
> **Screenshot placeholders:**
> - [ ] Login page
> - [ ] Register page
> - [ ] Dashboard with statistics
> - [ ] All Tasks page with filters
> - [ ] Task creation form
> - [ ] Task detail page
> - [ ] 404 page
> - [ ] Mobile responsive view

## Confirmation: Code0 Usage

Code0 was used throughout the development process in VS Code for code generation, debugging, and project structure management.

## AI Development Experience

> **Note:** The following is a template for you to edit with your actual experience. Do not claim specific outcomes unless you verified them yourself.

### Overview

[Describe your overall experience using Code0 to build TaskFlow. Was it helpful? What worked well? What was challenging?]

### Code0-Assisted Tasks

1. **React Dashboard and Reusable Component Development**
   - [Describe how Code0 helped build the dashboard, task cards, sidebar, and shared components. Did the generated components work on the first try? Did you need to adjust styling or structure?]

2. **Authentication and Data Access Implementation**
   - [Describe how Code0 helped set up the auth context, protected routes, and Supabase integration. Did the auth flow work correctly? Were there any issues with session handling?]

3. **Database Schema Design and Row-Level Security**
   - [Describe how Code0 helped design the profiles and tasks tables, including RLS policies. Did you understand the security model? Were there any policy issues?]

4. **Debugging Integration Issues**
   - [Describe any bugs or issues you encountered and how Code0 helped resolve them. Did type checking catch errors? Were there runtime issues? Be honest about what broke and what was fixed.]

5. **Refactoring and Code Quality**
   - [Describe any refactoring you did with Code0 assistance. Did you improve code organization, fix linting issues, or optimize components?]

### Review and Validation

AI-generated code was reviewed and validated by [your name] before submission. The following checks were performed:

- [ ] TypeScript type checking passes (`npm run typecheck`)
- [ ] Production build succeeds (`npm run build`)
- [ ] User registration and login works
- [ ] Task creation, editing, deletion, and status changes work
- [ ] Search, filtering, and sorting work
- [ ] Dashboard statistics reflect actual data
- [ ] Users cannot access other users' tasks
- [ ] Responsive layout works on mobile, tablet, and desktop

> Check each box only after you have personally verified the behavior.

## Testing

### Running Tests

> **Note:** Automated tests are not included in this version. The application was verified through:
> - TypeScript type checking (`npm run typecheck` — passes)
> - Production build (`npm run build` — passes)
> - Manual verification of all features

### Test Coverage Plan

The following areas should be covered by automated tests:

**Backend / Data Access:**
- Successful registration and login
- Invalid credentials rejection
- Duplicate email registration prevention
- Unauthenticated access rejection
- Task CRUD operations
- Invalid task field validation
- Cross-user access prevention
- Nonexistent task ID handling

**Frontend:**
- Form validation (required fields, email format, password length)
- Login and registration flows
- Task creation and editing
- Search and filter interactions
- Dashboard statistics rendering
- Protected route redirects

## GitHub Submission

### Initialize and Push

```bash
# Initialize git repository
git init

# Stage all files (ensure .env is in .gitignore)
git add .

# Verify .env is NOT staged
git status

# Create initial commit
git commit -m "feat: complete TaskFlow task management application"

# Create GitHub repository using GitHub CLI
gh repo create taskflow-mern --public --source=. --remote=origin

# Push to GitHub
git push -u origin main
```

### If GitHub CLI is not authenticated

1. Run `gh auth login` and follow the prompts
2. Or create the repository manually on [github.com](https://github.com/new) and run:
   ```bash
   git remote add origin https://github.com/<your-username>/taskflow-mern.git
   git branch -M main
   git push -u origin main
   ```

### Verify Submission

```bash
# Check remote is configured
git remote -v

# Check working tree is clean
git status
```

### .gitignore Checklist

Ensure the following are excluded from version control:
- `.env` (contains Supabase credentials)
- `node_modules/`
- `dist/`
- `.bolt/`

## License

This project is part of a technical development assessment by StartupMeu.
