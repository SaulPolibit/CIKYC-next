import { supabase, supabaseDb } from '@/lib/supabase';
import type { User, VerifiedUser, CreateVerifiedUserData, KYCStatusSpanish, statusReverseMap } from '@/types';

// Users collection operations
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  console.log('Fetching user by email:', email);

  // Use supabaseDb to avoid abort conflicts with auth client
  const { data, error } = await supabaseDb
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.log('getUserByEmail error:', error.code, error.message, error.details);
    // Ignore AbortError which happens during React re-renders
    if (error.message?.includes('AbortError') || error.code === '20') {
      console.log('Request was aborted, returning null');
      return null;
    }
    throw new Error(`Database error: ${error.message || error.code || 'Unknown error'}`);
  }

  console.log('getUserByEmail result:', data);
  return data;
}

export async function addUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
}

// Verified users collection operations
export async function getAllVerifiedUsers(
  isAdmin: boolean,
  agentEmail: string
): Promise<VerifiedUser[]> {
  let query = supabase
    .from('verified_users')
    .select('*')
    .order('date_sent', { ascending: false });

  // Non-admin users only see their own verified users
  if (!isAdmin) {
    query = query.eq('agent_email', agentEmail);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function addVerifiedUser(userData: CreateVerifiedUserData): Promise<VerifiedUser> {
  const { data, error } = await supabase
    .from('verified_users')
    .insert([{
      ...userData,
      date_sent: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVerifiedUserStatus(
  id: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('verified_users')
    .update({ kyc_status: status })
    .eq('id', id);

  if (error) throw error;
}

// Filter verified users by status and search string
export function filterVerifiedUsers(
  users: VerifiedUser[],
  selectedStatuses: string[],
  searchString: string
): VerifiedUser[] {
  let filtered = users;

  // Filter by status if any selected
  if (selectedStatuses.length > 0) {
    filtered = filtered.filter((user) =>
      selectedStatuses.includes(user.kyc_status)
    );
  }

  // Filter by search string
  if (searchString.trim()) {
    const search = searchString.toLowerCase().trim();
    filtered = filtered.filter(
      (user) =>
        user.name?.toLowerCase().includes(search) ||
        user.user_email?.toLowerCase().includes(search) ||
        user.phone?.includes(search)
    );
  }

  return filtered;
}

// Sign up user (creates auth user and database record)
export async function signUpUser(
  email: string,
  password: string,
  name: string,
  role: string
): Promise<void> {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // Add user to database
  if (authData.user) {
    await addUser({
      email,
      name,
      role: role as '1' | '2' | '3',
    });
  }
}
