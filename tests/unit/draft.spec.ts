import { describe, expect, it } from 'vitest'
import { draftFromNode, isDraftDirty, patchFromDraft, validateDraft } from '@/utils/draft'
import type { BusinessHoursData, FlowNode, SendMessageData } from '@/types/flow'
import { asKind, byId, must, payloadNodes } from '../helpers'

const nodes = payloadNodes()

describe('drafts', () => {
  it('round-trips a send message node without changes', () => {
    const node = byId(nodes, 'b0653a')
    const draft = asKind(draftFromNode(node), 'sendMessage')
    expect(draft.payload.every((p) => p.key)).toBe(true)
    expect(patchFromDraft(draft, node)).toEqual({ name: node.name, data: node.data })
    expect(isDraftDirty(draft, node)).toBe(false)
  })

  it('detects edits and trims values', () => {
    const node = byId(nodes, 'e879e4')
    const draft = asKind(draftFromNode(node), 'addComment')
    draft.comment = '  new  '
    draft.description = ' desc '
    expect(isDraftDirty(draft, node)).toBe(true)
    expect(patchFromDraft(draft, node).data).toMatchObject({ comment: 'new', description: 'desc' })
  })

  it('removes empty descriptions from data', () => {
    const node: FlowNode = { ...byId(nodes, 'e879e4'), type: 'addComment', data: { comment: 'x', description: 'old' } }
    const draft = draftFromNode(node)
    draft.description = ''
    expect(patchFromDraft(draft, node).data).not.toHaveProperty('description')
  })

  it('maps business hours to 7 days and back, dropping closed days', () => {
    const node = byId(nodes, 'd09c08')
    const draft = asKind(draftFromNode(node), 'businessHours')
    expect(draft.days).toHaveLength(7)
    must(draft.days[6]).enabled = false
    const data = patchFromDraft(draft, node).data as BusinessHoursData
    expect(data.times).toHaveLength(6)
    expect(data.times.map((t) => t.day)).not.toContain('sun')
    expect(data.connectors).toEqual(['161f52', '28c4b9'])
  })

  it('keeps payload order and strips UI keys', () => {
    const node = byId(nodes, 'b0653a')
    const draft = asKind(draftFromNode(node), 'sendMessage')
    draft.payload.push({ key: 'k', type: 'attachment', attachment: 'data:image/png;base64,AA', fileName: 'a.png' })
    const data = patchFromDraft(draft, node).data as SendMessageData
    expect(data.payload[2]).toEqual({ type: 'attachment', attachment: 'data:image/png;base64,AA' })
  })

  it('refuses to draft display-only connectors', () => {
    expect(() => draftFromNode(byId(nodes, '161f52'))).toThrow()
  })

  it('validates per kind', () => {
    const msg = asKind(draftFromNode(byId(nodes, 'b6a0c1')), 'sendMessage')
    const first = must(msg.payload[0])
    if (first.type === 'text') first.text = ''
    expect(validateDraft(msg)[first.key]).toBeTruthy()

    const hours = asKind(draftFromNode(byId(nodes, 'd09c08')), 'businessHours')
    must(hours.days[0]).endTime = '08:00'
    expect(validateDraft(hours)).toHaveProperty('mon')

    const comment = draftFromNode(byId(nodes, 'e879e4'))
    comment.title = ''
    expect(validateDraft(comment)).toHaveProperty('title')

    expect(validateDraft(draftFromNode(byId(nodes, '1')))).toEqual({})
  })
})
