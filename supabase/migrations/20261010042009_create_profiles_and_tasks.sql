/*
# Create profiles and tasks tables for TaskFlow

## Overview
Creates the core data model for a multi-user task management application.
Users register and log in via Supabase Auth (email/password).
Each user manages their own personal tasks — no cross-user access.

## New Tables

### profiles
- `id` (uuid, primary key, references auth.users) — one row per registered user
- `name` (text, not null) — display name collected at registration
- `email` (text, unique, not null) — normalized email, mirrors auth.users
- `created_at` (timestamptz) — row creation timestamp
- `updated_at` (timestamptz) — row modification timestamp

### tasks
- `id` (uuid, primary key)
- `title` (text, not null, max 200 chars) — task title
- `description` (text, max 2000 chars) — optional task description
- `status` (text, not null, default 'pending') — one of: pending, in_progress, completed
- `priority` (text, not null, default 'medium') — one of: low, medium, high
- `due_date` (timestamptz, nullable) — optional due date
- `user_id` (uuid, not null, references auth.users, default auth.uid()) — task owner
- `created_at` (timestamptz) — creation timestamp
- `updated_at` (timestamptz) — modification timestamp

## Indexes
- `idx_tasks_user_id` — fast lookups of a user's tasks
- `idx_tasks_user_status` — filtering by status within a user's tasks
- `idx_tasks_user_priority` — filtering by priority within a user's tasks
- `idx_tasks_user_due_date` — sorting by due date

## Security (Row Level Security)
Both tables have RLS enabled. All policies are scoped to `TO authenticated`
and use `auth.uid()` for ownership checks.

### profiles
- SELECT: user can read only their own profile row
- INSERT: user can insert only their own profile row (WITH CHECK)
- UPDATE: user can update only their own profile row (USING + WITH CHECK)
- No DELETE policy (profiles are not deleted via the app)

### tasks
- SELECT: user can read only tasks where user_id = auth.uid()
- INSERT: user can insert only tasks owned by themselves (WITH CHECK)
- UPDATE: user can update only their own tasks (USING + WITH CHECK)
- DELETE: user can delete only their own tasks (USING)

## Important Notes
1. The `user_id` column on `tasks` has `DEFAULT auth.uid()` so that frontend
   inserts that omit user_id still satisfy the INSERT WITH CHECK policy.
2. Status values are constrained by a CHECK constraint to pending, in_progress, completed.
3. Priority values are constrained by a CHECK constraint to low, medium, high.
4. Title length is enforced at the database level (char_length <= 200).
5. Description length is enforced at the database level (char_length <= 2000).
*/

-- ===== PROFILES TABLE =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== TASKS TABLE =====
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) <= 200),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date timestamptz,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks(user_id, due_date);

-- Auto-update updated_at on tasks
DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
