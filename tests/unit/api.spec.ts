import { afterEach, describe, expect, it, vi } from 'vitest'
import { createNodes, deleteNode, fetchFlow, updateNode } from '@/api/flowApi'
import { PAYLOAD_URL } from '@/constants/flow'
import type { FlowNode } from '@/types/flow'
import { rawPayload } from '../helpers'

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })

describe('flowApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('fetches and normalises the remote payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(rawPayload()))
    vi.stubGlobal('fetch', fetchMock)
    const nodes = await fetchFlow()
    expect(fetchMock).toHaveBeenCalledWith(PAYLOAD_URL, expect.any(Object))
    expect(nodes[0]).toMatchObject({ id: '1', parentId: null })
  })

  it('falls back to the bundled payload when the remote fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 403 })
      .mockResolvedValueOnce(ok(rawPayload()))
    vi.stubGlobal('fetch', fetchMock)
    const nodes = await fetchFlow()
    expect(fetchMock.mock.calls[1]?.[0]).toMatch(/payload\.json$/)
    expect(nodes).toHaveLength(7)
  })

  it('throws when both sources fail', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(fetchFlow()).rejects.toThrow('offline')
  })

  it('simulated writes resolve with copies', async () => {
    vi.useFakeTimers()
    const rec: FlowNode = { id: 'a', parentId: null, type: 'addComment', name: 'x', data: { comment: '' } }
    const p1 = createNodes([rec])
    const p2 = updateNode(rec)
    const p3 = deleteNode('a')
    await vi.runAllTimersAsync()
    const [created] = await p1
    expect(created).toEqual(rec)
    expect(created).not.toBe(rec)
    expect(await p2).toEqual(rec)
    expect(await p3).toEqual({ id: 'a' })
    const bad = updateNode(undefined).catch((e: unknown) => e)
    await vi.runAllTimersAsync()
    expect(await bad).toBeInstanceOf(Error)
  })
})
