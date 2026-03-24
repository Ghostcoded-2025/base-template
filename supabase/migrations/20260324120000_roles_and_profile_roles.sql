-- Global role catalog and profile membership. Client writes go through Edge Functions (service_role).

CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profile_roles (
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, role_id)
);

CREATE INDEX profile_roles_role_id_idx ON public.profile_roles (role_id);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles are readable by authenticated users"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read own profile roles"
  ON public.profile_roles
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies on profile_roles for authenticated: only service_role bypasses RLS.

GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.profile_roles TO authenticated;

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
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_has_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(text) TO authenticated;

-- Bootstrap: after your first user exists, grant super_admin (and admin) via SQL or Edge Function once
-- you have one super_admin. Example (replace :user_id):
-- INSERT INTO public.profile_roles (profile_id, role_id)
-- SELECT :user_id, r.id FROM public.roles r WHERE r.name = 'super_admin';
-- INSERT INTO public.profile_roles (profile_id, role_id)
-- SELECT :user_id, r.id FROM public.roles r WHERE r.name = 'admin'
--   ON CONFLICT DO NOTHING;
