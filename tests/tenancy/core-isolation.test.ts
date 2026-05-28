import { describe, expect, it } from 'vitest'

import {
  ACME_ORG_ID,
  createAnonClient,
  GLOBEX_ORG_ID,
  SEED_PASSWORD,
  signInAs,
} from './setup'

describe('tenancy isolation (core)', () => {
  const client = createAnonClient()

  it('roles: acme user does not see globex role rows', async () => {
    await signInAs(client, 'admin@test.com', SEED_PASSWORD)

    const { data, error } = await client
      .from('roles')
      .select('id, org_id, name')
      .eq('org_id', GLOBEX_ORG_ID)

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('profiles: user sees only own profile row', async () => {
    await signInAs(client, 'admin@test.com', SEED_PASSWORD)

    const {
      data: { user },
    } = await client.auth.getUser()
    expect(user).not.toBeNull()

    const { data, error } = await client.from('profiles').select('id, org_id')

    expect(error).toBeNull()
    expect(data?.length).toBe(1)
    expect(data?.[0]?.id).toBe(user?.id)
    expect(data?.[0]?.org_id).toBe(ACME_ORG_ID)
  })

  it('storage: cannot upload to another org bucket', async () => {
    await signInAs(client, 'staff@test.com', SEED_PASSWORD)

    const body = new Blob(['tenancy-test'], { type: 'text/plain' })
    const { error } = await client.storage
      .from(GLOBEX_ORG_ID)
      .upload(`isolation-${String(Date.now())}.txt`, body, { upsert: true })

    expect(error).not.toBeNull()
  })

  it('storage: can upload to own org bucket', async () => {
    await signInAs(client, 'staff@test.com', SEED_PASSWORD)

    const body = new Blob(['tenancy-test-own'], { type: 'text/plain' })
    const path = `isolation-own-${String(Date.now())}.txt`
    const { error } = await client.storage
      .from(ACME_ORG_ID)
      .upload(path, body, { upsert: true })

    expect(error).toBeNull()

    await client.storage.from(ACME_ORG_ID).remove([path])
  })

  it('storage: cannot list another org bucket', async () => {
    await signInAs(client, 'admin@test.com', SEED_PASSWORD)

    const { data, error } = await client.storage.from(GLOBEX_ORG_ID).list()

    if (error) {
      expect(error).toBeTruthy()
      return
    }
    expect(data).toHaveLength(0)
  })
})
