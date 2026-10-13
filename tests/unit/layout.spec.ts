import { describe, expect, it } from 'vitest'
import { LAYOUT } from '@/constants/flow'
import { computeTreeLayout, connectorPositions, nodeSize, positionForNewNode } from '@/utils/layout'
import type { FlowNode, Size, XYPosition } from '@/types/flow'
import { must, payloadNodes } from '../helpers'

const overlap = (a: XYPosition, sa: Size, b: XYPosition, sb: Size): boolean =>
  a.x < b.x + sb.width && b.x < a.x + sa.width && a.y < b.y + sb.height && b.y < a.y + sa.height

describe('computeTreeLayout', () => {
  const nodes = payloadNodes()
  const pos = computeTreeLayout(nodes)

  it('positions every node', () => {
    expect(Object.keys(pos).sort()).toEqual(nodes.map((n) => n.id).sort())
  })

  it('places children below their parent', () => {
    for (const n of nodes.filter((x) => x.parentId)) {
      expect(must(pos[n.id]).y).toBeGreaterThan(must(pos[must(n.parentId)]).y)
    }
  })

  it('places success left of failure and centres the parent', () => {
    expect(must(pos['161f52']).x).toBeLessThan(must(pos['28c4b9']).x)
    const parentCentre = must(pos.d09c08).x + LAYOUT.NODE_WIDTH / 2
    const a = must(pos['161f52']).x + LAYOUT.CONNECTOR_WIDTH / 2
    const b = must(pos['28c4b9']).x + LAYOUT.CONNECTOR_WIDTH / 2
    expect(Math.abs(parentCentre - (a + b) / 2)).toBeLessThanOrEqual(1)
  })

  it('produces no overlapping nodes', () => {
    for (const a of nodes) {
      for (const b of nodes) {
        if (a.id === b.id) continue
        expect(overlap(must(pos[a.id]), nodeSize(a), must(pos[b.id]), nodeSize(b))).toBe(false)
      }
    }
  })

  it('handles orphans and cycles without throwing', () => {
    const cyc: FlowNode[] = [
      { id: 'a', parentId: 'b', type: 'addComment', name: 'a', data: { comment: '' } },
      { id: 'b', parentId: 'a', type: 'addComment', name: 'b', data: { comment: '' } },
      { id: 'c', parentId: 'missing', type: 'addComment', name: 'c', data: { comment: '' } },
    ]
    const p = computeTreeLayout(cyc)
    expect(Object.keys(p).sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('positionForNewNode', () => {
  const nodes = payloadNodes()
  const positions = computeTreeLayout(nodes)

  it('goes under a childless parent', () => {
    const p = positionForNewNode({ parentId: 'e879e4', nodes, positions })
    expect(p.y).toBeGreaterThan(must(positions.e879e4).y)
    expect(p.x).toBe(must(positions.e879e4).x)
  })

  it('goes right of existing siblings', () => {
    const p = positionForNewNode({ parentId: '161f52', nodes, positions })
    expect(p.x).toBeGreaterThan(must(positions.b0653a).x + LAYOUT.NODE_WIDTH - 1)
  })

  it('places standalone nodes right of the graph', () => {
    const p = positionForNewNode({ parentId: null, nodes, positions })
    const maxX = Math.max(...Object.values(positions).map((v) => v.x))
    expect(p.x).toBeGreaterThan(maxX)
  })

  it('handles an empty canvas', () => {
    expect(positionForNewNode({ parentId: null, nodes: [], positions: {} })).toEqual({ x: 0, y: 0 })
  })
})

describe('connectorPositions', () => {
  it('returns two symmetric slots below the node', () => {
    const [l, r] = connectorPositions({ x: 0, y: 0 })
    expect(l.y).toBe(r.y)
    expect(l.x).toBeLessThan(r.x)
  })
})
