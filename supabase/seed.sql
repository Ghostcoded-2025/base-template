-- Optional seed data for local development.

INSERT INTO public.roles (name)
VALUES ('admin'), ('super_admin'), ('staff')
ON CONFLICT (name) DO NOTHING;

-- Deterministic UUIDs keep local URLs, docs, and debugging stable across resets.
-- GoTrue maps several auth.users token columns to non-nullable Go strings; NULL breaks password grant (500).
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
VALUES
  (
    'a1000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Morgan Admin"}'::jsonb,
    now(),
    now(),
    false,
    false
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'super_admin@test.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Riley Super"}'::jsonb,
    now(),
    now(),
    false,
    false
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'staff@test.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Sam Staff"}'::jsonb,
    now(),
    now(),
    false,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Email provider identities (required for sign-in with Supabase Auth).
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  (
    'b1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    jsonb_build_object(
      'sub', 'a1000000-0000-4000-8000-000000000001',
      'email', 'admin@test.com',
      'email_verified', true
    ),
    'email',
    now(),
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000002',
    jsonb_build_object(
      'sub', 'a1000000-0000-4000-8000-000000000002',
      'email', 'super_admin@test.com',
      'email_verified', true
    ),
    'email',
    now(),
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000003',
    jsonb_build_object(
      'sub', 'a1000000-0000-4000-8000-000000000003',
      'email', 'staff@test.com',
      'email_verified', true
    ),
    'email',
    now(),
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profile_roles (profile_id, role_id)
SELECT 'a1000000-0000-4000-8000-000000000001'::uuid, r.id
FROM public.roles r
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_roles (profile_id, role_id)
SELECT 'a1000000-0000-4000-8000-000000000002'::uuid, r.id
FROM public.roles r
WHERE r.name IN ('admin', 'super_admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_roles (profile_id, role_id)
SELECT 'a1000000-0000-4000-8000-000000000003'::uuid, r.id
FROM public.roles r
WHERE r.name = 'staff'
ON CONFLICT DO NOTHING;
