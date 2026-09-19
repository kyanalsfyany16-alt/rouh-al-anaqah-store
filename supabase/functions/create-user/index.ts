// Edge Function: create-user — إنشاء مستخدم آمن عبر Service Role
// لا تضع SUPABASE_SERVICE_ROLE_KEY في Frontend أبداً
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing env' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Caller auth via Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')

    // Client with caller token to verify caller
    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user: caller }, error: callerErr } = await supabaseAnon.auth.getUser()
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch caller profile
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role, is_active').eq('id', caller.id).single()
    if (!callerProfile || callerProfile.is_active === false) {
      return new Response(JSON.stringify({ error: 'Caller not authorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const callerRole = callerProfile.role as string
    const isSuperAdmin = callerRole === 'super_admin'
    const isAdmin = callerRole === 'admin' || isSuperAdmin

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Requires admin or super_admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const { email, password, first_name, last_name, phone, role } = body as {
      email: string; password: string; first_name?: string; last_name?: string; phone?: string; role?: string
    }

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const targetRole = role ?? 'customer'
    const allowedRoles = ['customer', 'employee', 'admin']
    if (!allowedRoles.includes(targetRole) && targetRole !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Role hierarchy enforcement
    // - employee cannot create anyone (already blocked by !isAdmin)
    // - admin cannot create admin/super_admin
    // - super_admin can create admin
    if (targetRole === 'admin' && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Only super_admin can create admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (targetRole === 'super_admin' && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Cannot create super_admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Create auth user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, phone },
    })

    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? 'Create failed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Upsert profile with target role
    const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
      id: created.user.id,
      email,
      first_name: first_name ?? null,
      last_name: last_name ?? null,
      phone: phone ?? null,
      role: targetRole,
      is_active: true,
    }, { onConflict: 'id' })

    if (profileErr) {
      // rollback auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(created.user.id)
      return new Response(JSON.stringify({ error: profileErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ user: { id: created.user.id, email, role: targetRole } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
