import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFlowStore, type FlowStore } from '@/stores/flow'
import { createNodeRecords } from '@/utils/flow'
import type { XYPosition } from '@/types/flow'
import { must, payloadNodes } from '../helpers'

describe('flow store', () => {
  let store: FlowStore
  beforeEach(() => {
    setActivePinia(createPinia())
    store = useFlowStore()
    store.hydrate(payloadNodes())
  })

  it('hydrates nodes and positions with empty history', () => {
    expect(store.loaded).toBe(true)
    expect(store.nodes).toHaveLength(7)
    expect(Object.keys(store.positions)).toHaveLength(7)
    expect(store.canUndo).toBe(false)
    expect(must(store.getNode(1)).name).toBe('Trigger')
  })

  it('updates a node and can undo / redo it', () => {
    store.updateNode('e879e4', { name: 'Renamed', data: { comment: 'c' } })
    expect(store.getNode('e879e4')).toMatchObject({ name: 'Renamed', data: { comment: 'c' } })
    expect(store.undo()).toBe(true)
    expect(must(store.getNode('e879e4')).name).toBe('Add Comment #1')
    expect(store.redo()).toBe(true)
    expect(must(store.getNode('e879e4')).name).toBe('Renamed')
    expect(store.redo()).toBe(false)
  })

  it('ignores updates to unknown nodes', () => {
    expect(store.updateNode('nope', { name: 'x' })).toBeUndefined()
    expect(store.canUndo).toBe(false)
  })

  it('records moves and ignores no-op moves', () => {
    const before = { ...must(store.positions.b6a0c1) }
    expect(store.moveNodes([{ id: 'b6a0c1', position: before }])).toBe(false)
    expect(store.moveNodes([{ id: 'b6a0c1', position: { x: before.x + 50.4, y: before.y } }])).toBe(true)
    expect(must(store.positions.b6a0c1).x).toBe(before.x + 50)
    store.undo()
    expect(must(store.positions.b6a0c1)).toEqual(before)
  })

  it('adds nodes with positions, placing connectors under their parent', () => {
    const records = createNodeRecords({ title: 'BH', type: 'businessHours', parentId: 'e879e4' }, store.nodeIds())
    store.addNodes(records)
    expect(store.nodes).toHaveLength(10)
    const [bh, s, f] = records.map((r) => must(store.positions[r.id])) as [XYPosition, XYPosition, XYPosition]
    expect(bh.y).toBeGreaterThan(must(store.positions.e879e4).y)
    expect(s.y).toBeGreaterThan(bh.y)
    expect(s.x).toBeLessThan(f.x)
  })

  it('removes nodes and their positions, undoably', () => {
    const removed = store.removeNode('d09c08')
    expect(removed).toHaveLength(3)
    expect(store.positions.d09c08).toBeUndefined()
    expect(must(store.getNode('b0653a')).parentId).toBe('1')
    store.undo()
    expect(store.nodes).toHaveLength(7)
    expect(store.removeNode('missing')).toEqual([])
  })

  it('clears redo stack on a new change', () => {
    store.updateNode('e879e4', { name: 'A' })
    store.undo()
    expect(store.canRedo).toBe(true)
    store.updateNode('e879e4', { name: 'B' })
    expect(store.canRedo).toBe(false)
  })

  it('rolls back without leaving a history entry', () => {
    const snap = store.snapshot()
    store.updateNode('e879e4', { name: 'Temp' })
    store.rollback(snap)
    expect(must(store.getNode('e879e4')).name).toBe('Add Comment #1')
    expect(store.canUndo).toBe(false)
  })

  it('relayout restores the tidy layout as an undoable step', () => {
    store.moveNodes([{ id: '1', position: { x: 999, y: 999 } }])
    store.relayout()
    expect(store.positions['1']).not.toEqual({ x: 999, y: 999 })
    store.undo()
    expect(store.positions['1']).toEqual({ x: 999, y: 999 })
  })
})
