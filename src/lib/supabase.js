import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Real Supabase server URL from .env (e.g. Hostinger) */
export const remoteSupabaseUrl = rawUrl ? rawUrl.replace(/\/+$/, '') : ''

/**
 * In dev, route API calls through the Vite proxy (localhost) to avoid browser
 * SSL / network blocks against self-hosted Supabase domains.
 */
export function getSupabaseUrl() {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin
  }
  return remoteSupabaseUrl
}

export const supabaseUrl = remoteSupabaseUrl

export const isSupabaseConfigured = Boolean(remoteSupabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    'SUPABASE NOT CONFIGURED: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file, then restart the dev server.'
  )
} else if (import.meta.env.DEV) {
  console.info('[Supabase] Remote:', remoteSupabaseUrl)
  if (typeof window !== 'undefined') {
    console.info('[Supabase] Dev proxy via:', window.location.origin)
  }
}

async function supabaseFetch(input, init) {
  try {
    return await fetch(input, init)
  } catch (err) {
    const url = typeof input === 'string' ? input : input?.url
    console.error('[Supabase] Network request failed:', url, err)
    throw err
  }
}

function createSupabaseClient() {
  return createClient(getSupabaseUrl(), supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: supabaseFetch
    }
  })
}

export const supabase = isSupabaseConfigured ? createSupabaseClient() : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart the dev server.'
    )
  }
  return supabase
}

export async function testSupabaseConnection(timeoutMs = 8000) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured in .env')
  }

  const baseUrl = getSupabaseUrl()
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const authRes = await fetch(`${baseUrl}/auth/v1/health`, {
      headers,
      signal: controller.signal
    })
    if (!authRes.ok) {
      throw new Error(
        `Auth health check failed (${authRes.status}). Your VITE_SUPABASE_ANON_KEY may not match ${remoteSupabaseUrl}.`
      )
    }

    const restRes = await fetch(`${baseUrl}/rest/v1/`, {
      headers,
      signal: controller.signal
    })
    if (!restRes.ok && restRes.status !== 404) {
      throw new Error(`Database API check failed (${restRes.status}).`)
    }
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(
        `Supabase connection timed out after ${timeoutMs / 1000}s. Your VPS may be slow or offline (${remoteSupabaseUrl}).`
      )
    }
    if (err?.name === 'TypeError' || err?.message === 'Failed to fetch') {
      const hint = import.meta.env.DEV
        ? ' Restart npm run dev after editing .env.'
        : ' Check the server URL, SSL certificate, and that Supabase is online.'
      throw new Error(
        `Cannot reach Supabase at ${remoteSupabaseUrl || baseUrl}.${hint} (${err.message || 'network error'})`
      )
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export function formatSupabaseAuthError(error) {
  if (!error) return 'Authentication failed'

  const status = Number(error.status || error.code) || 0
  const name = error.name || ''
  const serverMsg =
    error.msg ||
    error.error_description ||
    (error.message && error.message !== '{}' ? error.message : '') ||
    ''

  if (status === 500) {
    return (
      'Signup is blocked by your VPS auth server (500). Use Supabase Studio → Users → Add user, ' +
      'or run npm run create:admin after adding SUPABASE_SERVICE_ROLE_KEY to .env.' +
      (serverMsg ? ` (${serverMsg})` : '')
    )
  }

  if (status === 401 || status === 403) {
    return 'Invalid Supabase anon key. Copy the anon/public key from your Hostinger Supabase dashboard into VITE_SUPABASE_ANON_KEY.'
  }

  if (
    serverMsg.includes('already registered') ||
    serverMsg.includes('already been registered')
  ) {
    return 'An account with this email already exists'
  }

  if (serverMsg && serverMsg !== 'Failed to fetch') {
    return serverMsg
  }

  const causeMsg =
    typeof error.cause === 'string'
      ? error.cause
      : error.cause?.message || error.cause?.code || ''

  if (
    name === 'AuthRetryableFetchError' ||
    error.message === 'Failed to fetch'
  ) {
    return (
      `Cannot connect to Supabase (${remoteSupabaseUrl || 'your server'}). ` +
      'Check VITE_SUPABASE_ANON_KEY is from the same Hostinger project and restart npm run dev.' +
      (causeMsg ? ` (${causeMsg})` : '')
    )
  }

  if (status) {
    return `Auth request failed (${status}). Check your VPS Supabase auth logs.`
  }

  return 'Authentication failed'
}
