-- ============================================
-- C-IKYC Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- Stores application users (agents, operators, admins)
-- Roles: '1' = Agent, '2' = Operator Admin, '3' = Organization Admin
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT '1' CHECK (role IN ('1', '2', '3')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 2. VERIFIED USERS TABLE
-- Stores KYC verification records for clients
-- ============================================

CREATE TABLE IF NOT EXISTS verified_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  user_email TEXT NOT NULL,
  agent_email TEXT NOT NULL,
  agent_name TEXT,
  kyc_url TEXT,
  kyc_id TEXT,
  kyc_status TEXT DEFAULT 'Not Started' CHECK (
    kyc_status IN (
      'Not Started',
      'In Progress',
      'Approved',
      'Declined',
      'In Review',
      'Expired',
      'Abandoned',
      'Kyc Expired'
    )
  ),
  date_sent TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  downloaded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_verified_users_agent_email ON verified_users(agent_email);
CREATE INDEX IF NOT EXISTS idx_verified_users_kyc_status ON verified_users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_verified_users_date_sent ON verified_users(date_sent DESC);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES FOR USERS TABLE
-- ============================================

-- Allow authenticated users to read all users
CREATE POLICY "Allow read access for authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert new users (for admin user creation)
CREATE POLICY "Allow insert for authenticated users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete users (admin only in practice)
CREATE POLICY "Allow delete for authenticated users"
  ON users
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow anon users to read (for login flow)
CREATE POLICY "Allow anon read for login"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- 5. RLS POLICIES FOR VERIFIED_USERS TABLE
-- ============================================

-- Allow authenticated users to read verified users
CREATE POLICY "Allow read verified_users for authenticated"
  ON verified_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert verified users
CREATE POLICY "Allow insert verified_users for authenticated"
  ON verified_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update verified users
CREATE POLICY "Allow update verified_users for authenticated"
  ON verified_users
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- 6. OPTIONAL: CREATE INITIAL ADMIN USER
-- Uncomment and modify the email/name below
-- After running this, create the auth user in
-- Supabase Dashboard: Authentication → Add User
-- ============================================

-- INSERT INTO users (email, name, role)
-- VALUES ('admin@example.com', 'Admin User', '3');

-- ============================================
-- 7. OPTIONAL: SAMPLE DATA FOR TESTING
-- Uncomment to add test data
-- ============================================

-- INSERT INTO verified_users (name, phone, user_email, agent_email, agent_name, kyc_status)
-- VALUES
--   ('Juan Pérez', '+521234567890', 'juan@example.com', 'admin@example.com', 'Admin User', 'Approved'),
--   ('María García', '+529876543210', 'maria@example.com', 'admin@example.com', 'Admin User', 'In Progress'),
--   ('Carlos López', '+525555555555', 'carlos@example.com', 'admin@example.com', 'Admin User', 'Not Started');
