import { CONNECTOR_TYPES, DAYS, DEFAULT_BUSINESS_HOURS, NODE_TYPES } from '@/constants/flow'
import type {
  AttachmentPayload,
  BusinessHoursNode,
  BusinessHoursTime,
  ConnectorNode,
  ConnectorType,
  CreateNodeInput,
  FlowNode,
  FlowNodeData,
  NodeKind,
  RawFlowNode,
  TextPayload,
} from '@/types/flow'

/**
 * Deep clone for plain JSON data (history snapshots, drafts). JSON is used
 * deliberately: it works on Vue reactive proxies, unlike structuredClone.
 */
export function clone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T)
}

/** Short hex id, same shape as the payload ids (e.g. "b6a0c1"). */
export function generateId(existing: ReadonlySet<string> = new Set(), random: () => number = Math.random): string {
  for (let i = 0; i < 1000; i += 1) {
    const id = Math.floor(random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
    if (!existing.has(id)) return id
  }
  throw new Error('Unable to generate a unique node id')
}

const isRootMarker = (parentId: RawFlowNode['parentId']): boolean =>
  parentId === undefined || parentId === null || parentId === -1 || parentId === '-1'

/**
 * Normalise the raw payload: ids become strings (Vue Flow requirement),
 * root markers (-1 / missing parent) become `null`, and every node gets a
 * `name` and a `data` object.
 */
export function normalizePayload(raw: unknown): FlowNode[] {
  if (!Array.isArray(raw)) throw new TypeError('Flow payload must be an array of nodes')
  return (raw as RawFlowNode[]).map(
    (node) =>
      ({
        id: String(node.id),
        parentId: isRootMarker(node.parentId) ? null : String(node.parentId),
        type: node.type,
        name: node.name ?? (node.type === NODE_TYPES.TRIGGER ? 'Trigger' : 'Untitled'),
        data: clone(node.data ?? {}),
      }) as unknown as FlowNode,
  )
}

export const isConnector = (node: FlowNode | null | undefined): node is ConnectorNode =>
  node?.type === NODE_TYPES.DATE_TIME_CONNECTOR
export const isBusinessHours = (node: FlowNode | null | undefined): node is BusinessHoursNode =>
  node?.type === NODE_TYPES.DATE_TIME
/** Success / failure branches are display-only. */
export const isNodeInteractive = (node: FlowNode | null | undefined): node is Exclude<FlowNode, ConnectorNode> =>
  Boolean(node) && !isConnector(node)

/** UI "kind" for a raw node — drives icon, colours and drawer fields. */
export function getNodeKind(node: FlowNode | null | undefined): NodeKind | null {
  if (!node || isConnector(node)) return null
  if (node.type === NODE_TYPES.DATE_TIME) return 'businessHours'
  return node.type
}

const humanize = (value = ''): string =>
  value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())

/** Last path segment of a URL / data URI label, used as an attachment name. */
export function attachmentName(url = ''): string {
  if (url.startsWith('data:')) {
    const mime = url.slice(5, url.indexOf(';'))
    return `upload.${mime.split('/')[1] ?? 'file'}`
  }
  try {
    const { pathname } = new URL(url)
    return decodeURIComponent(pathname.split('/').filter(Boolean).pop() ?? url)
  } catch {
    return url
  }
}

export function isImageAttachment(url = ''): boolean {
  if (url.startsWith('data:image/')) return true
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(url)
}

const messagePayload = (node: FlowNode | null | undefined) => (node?.type === 'sendMessage' ? node.data.payload : [])

export const getTexts = (node: FlowNode | null | undefined): string[] =>
  messagePayload(node)
    .filter((p): p is TextPayload => p.type === 'text')
    .map((p) => p.text)

export const getAttachments = (node: FlowNode | null | undefined): string[] =>
  messagePayload(node)
    .filter((p): p is AttachmentPayload => p.type === 'attachment')
    .map((p) => p.attachment)

/** User-entered description, if the node kind supports one. */
export const getDescription = (node: FlowNode | null | undefined): string =>
  node && !isConnector(node) ? (node.data.description ?? '') : ''

/**
 * Text shown under a node title on the canvas. A user-entered description
 * wins; otherwise we derive a sensible summary from the node's own data.
 */
export function getNodeSummary(node: FlowNode | null | undefined): string {
  if (!node) return ''
  const description = getDescription(node)
  if (description) return description
  switch (node.type) {
    case 'trigger':
      return humanize(node.data?.type ?? 'trigger')
    case 'sendMessage': {
      const [text] = getTexts(node)
      if (text) return text
      const [attachment] = getAttachments(node)
      return attachment ? attachmentName(attachment) : 'No message yet'
    }
    case 'addComment':
      return node.data?.comment || 'No comment yet'
    case 'dateTime':
      return `Business Hours - ${node.data?.timezone ?? 'UTC'}`
    default:
      return ''
  }
}

