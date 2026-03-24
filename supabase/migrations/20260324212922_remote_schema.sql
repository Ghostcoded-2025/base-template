drop extension if exists "pg_net";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.current_user_has_role(role_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_roles pr
    INNER JOIN public.roles r ON r.id = pr.role_id
    WHERE pr.profile_id = auth.uid()
      AND r.name = role_name
  );
$function$
;


