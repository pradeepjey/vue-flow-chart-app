import { PAYLOAD_URL } from '@/constants/flow'
import type { FlowNode } from '@/types/flow'
import { clone, normalizePayload } from '@/utils/flow'

const LATENCY_MS = 250
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${url}`)
  return res.json()
}

/**
 * Fetch the flow document. The S3 payload is the source of truth; if it is
 * unreachable (offline, CORS, corporate proxy) we fall back to the bundled
 * copy in /public so the app remains usable.
 */
export async function fetchFlow({ signal }: { signal?: AbortSignal } = {}): Promise<FlowNode[]> {
  try {
    return normalizePayload(await getJson(PAYLOAD_URL, signal))
  } catch (error) {
    if (signal?.aborted) throw error
    const base = import.meta.env?.BASE_URL ?? '/'
    const fallback = await getJson(`${base}payload.json`, signal)
    console.warn('[flowApi] Remote payload unavailable, using bundled copy.', error)
    return normalizePayload(fallback)
  }
}

/*
 * The payload lives in a read-only bucket, so writes are simulated: each
 * mutation resolves with the persisted entity after a short latency, exactly
 * like a REST endpoint would. Swap these for real HTTP calls when a backend
 * exists — the mutation hooks will not need to change.
 */
export async function createNodes(records: FlowNode[]): Promise<FlowNode[]> {
  await delay(LATENCY_MS)
  return clone(records)
}

export async function updateNode(record: FlowNode | undefined): Promise<FlowNode> {
  await delay(LATENCY_MS)
  if (!record?.id) throw new Error('Cannot update a node without an id')
  return clone(record)
}

export async function deleteNode(id: string): Promise<{ id: string }> {
  await delay(LATENCY_MS)
  if (!id) throw new Error('Cannot delete a node without an id')
  return { id }
}

export const flowApi = { fetchFlow, createNodes, updateNode, deleteNode }
