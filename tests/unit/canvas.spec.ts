import { describe, expect, it } from 'vitest'
import { centreTarget, isRectVisible, toFlowNode } from '@/utils/canvas'
import { byId, payloadNodes } from '../helpers'

const nodes = payloadNodes()

describe('toFlowNode', () => {
  it('maps regular nodes with truncated summary and active flag', () => {
    const n = toFlowNode(byId(nodes, 'b6a0c1'), { x: 1, y: 2 }, 'b6a0c1')
    expect(n).toMatchObject({ id: 'b6a0c1', type: 'flow', position: { x: 1, y: 2 }, focusable: true })
    expect(n.data).toMatchObject({ kind: 'sendMessage', title: 'Away Message', active: true })
    expect(n.ariaLabel).toMatch(/close details/)
  })

  it('maps connectors as non-selectable pills', () => {
    const n = toFlowNode(byId(nodes, '161f52'), { x: 0, y: 0 }, null)
    expect(n).toMatchObject({ type: 'connector', selectable: false, focusable: false, data: { branch: 'success' } })
  })
})

describe('viewport helpers', () => {
  const size = { width: 100, height: 50 }
  const pane = { width: 1000, height: 800 }

  it('detects visibility accounting for the drawer', () => {
    const viewport = { x: 0, y: 0, zoom: 1 }
    expect(isRectVisible({ position: { x: 100, y: 100 }, size, viewport, pane })).toBe(true)
    expect(isRectVisible({ position: { x: 700, y: 100 }, size, viewport, pane, obstructRight: 440 })).toBe(false)
    expect(isRectVisible({ position: { x: -50, y: 100 }, size, viewport, pane })).toBe(false)
  })

  it('offsets the centre target by half the drawer width', () => {
    expect(centreTarget({ position: { x: 0, y: 0 }, size, zoom: 2, obstructRight: 400 })).toEqual({ x: 150, y: 25 })
  })
})
