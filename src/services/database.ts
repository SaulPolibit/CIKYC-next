import { supabase, supabaseDb } from '@/lib/supabase';
import type { User, VerifiedUser, CreateVerifiedUserData, CreatedLink, CreateLinkData } from '@/types';

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

export async function deleteUser(userId: string, email?: string, hardDelete = false): Promise<void> {
  const params = new URLSearchParams({ id: userId });
  if (email) {
    params.append('email', email);
  }
  if (hardDelete) {
    params.append('hardDelete', 'true');
  }

  const response = await fetch(`/api/admin/users?${params.toString()}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete user');
  }
}

export async function toggleUserStatus(userId: string, email: string, isActive: boolean): Promise<void> {
  const response = await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, email, isActive }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update user status');
  }
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

// Created links collection operations
export async function addCreatedLink(linkData: CreateLinkData): Promise<CreatedLink> {
  const { data, error } = await supabase
    .from('created_links')
    .insert([linkData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllCreatedLinks(): Promise<CreatedLink[]> {
  const { data, error } = await supabase
    .from('created_links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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

export async function deleteVerifiedUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('verified_users')
    .delete()
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

// Sign up user (creates auth user and database record via admin API)
export async function signUpUser(
  email: string,
  password: string,
  name: string,
  role: string
): Promise<void> {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name, role }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create user');
  }
}
