-- Tenant policy linter (v1). Returns one row per violation.

-- Run via: npm run db:lint:tenancy



WITH domain_tables AS (

  SELECT c.relname AS table_name

  FROM pg_class c

  JOIN pg_namespace n ON n.oid = c.relnamespace

  WHERE n.nspname = 'public'

    AND c.relkind = 'r'

    AND c.relname NOT IN ('organizations', 'profile_roles')

),

missing_org_column AS (

  SELECT dt.table_name, 'missing_org_id_column' AS rule_id

  FROM domain_tables dt

  WHERE dt.table_name NOT IN ('profiles', 'roles')

    AND NOT EXISTS (

      SELECT 1

      FROM information_schema.columns col

      WHERE col.table_schema = 'public'

        AND col.table_name = dt.table_name

        AND col.column_name = 'org_id'

        AND col.is_nullable = 'NO'

    )

),

profiles_org AS (

  SELECT 'profiles' AS table_name, 'profiles_missing_org_id' AS rule_id

  WHERE NOT EXISTS (

    SELECT 1

    FROM information_schema.columns col

    WHERE col.table_schema = 'public'

      AND col.table_name = 'profiles'

      AND col.column_name = 'org_id'

      AND col.is_nullable = 'NO'

  )

),

roles_org AS (

  SELECT 'roles' AS table_name, 'roles_missing_org_id' AS rule_id

  WHERE NOT EXISTS (

    SELECT 1

    FROM information_schema.columns col

    WHERE col.table_schema = 'public'

      AND col.table_name = 'roles'

      AND col.column_name = 'org_id'

  )

),

missing_composite_profiles AS (

  SELECT 'profiles' AS table_name, 'missing_profiles_id_org_key' AS rule_id

  WHERE NOT EXISTS (

    SELECT 1

    FROM pg_constraint c

    JOIN pg_class t ON t.oid = c.conrelid

    JOIN pg_namespace n ON n.oid = t.relnamespace

    WHERE n.nspname = 'public'

      AND t.relname = 'profiles'

      AND c.contype = 'u'

      AND c.conname = 'profiles_id_org_key'

  )

),

missing_composite_roles AS (

  SELECT 'roles' AS table_name, 'missing_roles_id_org_key' AS rule_id

  WHERE NOT EXISTS (

    SELECT 1

    FROM pg_constraint c

    JOIN pg_class t ON t.oid = c.conrelid

    JOIN pg_namespace n ON n.oid = t.relnamespace

    WHERE n.nspname = 'public'

      AND t.relname = 'roles'

      AND c.contype = 'u'

      AND c.conname = 'roles_id_org_key'

  )

),

missing_rls AS (

  SELECT dt.table_name, 'rls_not_enabled' AS rule_id

  FROM domain_tables dt

  JOIN pg_class c ON c.relname = dt.table_name

  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'

  WHERE NOT c.relrowsecurity

),

missing_policies AS (

  SELECT dt.table_name, 'no_rls_policies' AS rule_id

  FROM domain_tables dt

  WHERE NOT EXISTS (

    SELECT 1 FROM pg_policies p

    WHERE p.schemaname = 'public' AND p.tablename = dt.table_name

  )

),

orgs_missing_storage_bucket AS (

  SELECT o.id::text AS table_name, 'org_missing_storage_bucket' AS rule_id

  FROM public.organizations o

  WHERE o.storage_bucket_id IS NULL

     OR NOT EXISTS (

       SELECT 1 FROM storage.buckets b WHERE b.id = o.storage_bucket_id

     )

),

storage_policies AS (

  SELECT 'storage.objects' AS table_name, 'missing_per_org_storage_policies' AS rule_id

  WHERE NOT EXISTS (

    SELECT 1

    FROM pg_policies p

    WHERE p.schemaname = 'storage'

      AND p.tablename = 'objects'

      AND p.policyname ILIKE 'Org bucket%'

  )

)

SELECT * FROM missing_org_column

UNION ALL SELECT * FROM profiles_org

UNION ALL SELECT * FROM roles_org

UNION ALL SELECT * FROM missing_composite_profiles

UNION ALL SELECT * FROM missing_composite_roles

UNION ALL SELECT * FROM missing_rls

UNION ALL SELECT * FROM missing_policies

UNION ALL SELECT * FROM orgs_missing_storage_bucket

UNION ALL SELECT * FROM storage_policies

ORDER BY rule_id, table_name;


