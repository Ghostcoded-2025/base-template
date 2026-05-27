INSERT INTO public.roles (name)
VALUES ('admin'), ('super_admin')
ON CONFLICT (name) DO NOTHING;