/** Collapse whitespace and cut to `max` characters with an ellipsis. */
export function truncate(text = '', max = 80): string {
  const flat = String(text).replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}

export function buildChildrenMap<T extends Pick<FlowNode, 'parentId'>>(nodes: readonly T[]): Map<string | null, T[]> {
  const map = new Map<string | null, T[]>()
  for (const node of nodes) {
    const key = node.parentId ?? null
    const list = map.get(key)
    if (list) list.push(node)
    else map.set(key, [node])
  }
  return map
}

export interface FlowEdgeRecord {
  id: string
  source: string
  target: string
  type: 'smoothstep'
  class: string
}

/** Edges derived from the parent relationship. */
export function buildEdges(nodes: readonly FlowNode[]): FlowEdgeRecord[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const edges: FlowEdgeRecord[] = []
  for (const n of nodes) {
    const parent = n.parentId ? byId.get(n.parentId) : undefined
    if (!parent || !n.parentId) continue
    const branch = isConnector(parent) ? parent.data.connectorType : isConnector(n) ? n.data.connectorType : null
    edges.push({
      id: `e-${n.parentId}-${n.id}`,
      source: n.parentId,
      target: n.id,
      type: 'smoothstep',
      class: branch ? `edge--${branch}` : 'edge--default',
    })
  }
  return edges
}

/** Nodes that may be used as the parent of a newly created node. */
export function getAttachableParents(nodes: readonly FlowNode[]): FlowNode[] {
  return nodes.filter((n) => !isBusinessHours(n))
}

export function defaultBusinessHours(): BusinessHoursTime[] {
  return DAYS.map(({ key }) => ({ day: key, ...DEFAULT_BUSINESS_HOURS }))
}

function connectorRecord(id: string, parentId: string, connectorType: ConnectorType): ConnectorNode {
  return {
    id,
    parentId,
    type: 'dateTimeConnector',
    name: connectorType === CONNECTOR_TYPES.SUCCESS ? 'Success' : 'Failure',
    data: { connectorType },
  }
}

/**
 * Build the raw node records for a "Create New Node" submission.
 * Business hours nodes come with their success / failure connectors.
 */
export function createNodeRecords(
  { title, description = '', type, parentId = null }: CreateNodeInput,
  existingIds: ReadonlySet<string> = new Set(),
): FlowNode[] {
  const ids = new Set(existingIds)
  const nextId = () => {
    const id = generateId(ids)
    ids.add(id)
    return id
  }
  const base = { id: nextId(), parentId: parentId || null, name: title.trim() }
  const desc = description.trim()

  switch (type) {
    case 'sendMessage':
      return [{ ...base, type: 'sendMessage', data: { description: desc, payload: [] } }]
    case 'addComment':
      return [{ ...base, type: 'addComment', data: { description: desc, comment: '' } }]
    case 'businessHours': {
      const success = nextId()
      const failure = nextId()
      return [
        {
          ...base,
          type: 'dateTime',
          data: {
            description: desc,
            times: defaultBusinessHours(),
            connectors: [success, failure],
            timezone: 'UTC',
            action: 'businessHours',
          },
        },
        connectorRecord(success, base.id, CONNECTOR_TYPES.SUCCESS),
        connectorRecord(failure, base.id, CONNECTOR_TYPES.FAILURE),
      ]
    }
    default:
      throw new Error(`Unsupported node type: ${String(type)}`)
  }
}

/**
 * Remove a node from the document. Connectors owned by a business-hours node
 * are removed with it; orphaned children are re-attached to the removed
 * node's parent so the rest of the flow is preserved.
 */
export function removeNodeFromList(
  nodes: FlowNode[],
  id: string,
): { nodes: FlowNode[]; removedIds: string[] } {
  const target = nodes.find((n) => n.id === id)
  if (!target) return { nodes, removedIds: [] }
  const removed = new Set([id])
  if (isBusinessHours(target)) {
    nodes.filter((n) => n.parentId === id && isConnector(n)).forEach((n) => removed.add(n.id))
  }
  const next = nodes
    .filter((n) => !removed.has(n.id))
    .map((n) => (n.parentId && removed.has(n.parentId) ? { ...n, parentId: target.parentId } : n))
  return { nodes: next, removedIds: [...removed] }
}

/** Typed helper to replace a node's data while preserving its discriminant. */
export function withData<N extends FlowNode>(node: N, data: FlowNodeData): N {
  return { ...node, data } as N
}
