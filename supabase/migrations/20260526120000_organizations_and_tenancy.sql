-- Multi-tenant organizations, per-org roles, storage buckets, RLS, signup provisioning.

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  storage_bucket_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.bootstrap_organization_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  NEW.storage_bucket_id := NEW.id::text;

  INSERT INTO storage.buckets (id, name, public)
  VALUES (NEW.storage_bucket_id, NEW.storage_bucket_id, false)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_set_storage_bucket
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.bootstrap_organization_storage();

-- ---------------------------------------------------------------------------
-- Profiles: membership via org_id
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT;

CREATE INDEX profiles_org_id_idx ON public.profiles (org_id);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_org_key UNIQUE (id, org_id);

-- ---------------------------------------------------------------------------
-- Roles: per-org catalog + global super_admin only
-- ---------------------------------------------------------------------------

ALTER TABLE public.roles
  ADD COLUMN org_id uuid REFERENCES public.organizations (id) ON DELETE CASCADE;

DELETE FROM public.roles;

INSERT INTO public.roles (name, org_id)
VALUES ('super_admin', NULL);

ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_name_key;

ALTER TABLE public.roles
  ADD CONSTRAINT roles_super_admin_global_chk CHECK (
    (name = 'super_admin' AND org_id IS NULL)
    OR (name <> 'super_admin' AND org_id IS NOT NULL)
  );

CREATE UNIQUE INDEX roles_name_global_uidx
  ON public.roles (name)
  WHERE org_id IS NULL;

CREATE UNIQUE INDEX roles_org_name_uidx
  ON public.roles (org_id, name)
  WHERE org_id IS NOT NULL;

ALTER TABLE public.roles
  ADD CONSTRAINT roles_id_org_key UNIQUE (id, org_id);

CREATE OR REPLACE FUNCTION public.bootstrap_organization_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.roles (name, org_id)
  VALUES
    ('admin', NEW.id),
    ('staff', NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_bootstrap_roles
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.bootstrap_organization_roles();

-- ---------------------------------------------------------------------------
-- profile_roles: validate role org matches profile org
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_profile_role_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_org uuid;
  role_org uuid;
  role_nm text;
BEGIN
  SELECT p.org_id INTO profile_org
  FROM public.profiles p
  WHERE p.id = NEW.profile_id;

  IF profile_org IS NULL THEN
    RAISE EXCEPTION 'profile not found for profile_roles assignment';
  END IF;

  SELECT r.org_id, r.name INTO role_org, role_nm
  FROM public.roles r
  WHERE r.id = NEW.role_id;

  IF role_nm IS NULL THEN
    RAISE EXCEPTION 'role not found';
  END IF;

  IF role_nm = 'super_admin' THEN
    IF role_org IS NOT NULL THEN
      RAISE EXCEPTION 'invalid super_admin role row';
    END IF;
    RETURN NEW;
  END IF;

  IF role_org IS NULL OR role_org <> profile_org THEN
    RAISE EXCEPTION 'role org must match profile org';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_roles_validate_membership
  BEFORE INSERT OR UPDATE ON public.profile_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_role_membership();

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_org(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT target_org_id IS NOT NULL
    AND target_org_id = public.current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_role(role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_roles pr
    INNER JOIN public.roles r ON r.id = pr.role_id
    WHERE pr.profile_id = auth.uid()
      AND r.name = role_name
      AND (
        r.org_id IS NULL
        OR r.org_id = public.current_user_org_id()
      )
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_org_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_belongs_to_org(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_has_role(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Signup: org membership only; roles assigned via assign-role (service role)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_org text;
  meta_role text;
  v_org_id uuid;
BEGIN
  meta_org := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'org_id', '')), '');
  meta_role := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'role_id', '')), '');

  IF meta_role IS NOT NULL THEN
    RAISE EXCEPTION 'role_id must not be set at signup';
  END IF;

  IF meta_org IS NULL THEN
    RAISE EXCEPTION 'signup requires org_id in user metadata';
  END IF;

  BEGIN
    v_org_id := meta_org::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'org_id must be a valid UUID';
  END;

  IF NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = v_org_id) THEN
    RAISE EXCEPTION 'organization not found';
  END IF;

  INSERT INTO public.profiles (id, full_name, org_id)
  VALUES (
    NEW.id,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    v_org_id
  );

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Storage: per-org bucket policies
-- ---------------------------------------------------------------------------

CREATE POLICY "Org bucket select own tenant"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = public.current_user_org_id()::text);

CREATE POLICY "Org bucket insert own tenant"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = public.current_user_org_id()::text);

CREATE POLICY "Org bucket update own tenant"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = public.current_user_org_id()::text)
  WITH CHECK (bucket_id = public.current_user_org_id()::text);

CREATE POLICY "Org bucket delete own tenant"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = public.current_user_org_id()::text);

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are updatable by owner" ON public.profiles;

CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Profiles are updatable by owner"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND org_id = public.current_user_org_id());

DROP POLICY IF EXISTS "Roles are readable by authenticated users" ON public.roles;

CREATE POLICY "Authenticated roles readable in tenant"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.current_user_org_id()
    OR (
      org_id IS NULL
      AND name = 'super_admin'
      AND public.current_user_has_role('super_admin')
    )
  );

DROP POLICY IF EXISTS "Users can read own profile roles" ON public.profile_roles;

CREATE POLICY "Users can read own profile roles"
  ON public.profile_roles
  FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.roles r
      WHERE r.id = profile_roles.role_id
        AND (
          r.org_id IS NULL
          OR r.org_id = public.current_user_org_id()
        )
    )
  );

CREATE POLICY "Organizations readable for signup"
  ON public.organizations
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.organizations TO anon, authenticated;

ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profile_roles FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Auto-enable RLS on new public tables
-- ---------------------------------------------------------------------------

DROP EVENT TRIGGER IF EXISTS rls_auto_enable_trigger;

CREATE EVENT TRIGGER rls_auto_enable_trigger
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.rls_auto_enable();
