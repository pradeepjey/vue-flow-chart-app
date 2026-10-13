import { DAYS, DEFAULT_BUSINESS_HOURS } from '@/constants/flow'
import type {
  AttachmentPayload,
  BusinessHoursData,
  DayKey,
  FlowNode,
  FlowNodeData,
  MessagePayload,
  NodeKind,
  NodePatch,
  TextPayload,
  ValidationErrors,
} from '@/types/flow'
import { clone, getDescription, isConnector } from '@/utils/flow'
import {
  validateBusinessHours,
  validateComment,
  validateDescription,
  validateSendMessage,
  validateTitle,
} from '@/utils/validation'

/** Payload items carry a stable `key` for v-for while being edited. */
export type DraftTextItem = TextPayload & { key: string }
export type DraftAttachmentItem = AttachmentPayload & { key: string; fileName?: string }
export type DraftPayloadItem = DraftTextItem | DraftAttachmentItem

export interface DraftDay {
  day: DayKey
  enabled: boolean
  startTime: string
  endTime: string
}

interface DraftBase<K extends NodeKind> {
  kind: K
  title: string
  description: string
}

export type TriggerDraft = DraftBase<'trigger'>
export type SendMessageDraft = DraftBase<'sendMessage'> & { payload: DraftPayloadItem[] }
export type AddCommentDraft = DraftBase<'addComment'> & { comment: string }
export type BusinessHoursDraft = DraftBase<'businessHours'> & { days: DraftDay[]; timezone: string }

export type NodeDraft = TriggerDraft | SendMessageDraft | AddCommentDraft | BusinessHoursDraft

let keySeq = 0
/** Stable keys for v-for over editable list items. */
export const nextKey = (): string => `k${++keySeq}`

/**
 * Convert a node record into an editable drawer draft. Drafts are plain
 * objects decoupled from the store so edits can be validated and either
 * saved (one undo step) or discarded.
 */
export function draftFromNode(node: FlowNode): NodeDraft {
  if (isConnector(node)) throw new Error('Connector nodes are not editable')
  const base = { title: node.name ?? '', description: getDescription(node) }

  switch (node.type) {
    case 'sendMessage':
      return {
        ...base,
        kind: 'sendMessage',
        payload: (node.data.payload ?? []).map((p) => ({ key: nextKey(), ...clone(p) })),
      }
    case 'addComment':
      return { ...base, kind: 'addComment', comment: node.data.comment ?? '' }
    case 'dateTime': {
      const byDay = new Map((node.data.times ?? []).map((t) => [t.day, t]))
      return {
        ...base,
        kind: 'businessHours',
        timezone: node.data.timezone ?? 'UTC',
        days: DAYS.map(({ key }) => {
          const t = byDay.get(key)
          return {
            day: key,
            enabled: Boolean(t),
            startTime: t?.startTime ?? DEFAULT_BUSINESS_HOURS.startTime,
            endTime: t?.endTime ?? DEFAULT_BUSINESS_HOURS.endTime,
          }
        }),
      }
    }
    default:
      return { ...base, kind: 'trigger' }
  }
}

/** Convert a draft back into a `{ name, data }` patch for the store. */
export function patchFromDraft(draft: NodeDraft, node: FlowNode): Required<NodePatch> {
  const data = { ...clone(node.data) } as Record<string, unknown>
  const description = draft.description.trim()
  if (description) data.description = description
  else delete data.description

  switch (draft.kind) {
    case 'sendMessage':
      data.payload = draft.payload.map(
        (item): MessagePayload =>
          item.type === 'text'
            ? { type: 'text', text: item.text.trim() }
            : { type: 'attachment', attachment: item.attachment },
      )
      break
    case 'addComment':
      data.comment = draft.comment.trim()
      break
    case 'businessHours':
      data.timezone = draft.timezone
      data.times = draft.days
        .filter((d) => d.enabled)
        .map(({ day, startTime, endTime }) => ({ startTime, endTime, day })) satisfies BusinessHoursData['times']
      break
  }
  return { name: draft.title.trim(), data: data as unknown as FlowNodeData }
}

/** Has the draft diverged from the stored node? */
export function isDraftDirty(draft: NodeDraft, node: FlowNode): boolean {
  return JSON.stringify(patchFromDraft(draft, node)) !== JSON.stringify(patchFromDraft(draftFromNode(node), node))
}

/** Validate a draft; returns `{ field: message }` for failing fields only. */
export function validateDraft(draft: NodeDraft): ValidationErrors {
  const errors: ValidationErrors = {}
  const title = validateTitle(draft.title)
  if (title) errors.title = title
  const description = validateDescription(draft.description)
  if (description) errors.description = description

  if (draft.kind === 'sendMessage') {
    const texts = draft.payload.filter((p): p is DraftTextItem => p.type === 'text')
    const attachments = draft.payload.filter((p) => p.type === 'attachment')
    const result = validateSendMessage({ texts: texts.map((t) => t.text), attachments })
    // Re-key text errors by the item's stable key for the UI.
    texts.forEach((t, i) => {
      const msg = result[`text-${i}`]
      if (msg) errors[t.key] = msg
    })
    if (result.payload) errors.payload = result.payload
  } else if (draft.kind === 'addComment') {
    const comment = validateComment(draft.comment)
    if (comment) errors.comment = comment
  } else if (draft.kind === 'businessHours') {
    const enabled = draft.days.filter((d) => d.enabled)
    Object.assign(errors, validateBusinessHours({ times: enabled, timezone: draft.timezone }))
  }
  return errors
}

