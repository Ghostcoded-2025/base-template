INSERT INTO public.roles (name)
VALUES ('staff')
ON CONFLICT (name) DO NOTHING;
