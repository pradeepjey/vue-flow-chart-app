import { describe, expect, it } from 'vitest'
import {
  hasErrors,
  validateAttachmentFile,
  validateBusinessHours,
  validateComment,
  validateDescription,
  validateMessageText,
  validateNodeForm,
  validateNodeType,
  validateSendMessage,
  validateTimeRange,
  validateTimeZone,
  validateTitle,
} from '@/utils/validation'

describe('field validators', () => {
  it('title', () => {
    expect(validateTitle('')).toMatch(/required/)
    expect(validateTitle('   ')).toMatch(/required/)
    expect(validateTitle('a')).toMatch(/at least/)
    expect(validateTitle('a'.repeat(61))).toMatch(/60/)
    expect(validateTitle('Welcome')).toBe('')
  })

  it('description', () => {
    expect(validateDescription('')).toBe('')
    expect(validateDescription('a'.repeat(201))).toMatch(/200/)
  })

  it('node type', () => {
    expect(validateNodeType('')).toMatch(/choose/)
    expect(validateNodeType('trigger')).toMatch(/Unsupported/)
    expect(validateNodeType('businessHours')).toBe('')
  })

  it('message text and comment', () => {
    expect(validateMessageText(' ')).toMatch(/empty/)
    expect(validateMessageText('hi')).toBe('')
    expect(validateComment('')).toBe('')
    expect(validateComment('x'.repeat(501))).toMatch(/500/)
  })

  it('time range', () => {
    expect(validateTimeRange('09:00', '17:00')).toBe('')
    expect(validateTimeRange('17:00', '09:00')).toMatch(/after/)
    expect(validateTimeRange('09:00', '09:00')).toMatch(/after/)
    expect(validateTimeRange('x', '09:00')).toMatch(/Start/)
    expect(validateTimeRange('09:00', 'x')).toMatch(/End/)
  })

  it('time zone', () => {
    expect(validateTimeZone('UTC')).toBe('')
    expect(validateTimeZone('')).toMatch(/required/)
    expect(validateTimeZone('Mars/Base')).toMatch(/Unknown/)
  })

  it('attachment file', () => {
    expect(validateAttachmentFile(null)).toMatch(/No file/)
    expect(validateAttachmentFile({ type: 'text/plain', size: 1 })).toMatch(/Only images/)
    expect(validateAttachmentFile({ type: 'image/png', size: 6 * 1024 * 1024 })).toMatch(/5 MB/)
    expect(validateAttachmentFile({ type: 'image/png', size: 1000 })).toBe('')
  })
})

describe('form validators', () => {
  it('create node form returns only failing fields', () => {
    expect(validateNodeForm({ title: 'Ok', description: '', type: 'addComment' })).toEqual({})
    const errors = validateNodeForm({ title: '', description: '', type: '' })
    expect(Object.keys(errors).sort()).toEqual(['title', 'type'])
    expect(hasErrors(errors)).toBe(true)
    expect(hasErrors({})).toBe(false)
  })

  it('send message', () => {
    expect(validateSendMessage({ texts: ['a'], attachments: [] })).toEqual({})
    expect(validateSendMessage({ texts: [], attachments: [] })).toHaveProperty('payload')
    expect(validateSendMessage({ texts: ['ok', ''], attachments: [] })).toHaveProperty('text-1')
  })

  it('business hours', () => {
    const errs = validateBusinessHours({
      times: [
        { day: 'mon', startTime: '09:00', endTime: '17:00' },
        { day: 'tue', startTime: '18:00', endTime: '17:00' },
      ],
      timezone: 'UTC',
    })
    expect(Object.keys(errs)).toEqual(['tue'])
  })
})
