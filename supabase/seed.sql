-- Optional seed data for local development.

-- Organizations (bootstrap trigger adds admin/staff roles per org).
INSERT INTO public.organizations (id, name)
VALUES
  (
    'f0000000-0000-4000-8000-000000000010',
    'Acme Corp'
  ),
  (
    'f0000000-0000-4000-8000-000000000020',
    'Globex Inc'
  )
ON CONFLICT (id) DO NOTHING;

-- Helper: auth.users + profile (handle_new_user). Roles inserted separately below.
CREATE OR REPLACE FUNCTION pg_temp.seed_auth_user(
  p_user_id uuid,
  p_identity_id uuid,
  p_email text,
  p_full_name text,
  p_org_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
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
  VALUES (
    p_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt('test1234', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', p_full_name,
      'org_id', p_org_id::text
    ),
    now(),
    now(),
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;

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
  VALUES (
    p_identity_id,
    p_user_id::text,
    p_user_id,
    jsonb_build_object(
      'sub', p_user_id::text,
      'email', p_email,
      'email_verified', true
    ),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

DO $$
DECLARE
  acme_id uuid := 'f0000000-0000-4000-8000-000000000010';
  admin_role_id uuid;
  staff_role_id uuid;
BEGIN
  SELECT id INTO admin_role_id
  FROM public.roles
  WHERE org_id = acme_id AND name = 'admin';

  SELECT id INTO staff_role_id
  FROM public.roles
  WHERE org_id = acme_id AND name = 'staff';

  PERFORM pg_temp.seed_auth_user(
    'a1000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    'admin@test.com',
    'Morgan Admin',
    acme_id
  );

  PERFORM pg_temp.seed_auth_user(
    'a1000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000002',
    'super_admin@test.com',
    'Riley Super',
    acme_id
  );

  PERFORM pg_temp.seed_auth_user(
    'a1000000-0000-4000-8000-000000000003',
    'b1000000-0000-4000-8000-000000000003',
    'staff@test.com',
    'Sam Staff',
    acme_id
  );

  INSERT INTO public.profile_roles (profile_id, role_id)
  VALUES
    ('a1000000-0000-4000-8000-000000000001'::uuid, admin_role_id),
    ('a1000000-0000-4000-8000-000000000003'::uuid, staff_role_id)
  ON CONFLICT DO NOTHING;
END;
$$;

INSERT INTO public.profile_roles (profile_id, role_id)
SELECT 'a1000000-0000-4000-8000-000000000002'::uuid, r.id
FROM public.roles r
WHERE r.name = 'super_admin'
  AND r.org_id IS NULL
ON CONFLICT DO NOTHING;
