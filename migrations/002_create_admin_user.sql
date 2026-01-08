-- ============================================
-- Create Admin User
-- ============================================
--
-- INSTRUCTIONS:
-- 1. First, create an Auth user in Supabase Dashboard:
--    - Go to Authentication → Users → Add User
--    - Enter email and password
--    - Click "Create User"
--
-- 2. Then run this SQL with YOUR email to create the user record:
--    (Replace the email, name values below)
--
-- 3. Role options:
--    - '1' = Agent (regular user, can only see own KYC records)
--    - '2' = Operator Admin (can see all records, manage users)
--    - '3' = Organization Admin (full access)
-- ============================================

-- Create admin user (MODIFY THIS WITH YOUR EMAIL)
INSERT INTO users (email, name, role)
VALUES ('your-email@example.com', 'Your Name', '3')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Verify the user was created
SELECT * FROM users WHERE email = 'your-email@example.com';
