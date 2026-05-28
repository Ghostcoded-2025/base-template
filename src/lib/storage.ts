/**
 * Storage helpers for per-org buckets.
 * Bucket id equals the organization UUID (see organizations.storage_bucket_id).
 * Callers must use the signed-in user's profiles.org_id — RLS enforces bucket_id match.
 */

/** Storage bucket id for an organization (same as org id). */
export function orgBucketId(orgId: string): string {
  if (!orgId.trim()) {
    throw new Error('orgId is required')
  }
  return orgId
}

/** Object path inside the org bucket (no org prefix in the path). */
export function storageObjectPath(relativePath: string): string {
  const trimmed = relativePath.replace(/^\/+/, '')
  if (!trimmed) {
    throw new Error('relativePath is required')
  }
  return trimmed
}
