-- Fix signup 500 errors on self-hosted Supabase (Hostinger VPS)
-- Run ALL of this in Supabase SQL Editor, then fix auth env vars on VPS (see bottom).

-- 0) Remove broken auth triggers/functions (common cause of signup 500)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 1) Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Customer',
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Safe profile trigger (never blocks signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_count INTEGER;
  user_role TEXT;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;

  IF profile_count = 0 THEN
    user_role := 'Admin';
  ELSE
    user_role := 'Customer';
  END IF;

  INSERT INTO public.profiles (id, name, email, role, balance, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    user_role,
    0,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3) Permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- VPS FIX (Hostinger Docker Manager → Compose → supabase → Edit → .env)
--
--   ENABLE_EMAIL_SIGNUP=true
--   ENABLE_EMAIL_AUTOCONFIRM=true
--
-- Then restart: docker compose restart auth
-- See also: supabase/HOSTINGER_VPS_FIX.env
--
-- OR create admin from your PC (bypasses signup):
--   Add SUPABASE_SERVICE_ROLE_KEY to .env
--   npm run create:admin
