import { LAYOUT } from '@/constants/flow'
import type { FlowNode, PositionMap, Size, XYPosition } from '@/types/flow'
import { buildChildrenMap, isConnector } from '@/utils/flow'

type LayoutNode = Pick<FlowNode, 'id' | 'parentId' | 'type'>

export const nodeSize = (node: LayoutNode): Size =>
  isConnector(node as FlowNode)
    ? { width: LAYOUT.CONNECTOR_WIDTH, height: LAYOUT.CONNECTOR_HEIGHT }
    : { width: LAYOUT.NODE_WIDTH, height: LAYOUT.NODE_HEIGHT }

export interface LayoutOptions {
  hGap?: number
  vGap?: number
  origin?: XYPosition
}

/**
 * Simple top-down tidy-tree layout (custom, no external layout engine).
 *
 * 1. Measure every subtree: its width is the larger of the node's own width
 *    and the sum of its children's subtree widths plus gaps.
 * 2. Walk the tree again, centring each node above the span of its children.
 *
 * Nodes whose parent is missing are treated as additional roots and are laid
 * out side by side. Returns `{ [id]: { x, y } }` (top-left, Vue Flow style).
 */
export function computeTreeLayout(nodes: readonly LayoutNode[], options: LayoutOptions = {}): PositionMap {
  const { hGap = LAYOUT.H_GAP, vGap = LAYOUT.V_GAP, origin = { x: 0, y: 0 } } = options
  const ids = new Set(nodes.map((n) => n.id))
  const children = buildChildrenMap(
    nodes.map((n) => (n.parentId && ids.has(n.parentId) ? n : { ...n, parentId: null })),
  )
  const widthCache = new Map<string, number>()
  const visiting = new Set<string>()

  const childrenWidth = (kids: readonly LayoutNode[]): number =>
    kids.reduce((sum, k) => sum + subtreeWidth(k), 0) + Math.max(0, kids.length - 1) * hGap

  function subtreeWidth(node: LayoutNode): number {
    const cached = widthCache.get(node.id)
    if (cached !== undefined) return cached
    if (visiting.has(node.id)) return nodeSize(node).width // cycle guard
    visiting.add(node.id)
    const width = Math.max(nodeSize(node).width, childrenWidth(children.get(node.id) ?? []))
    visiting.delete(node.id)
    widthCache.set(node.id, width)
    return width
  }

  const positions: PositionMap = {}
  const place = (node: LayoutNode, left: number, top: number): void => {
    if (positions[node.id]) return
    const own = nodeSize(node)
    const span = subtreeWidth(node)
    positions[node.id] = { x: Math.round(left + (span - own.width) / 2), y: Math.round(top) }

    const kids = children.get(node.id) ?? []
    let cursor = left + (span - childrenWidth(kids)) / 2
    const childTop = top + own.height + vGap
    for (const kid of kids) {
      place(kid, cursor, childTop)
      cursor += subtreeWidth(kid) + hGap
    }
  }

  let cursor = origin.x
  for (const root of children.get(null) ?? []) {
    place(root, cursor, origin.y)
    cursor += subtreeWidth(root) + hGap * 2
  }
  // Anything unreachable (e.g. cycles) still gets a position.
  for (const node of nodes) {
    if (!positions[node.id]) {
      positions[node.id] = { x: cursor, y: origin.y }
      cursor += nodeSize(node).width + hGap
    }
  }
  return positions
}

/**
 * Position for a node inserted after the initial layout: under its parent
 * (to the right of existing siblings) or, if standalone, right of the graph.
 */
export function positionForNewNode({
  parentId,
  nodes,
  positions,
}: {
  parentId: string | null
  nodes: readonly LayoutNode[]
  positions: PositionMap
}): XYPosition {
  const parent = parentId ? nodes.find((n) => n.id === parentId) : undefined
  const parentPos = parent && positions[parent.id]
  if (parent && parentPos) {
    const parentSize = nodeSize(parent)
    const siblings = nodes.filter((n) => n.parentId === parentId && positions[n.id])
    const baseX = parentPos.x + parentSize.width / 2 - LAYOUT.NODE_WIDTH / 2
    const x = siblings.length
      ? Math.max(...siblings.map((s) => positions[s.id]!.x + nodeSize(s).width)) + LAYOUT.H_GAP
      : baseX
    return { x: Math.round(x), y: Math.round(parentPos.y + parentSize.height + LAYOUT.V_GAP) }
  }
  const all = Object.values(positions)
  if (!all.length) return { x: 0, y: 0 }
  const maxX = Math.max(...all.map((p) => p.x)) + LAYOUT.NODE_WIDTH + LAYOUT.H_GAP * 2
  const minY = Math.min(...all.map((p) => p.y))
  return { x: Math.round(maxX), y: Math.round(minY) }
}

/** Positions of a business-hours node's connectors relative to the node. */
export function connectorPositions(nodePos: XYPosition): [XYPosition, XYPosition] {
  const centre = nodePos.x + LAYOUT.NODE_WIDTH / 2
  const y = nodePos.y + LAYOUT.NODE_HEIGHT + LAYOUT.V_GAP
  const offset = LAYOUT.NODE_WIDTH / 2 + LAYOUT.H_GAP / 2
  return [
    { x: Math.round(centre - offset - LAYOUT.CONNECTOR_WIDTH / 2), y },
    { x: Math.round(centre + offset - LAYOUT.CONNECTOR_WIDTH / 2), y },
  ]
}
