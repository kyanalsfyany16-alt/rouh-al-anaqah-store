// Edge Function: update-user — تعديل مستخدم آمن عبر Service Role
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')
    const supabaseAnon = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: { user: caller }, error: callerErr } = await supabaseAnon.auth.getUser()
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

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
    const { user_id, email, first_name, last_name, phone, role, is_active } = body as {
      user_id: string; email?: string; first_name?: string; last_name?: string; phone?: string; role?: string; is_active?: boolean
    }

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: target } = await supabaseAdmin.from('profiles').select('role, is_active, email').eq('id', user_id).single()
    if (!target) {
      return new Response(JSON.stringify({ error: 'Target not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Prevent modifying super_admin unless caller is super_admin
    if (target.role === 'super_admin' && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Only super_admin can modify super_admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Role change validation
    if (role && role !== target.role) {
      if (role === 'super_admin' && !isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Cannot assign super_admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (role === 'admin' && !isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Only super_admin can assign admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (role === 'employee' && !(callerRole === 'admin' || isSuperAdmin)) {
        return new Response(JSON.stringify({ error: 'Not authorized to assign employee' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // Prevent self-role escalation via this endpoint (optional extra)
    if (user_id === caller.id && role && role !== target.role) {
      return new Response(JSON.stringify({ error: 'Cannot change own role' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Update email in auth.users if changed
    if (email && email !== target.email) {
      const { error: emailErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, { email })
      if (emailErr) {
        return new Response(JSON.stringify({ error: emailErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (email !== undefined) updateData.email = email
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (is_active !== undefined) {
      // Prevent disabling super_admin unless super_admin
      if (target.role === 'super_admin' && is_active === false && !isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Cannot deactivate super_admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      updateData.is_active = is_active
    }

    const { data: updated, error: updateErr } = await supabaseAdmin.from('profiles').update(updateData).eq('id', user_id).select().single()
    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ user: updated }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
