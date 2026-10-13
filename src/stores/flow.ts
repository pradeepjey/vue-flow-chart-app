import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { HISTORY_LIMIT } from '@/constants/flow'
import type { FlowNode, NodePatch, PositionMap, XYPosition } from '@/types/flow'
import { clone, isConnector, isBusinessHours, removeNodeFromList, withData } from '@/utils/flow'
import { computeTreeLayout, connectorPositions, positionForNewNode } from '@/utils/layout'

export interface FlowSnapshot {
  nodes: FlowNode[]
  positions: PositionMap
}

export interface NodeMove {
  id: string
  position: XYPosition
}

/**
 * Client-side flow document: node records + canvas positions, with a
 * snapshot-based undo / redo history covering moves, edits, creates and
 * deletes. Server state (TanStack Query cache) is kept in sync by the
 * mutation composable; this store is what the UI renders from.
 */
export const useFlowStore = defineStore('flow', () => {
  const nodes = ref<FlowNode[]>([])
  const positions = ref<PositionMap>({})
  const loaded = ref(false)
  const past = shallowRef<FlowSnapshot[]>([])
  const future = shallowRef<FlowSnapshot[]>([])

  const nodeMap = computed(() => new Map(nodes.value.map((n) => [n.id, n])))
  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  const getNode = (id: string | number | null | undefined): FlowNode | undefined =>
    id == null ? undefined : nodeMap.value.get(String(id))
  const nodeIds = (): Set<string> => new Set(nodes.value.map((n) => n.id))

  const snapshot = (): FlowSnapshot => ({ nodes: clone(nodes.value), positions: clone(positions.value) })
  const restore = (snap: FlowSnapshot): void => {
    nodes.value = snap.nodes
    positions.value = snap.positions
  }

  /** Push the current state onto the undo stack before a change. */
  function record(): void {
    past.value = [...past.value, snapshot()].slice(-HISTORY_LIMIT)
    future.value = []
  }

  function hydrate(records: FlowNode[]): void {
    nodes.value = clone(records)
    positions.value = computeTreeLayout(nodes.value)
    past.value = []
    future.value = []
    loaded.value = true
  }

  /** Insert freshly created records (a node plus, possibly, connectors). */
  function addNodes(records: FlowNode[]): void {
    record()
    const nextPositions: PositionMap = { ...positions.value }
    const pending: FlowNode[] = [...nodes.value]
    for (const rec of records) {
      const parent = pending.find((n) => n.id === rec.parentId)
      const parentPos = parent ? nextPositions[parent.id] : undefined
      if (isConnector(rec) && isBusinessHours(parent) && parentPos) {
        const index = parent.data.connectors.indexOf(rec.id)
        nextPositions[rec.id] = connectorPositions(parentPos)[index === 1 ? 1 : 0]
      } else {
        nextPositions[rec.id] = positionForNewNode({ parentId: rec.parentId, nodes: pending, positions: nextPositions })
      }
      pending.push(clone(rec))
    }
    nodes.value = pending
    positions.value = nextPositions
  }

  /** Replace a node's name / data. Returns the updated record. */
  function updateNode(id: string, patch: NodePatch): FlowNode | undefined {
    const current = getNode(id)
    if (!current) return undefined
    record()
    let updated: FlowNode = patch.name !== undefined ? { ...current, name: patch.name } : { ...current }
    if (patch.data !== undefined) updated = withData(updated, clone(patch.data))
    nodes.value = nodes.value.map((n) => (n.id === current.id ? updated : n))
    return updated
  }

  function removeNode(id: string): string[] {
    if (!getNode(id)) return []
    record()
    const { nodes: next, removedIds } = removeNodeFromList(nodes.value, String(id))
    nodes.value = next
    const nextPositions = { ...positions.value }
    removedIds.forEach((rid) => delete nextPositions[rid])
    positions.value = nextPositions
    return removedIds
  }

  /** Commit drag results. No-op moves are ignored. Returns whether anything changed. */
  function moveNodes(moves: NodeMove[]): boolean {
    const changed = moves.filter(({ id, position }) => {
      const prev = positions.value[id]
      return prev && (Math.round(prev.x) !== Math.round(position.x) || Math.round(prev.y) !== Math.round(position.y))
    })
    if (!changed.length) return false
    record()
    const next = { ...positions.value }
    changed.forEach(({ id, position }) => {
      next[id] = { x: Math.round(position.x), y: Math.round(position.y) }
    })
    positions.value = next
    return true
  }

  function relayout(): void {
    record()
    positions.value = computeTreeLayout(nodes.value)
  }

  /** Roll back to a snapshot without touching history (failed mutation). */
  function rollback(snap: FlowSnapshot): void {
    restore(snap)
    past.value = past.value.slice(0, -1)
  }

  function undo(): boolean {
    const prev = past.value[past.value.length - 1]
    if (!prev) return false
    past.value = past.value.slice(0, -1)
    future.value = [...future.value, snapshot()]
    restore(prev)
    return true
  }

  function redo(): boolean {
    const next = future.value[future.value.length - 1]
    if (!next) return false
    future.value = future.value.slice(0, -1)
    past.value = [...past.value, snapshot()]
    restore(next)
    return true
  }

  return {
    nodes,
    positions,
    loaded,
    canUndo,
    canRedo,
    getNode,
    nodeIds,
    snapshot,
    hydrate,
    addNodes,
    updateNode,
    removeNode,
    moveNodes,
    relayout,
    rollback,
    undo,
    redo,
  }
})

export type FlowStore = ReturnType<typeof useFlowStore>
