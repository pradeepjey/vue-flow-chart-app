import { describe, expect, it } from 'vitest'
import {
  attachmentName,
  buildEdges,
  createNodeRecords,
  generateId,
  getAttachableParents,
  getNodeKind,
  getNodeSummary,
  isImageAttachment,
  isNodeInteractive,
  normalizePayload,
  removeNodeFromList,
  truncate,
} from '@/utils/flow'
import type { CreatableNodeType, FlowNode } from '@/types/flow'
import { asType, byId, must, payloadNodes, rawPayload } from '../helpers'

describe('normalizePayload', () => {
  it('stringifies ids and maps root markers to null', () => {
    const nodes = payloadNodes()
    expect(byId(nodes, '1')).toMatchObject({ id: '1', parentId: null, name: 'Trigger' })
    expect(byId(nodes, 'd09c08').parentId).toBe('1')
    expect(nodes.every((n) => typeof n.id === 'string')).toBe(true)
  })

  it('does not share references with the input', () => {
    const raw = rawPayload()
    const nodes = normalizePayload(raw)
    const message = asType(must(nodes[1]), 'sendMessage')
    const first = must(message.data.payload[0])
    if (first.type === 'text') first.text = 'changed'
    expect(JSON.stringify(raw[1])).not.toContain('changed')
  })

  it('rejects non-array payloads', () => {
    expect(() => normalizePayload({})).toThrow(TypeError)
  })
})

describe('node helpers', () => {
  const nodes = payloadNodes()

  it('derives kinds', () => {
    expect(getNodeKind(byId(nodes, 'd09c08'))).toBe('businessHours')
    expect(getNodeKind(byId(nodes, 'b6a0c1'))).toBe('sendMessage')
  })

  it('marks connectors as non-interactive', () => {
    expect(isNodeInteractive(byId(nodes, '161f52'))).toBe(false)
    expect(isNodeInteractive(byId(nodes, 'b6a0c1'))).toBe(true)
    expect(isNodeInteractive(undefined)).toBe(false)
  })

  it('summarises nodes, preferring a user description', () => {
    expect(getNodeSummary(byId(nodes, '1'))).toBe('Conversation Opened')
    expect(getNodeSummary(byId(nodes, 'd09c08'))).toBe('Business Hours - UTC')
    expect(getNodeSummary(byId(nodes, 'e879e4'))).toBe('User message during off hours')
    expect(getNodeSummary(byId(nodes, 'b0653a'))).toContain('Hello there')
    expect(getNodeSummary({ ...asType(byId(nodes, 'e879e4'), 'addComment'), data: { comment: '', description: 'Custom' } })).toBe('Custom')
  })

  it('falls back to attachment name for attachment-only messages', () => {
    const node: FlowNode = {
      id: 'm',
      parentId: null,
      name: 'm',
      type: 'sendMessage',
      data: { payload: [{ type: 'attachment', attachment: 'https://x.io/a/cat.png' }] },
    }
    expect(getNodeSummary(node)).toBe('cat.png')
  })

  it('truncates and collapses whitespace', () => {
    expect(truncate('a  b\n\nc', 10)).toBe('a b c')
    expect(truncate('abcdefghijkl', 6)).toBe('abcde…')
  })

  it('names and classifies attachments', () => {
    expect(attachmentName('https://fastly.picsum.photos/id/396/536/354.jpg?hmac=x')).toBe('354.jpg')
    expect(attachmentName('data:image/png;base64,AAA')).toBe('upload.png')
    expect(isImageAttachment('https://a.b/c.JPG?x=1')).toBe(true)
    expect(isImageAttachment('data:application/pdf;base64,AA')).toBe(false)
  })

  it('excludes business hours nodes from attachable parents', () => {
    expect(getAttachableParents(nodes).map((n) => n.id)).not.toContain('d09c08')
  })

  it('generates unique ids', () => {
    let calls = 0
    const random = () => (calls++ === 0 ? 0 : 0.5)
    const id = generateId(new Set(['000000']), random)
    expect(id).toMatch(/^[0-9a-f]{6}$/)
    expect(id).not.toBe('000000')
  })
})

describe('buildEdges', () => {
  it('creates one edge per parented node with branch classes', () => {
    const edges = buildEdges(payloadNodes())
    expect(edges).toHaveLength(6)
    expect(edges.find((e) => e.target === 'b0653a')?.class).toBe('edge--success')
    expect(edges.find((e) => e.target === '28c4b9')?.class).toBe('edge--failure')
    expect(edges.find((e) => e.target === 'd09c08')?.class).toBe('edge--default')
  })
})

describe('createNodeRecords', () => {
  it('creates a send message node', () => {
    const [node, ...rest] = createNodeRecords({ title: ' Hi ', description: ' d ', type: 'sendMessage', parentId: 'b6a0c1' })
    expect(rest).toHaveLength(0)
    expect(node).toMatchObject({ name: 'Hi', type: 'sendMessage', parentId: 'b6a0c1', data: { description: 'd', payload: [] } })
  })

  it('creates a comment node', () => {
    const [node] = createNodeRecords({ title: 'C', type: 'addComment' })
    expect(node).toMatchObject({ type: 'addComment', parentId: null, data: { comment: '' } })
  })

  it('creates business hours with success / failure connectors', () => {
    const records = createNodeRecords({ title: 'BH', type: 'businessHours' })
    expect(records).toHaveLength(3)
    const bh = asType(must(records[0]), 'dateTime')
    const success = must(records[1])
    const failure = must(records[2])
    expect(bh.data.times).toHaveLength(7)
    expect(bh.data.connectors).toEqual([success.id, failure.id])
    expect(success).toMatchObject({ parentId: bh.id, data: { connectorType: 'success' } })
    expect(failure).toMatchObject({ parentId: bh.id, data: { connectorType: 'failure' } })
    expect(new Set(records.map((r) => r.id)).size).toBe(3)
  })

  it('avoids existing ids and rejects unknown types', () => {
    const [node] = createNodeRecords({ title: 'x', type: 'addComment' }, new Set(['abc']))
    expect(node?.id).not.toBe('abc')
    expect(() => createNodeRecords({ title: 'x', type: 'nope' as CreatableNodeType })).toThrow()
  })
})

describe('removeNodeFromList', () => {
  it('re-parents children to the removed node parent', () => {
    const { nodes, removedIds } = removeNodeFromList(payloadNodes(), 'b6a0c1')
    expect(removedIds).toEqual(['b6a0c1'])
    expect(byId(nodes, 'e879e4').parentId).toBe('28c4b9')
  })

  it('removes business hours together with its connectors', () => {
    const { nodes, removedIds } = removeNodeFromList(payloadNodes(), 'd09c08')
    expect(removedIds.sort()).toEqual(['161f52', '28c4b9', 'd09c08'])
    expect(byId(nodes, 'b0653a').parentId).toBe('1')
    expect(byId(nodes, 'b6a0c1').parentId).toBe('1')
  })

  it('is a no-op for unknown ids', () => {
    const list = payloadNodes()
    expect(removeNodeFromList(list, 'zzz')).toEqual({ nodes: list, removedIds: [] })
  })
})
