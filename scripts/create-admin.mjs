/**
 * Create the first admin user via Supabase service role (bypasses broken signup on VPS).
 *
 * 1. In Supabase Studio → Project Settings → API, copy the service_role key
 * 2. Add to .env (NOT prefixed with VITE_ — server only):
 *      SUPABASE_SERVICE_ROLE_KEY=eyJ...
 * 3. Run supabase/fix-signup-500.sql in SQL Editor first
 * 4. Run: npm run create:admin
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env.mjs'

const env = loadEnv()
const url = env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

const email = (process.argv[2] || env.ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase()
const password = process.argv[3] || env.ADMIN_PASSWORD || 'admin123'
const name = process.argv[4] || env.ADMIN_NAME || 'Administrator'

if (!url) {
  console.error('Missing VITE_SUPABASE_URL in .env')
  process.exit(1)
}

if (!serviceKey) {
  console.error(`
Missing SUPABASE_SERVICE_ROLE_KEY in .env

Get it from Supabase Studio → Settings → API → service_role (secret).
Add to .env:
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

Never prefix with VITE_ — do not expose this key in the browser.
`)
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log(`Creating admin at ${url} ...`)

const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
const existing = listData?.users?.find((u) => u.email?.toLowerCase() === email)

let userId = existing?.id

if (existing) {
  console.log(`User ${email} already exists (${userId}). Updating password and profile...`)
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: { name, role: 'Admin' }
  })
  if (updateError) {
    console.error('Failed to update user:', updateError.message)
    process.exit(1)
  }
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: 'Admin' }
  })
  if (error) {
    console.error('Failed to create user:', error.message)
    process.exit(1)
  }
  userId = data.user.id
  console.log('Auth user created:', userId)
}

const profile = {
  id: userId,
  name,
  email,
  role: 'Admin',
  balance: 0,
  created_at: new Date().toISOString()
}

const { error: profileError } = await supabase.from('profiles').upsert(profile)
if (profileError) {
  console.error('Failed to save profile:', profileError.message)
  console.error('Run supabase/fix-signup-500.sql in SQL Editor, then retry.')
  process.exit(1)
}

console.log(`
Done! Admin account ready:
  Email:    ${email}
  Password: ${password}

Log in at your app — signup on VPS can still be fixed separately with HOSTINGER_VPS_FIX.env
`)
