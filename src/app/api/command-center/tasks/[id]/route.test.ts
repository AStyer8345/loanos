import { beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({ context: vi.fn(), create: vi.fn(), from: vi.fn(), update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn() }))
vi.mock('@/lib/getOrganization', () => ({ getOrganization: mock.context }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mock.create }))
import { PATCH } from './route'

const memberId = '11111111-1111-4111-8111-111111111111'
const request = (body: unknown) => new Request('http://localhost/api/command-center/tasks/task', { method: 'PATCH', body: JSON.stringify(body) })
beforeEach(() => {
  vi.resetAllMocks()
  mock.context.mockResolvedValue({ organizationId: 'tenant-a', userId: 'viewer', role: 'owner' })
  const chain = { from: mock.from, update: mock.update, eq: mock.eq, select: mock.select, maybeSingle: mock.single }
  for (const fn of [mock.from, mock.update, mock.eq, mock.select]) fn.mockReturnValue(chain)
  mock.create.mockReturnValue(chain)
})
describe('task routing tenant boundary', () => {
  it('rejects unauthenticated requests before touching the database', async () => {
    mock.context.mockRejectedValue(new Error('No session'))
    const response = await PATCH(request({ assigned_to: memberId }), { params: { id: 'task' } })
    expect(response.status).toBe(401)
    expect(mock.create).not.toHaveBeenCalled()
  })
  it('rejects an assignee outside the current organization without writing', async () => {
    mock.single.mockResolvedValue({ data: null, error: null })
    const response = await PATCH(request({ assigned_to: memberId }), { params: { id: 'task' } })
    expect(response.status).toBe(400)
    expect(mock.eq).toHaveBeenCalledWith('organization_id', 'tenant-a')
    expect(mock.update).not.toHaveBeenCalled()
  })
  it('scopes both membership verification and task updates to the current organization', async () => {
    mock.single.mockResolvedValueOnce({ data: { id: memberId }, error: null }).mockResolvedValueOnce({ data: { id: 'task' }, error: null })
    const response = await PATCH(request({ assigned_to: memberId }), { params: { id: 'task' } })
    expect(response.status).toBe(200)
    expect(mock.eq.mock.calls.filter(([key, value]) => key === 'organization_id' && value === 'tenant-a')).toHaveLength(2)
    expect(mock.update).toHaveBeenCalledWith({ assigned_to: memberId })
  })
  it('does not claim a successful handoff for a missing or inaccessible task', async () => {
    mock.single.mockResolvedValue({ data: null, error: null })
    expect((await PATCH(request({ follow_up_reason: 'waiting:borrower' }), { params: { id: 'missing' } })).status).toBe(404)
  })
})
