import { requireOrgAdmin } from './require-org-admin.ts'
import { requireSuperAdmin } from './require-super-admin.ts'

export type AdminAuthResult =
  | { ok: true; userId: string; isSuperAdmin: true }
  | { ok: true; userId: string; isSuperAdmin: false; orgId: string }
  | { ok: false; response: Response }

export async function requireAdmin(req: Request): Promise<AdminAuthResult> {
  const superResult = await requireSuperAdmin(req)
  if (superResult.ok) {
    return { ok: true, userId: superResult.userId, isSuperAdmin: true }
  }

  const orgResult = await requireOrgAdmin(req)
  if (orgResult.ok) {
    return {
      ok: true,
      userId: orgResult.userId,
      isSuperAdmin: false,
      orgId: orgResult.orgId,
    }
  }

  return orgResult
}
