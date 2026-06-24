const supabasePublicUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '') || ''

export const studioUsersUrl = supabasePublicUrl
  ? `${supabasePublicUrl}/project/default/auth/users`
  : null

export function isVpsAuthError(message = '') {
  return /500|VPS|blocked|auth server/i.test(message)
}

export default function VpsSetupHelp({ onSignIn }) {
  return (
    <div className="text-left text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
      <p className="font-semibold text-amber-900">First-time setup (VPS signup is broken)</p>
      <ol className="list-decimal list-inside space-y-2">
        <li>
          Open{' '}
          {studioUsersUrl ? (
            <a
              href={studioUsersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-blue underline font-medium"
            >
              Supabase Studio → Users
            </a>
          ) : (
            'Supabase Studio → Authentication → Users'
          )}
          , click <strong>Add user</strong>, create your account
        </li>
        <li>
          Come back here and{' '}
          {onSignIn ? (
            <button type="button" onClick={onSignIn} className="text-primary-blue underline font-medium">
              Sign in
            </button>
          ) : (
            'Sign in'
          )}{' '}
          with that email and password
        </li>
        <li className="text-gray-600">
          Optional — fix signup forever: in Hostinger Docker <code className="bg-white px-1 rounded">.env</code> set{' '}
          <code className="bg-white px-1 rounded">ENABLE_EMAIL_AUTOCONFIRM=true</code>, restart{' '}
          <code className="bg-white px-1 rounded">supabase-auth</code>
        </li>
      </ol>
    </div>
  )
}
