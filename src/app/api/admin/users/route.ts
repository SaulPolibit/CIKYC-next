import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to get auth user by email
async function getAuthUserByEmail(supabaseAdmin: SupabaseClient, email: string) {
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  return authUsers?.users.find(u => u.email === email);
}

// CREATE user
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, password, name, role } = await request.json();

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, role' },
        { status: 400 }
      );
    }

    // Create auth user with admin API (email pre-confirmed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth error creating user:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No user returned from authentication' },
        { status: 500 }
      );
    }

    // Add user to users table with is_active=true
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email,
          name,
          role,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating user:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// TOGGLE user active status (enable/disable)
export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId, email, isActive } = await request.json();

    if (!userId || !email || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email, isActive' },
        { status: 400 }
      );
    }

    // Update is_active in users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (dbError) {
      console.error('Database error updating user:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Get auth user and ban/unban
    const authUser = await getAuthUserByEmail(supabaseAdmin, email);
    if (authUser) {
      if (isActive) {
        // Unban user (set ban_duration to 'none' removes the ban)
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          { ban_duration: 'none' }
        );
        if (authError) {
          console.error('Auth error unbanning user:', authError);
        }
      } else {
        // Ban user permanently (until manually unbanned)
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          { ban_duration: '876600h' } // ~100 years
        );
        if (authError) {
          console.error('Auth error banning user:', authError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      isActive,
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// SOFT DELETE (disable user - same as PATCH with isActive=false)
export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const email = searchParams.get('email');
    const hardDelete = searchParams.get('hardDelete') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user id' },
        { status: 400 }
      );
    }

    if (hardDelete) {
      // Permanent delete - remove from database and auth
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) {
        console.error('Database error deleting user:', dbError);
        return NextResponse.json(
          { error: `Database error: ${dbError.message}` },
          { status: 500 }
        );
      }

      // Delete from auth if email provided
      if (email) {
        const authUser = await getAuthUserByEmail(supabaseAdmin, email);
        if (authUser) {
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
          if (authError) {
            console.error('Auth error deleting user:', authError);
          }
        }
      }
    } else {
      // Soft delete - just disable the user
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (dbError) {
        console.error('Database error disabling user:', dbError);
        return NextResponse.json(
          { error: `Database error: ${dbError.message}` },
          { status: 500 }
        );
      }

      // Ban auth user if email provided
      if (email) {
        const authUser = await getAuthUserByEmail(supabaseAdmin, email);
        if (authUser) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            authUser.id,
            { ban_duration: '876600h' }
          );
          if (authError) {
            console.error('Auth error banning user:', authError);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
