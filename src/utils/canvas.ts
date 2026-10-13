import type { Node } from '@vue-flow/core'
import { LAYOUT } from '@/constants/flow'
import { getKindMeta } from '@/constants/nodeKinds'
import type { ConnectorType, FlowNode, NodeKind, Size, XYPosition } from '@/types/flow'
import { getNodeKind, getNodeSummary, isConnector, truncate } from '@/utils/flow'

/** `data` passed to the FlowNode card component. */
export interface FlowCardData {
  kind: NodeKind
  title: string
  summary: string
  fullSummary: string
  active: boolean
}

/** `data` passed to the ConnectorNode pill component. */
export interface ConnectorPillData {
  title: string
  branch: ConnectorType
}

export type CanvasNode = Node<FlowCardData> | Node<ConnectorPillData>

/** Map a store record to a Vue Flow node object. */
export function toFlowNode(record: FlowNode, position: XYPosition, activeId: string | null): CanvasNode {
  if (isConnector(record)) {
    return {
      id: record.id,
      type: 'connector',
      position,
      data: { title: record.name, branch: record.data.connectorType },
      selectable: false,
      focusable: false,
      draggable: true,
      connectable: false,
    }
  }
  const kind = getNodeKind(record) ?? 'sendMessage'
  const fullSummary = getNodeSummary(record)
  const active = record.id === activeId
  return {
    id: record.id,
    type: 'flow',
    position,
    data: { kind, title: record.name, summary: truncate(fullSummary, 90), fullSummary, active },
    connectable: false,
    focusable: true,
    ariaLabel: `${getKindMeta(kind).label}: ${record.name}. Press Enter to ${active ? 'close' : 'open'} details.`,
  }
}

interface Viewport {
  x: number
  y: number
  zoom: number
}

/** Is a node rectangle fully visible in the unobstructed part of the pane? */
export function isRectVisible({
  position,
  size,
  viewport,
  pane,
  obstructRight = 0,
  margin = 24,
}: {
  position: XYPosition
  size: Size
  viewport: Viewport
  pane: Size
  obstructRight?: number
  margin?: number
}): boolean {
  const { x, y, zoom } = viewport
  const left = position.x * zoom + x
  const top = position.y * zoom + y
  const right = left + size.width * zoom
  const bottom = top + size.height * zoom
  return left >= margin && top >= margin && right <= pane.width - obstructRight - margin && bottom <= pane.height - margin
}

/** Flow-space point to centre on so a node sits mid-way in the visible area. */
export function centreTarget({
  position,
  size = { width: LAYOUT.NODE_WIDTH, height: LAYOUT.NODE_HEIGHT },
  zoom,
  obstructRight = 0,
}: {
  position: XYPosition
  size?: Size
  zoom: number
  obstructRight?: number
}): XYPosition {
  return {
    x: position.x + size.width / 2 + obstructRight / 2 / zoom,
    y: position.y + size.height / 2,
  }
}
