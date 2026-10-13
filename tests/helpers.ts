import raw from './fixtures/payload.json'
import type { FlowNode, RawFlowNode } from '@/types/flow'
import type { NodeDraft } from '@/utils/draft'
import { normalizePayload } from '@/utils/flow'

export const rawPayload = (): RawFlowNode[] => JSON.parse(JSON.stringify(raw)) as RawFlowNode[]
export const payloadNodes = (): FlowNode[] => normalizePayload(rawPayload())

/** Assert a value is present (narrows away null / undefined). */
export function must<T>(value: T | null | undefined, label = 'value'): T {
  if (value === null || value === undefined) throw new Error(`Expected ${label} to be defined`)
  return value
}

/** Find a node by id, failing the test if it is missing. */
export const byId = (nodes: readonly FlowNode[], id: string): FlowNode =>
  must(nodes.find((n) => n.id === id), `node ${id}`)

/** Narrow a node / draft to a specific discriminant, failing otherwise. */
export function asType<T extends FlowNode['type']>(node: FlowNode, type: T): Extract<FlowNode, { type: T }> {
  if (node.type !== type) throw new Error(`Expected ${type}, got ${node.type}`)
  return node as Extract<FlowNode, { type: T }>
}
export function asKind<K extends NodeDraft['kind']>(draft: NodeDraft, kind: K): Extract<NodeDraft, { kind: K }> {
  if (draft.kind !== kind) throw new Error(`Expected ${kind} draft, got ${draft.kind}`)
  return draft as Extract<NodeDraft, { kind: K }>
}

/** Query a DOM element (e.g. inside a teleported dialog), failing if missing. */
export function $<E extends Element = HTMLElement>(selector: string, root: ParentNode = document): E {
  return must(root.querySelector<E>(selector), selector)
}
export const $$ = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document): E[] => [
  ...root.querySelectorAll<E>(selector),
]

export const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0))
