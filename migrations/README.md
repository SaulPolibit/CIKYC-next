# Database Migrations

This folder contains SQL migrations for setting up the Supabase database.

## How to Run

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the SQL from each file and run them in order

## Migration Files

### 001_initial_schema.sql
Creates the database tables and security policies:
- `users` table - Application users (agents, admins)
- `verified_users` table - KYC verification records
- Row Level Security (RLS) policies

### 002_create_admin_user.sql
Template for creating your first admin user.
**Important:** Modify the email and name before running!

## Quick Setup

1. Run `001_initial_schema.sql` in SQL Editor
2. Create an Auth user in **Authentication → Users → Add User**
3. Modify `002_create_admin_user.sql` with your email
4. Run `002_create_admin_user.sql` in SQL Editor
5. Login to the app with your credentials

## User Roles

| Role | Value | Description |
|------|-------|-------------|
| Agent | `'1'` | Regular user, sees only own KYC records |
| Operator Admin | `'2'` | Can see all records, manage users |
| Organization Admin | `'3'` | Full access to all features |

## Troubleshooting

If you get permission errors:
- Make sure RLS is enabled on both tables
- Check that the policies were created successfully
- Verify your user exists in both Auth and the `users` table
