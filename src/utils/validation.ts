import { ACCEPTED_ATTACHMENT_TYPES, CREATABLE_NODE_TYPES, LIMITS } from '@/constants/flow'
import type { BusinessHoursTime, ValidationErrors } from '@/types/flow'
import { isValidTime, timeToMinutes } from '@/utils/time'

/*
 * Every validator returns an error message string, or '' when valid.
 * Form-level validators return an object of field -> message containing
 * only the failing fields, so `hasErrors(obj)` is a simple key check.
 */

type Maybe<T> = T | null | undefined

export function validateTitle(value: Maybe<string>): string {
  const v = (value ?? '').trim()
  if (!v) return 'Title is required.'
  if (v.length < 2) return 'Title must be at least 2 characters.'
  if (v.length > LIMITS.TITLE_MAX) return `Title must be ${LIMITS.TITLE_MAX} characters or fewer.`
  return ''
}

export function validateDescription(value: Maybe<string>): string {
  const v = (value ?? '').trim()
  if (v.length > LIMITS.DESCRIPTION_MAX) return `Description must be ${LIMITS.DESCRIPTION_MAX} characters or fewer.`
  return ''
}

export function validateNodeType(value: Maybe<string>): string {
  if (!value) return 'Please choose a node type.'
  if (!CREATABLE_NODE_TYPES.some((t) => t.value === value)) return 'Unsupported node type.'
  return ''
}

export function validateMessageText(value: Maybe<string>): string {
  const v = (value ?? '').trim()
  if (!v) return 'Message text cannot be empty — remove it instead.'
  if (v.length > LIMITS.MESSAGE_TEXT_MAX) return `Message must be ${LIMITS.MESSAGE_TEXT_MAX} characters or fewer.`
  return ''
}

export function validateComment(value: Maybe<string>): string {
  const v = (value ?? '').trim()
  if (v.length > LIMITS.COMMENT_MAX) return `Comment must be ${LIMITS.COMMENT_MAX} characters or fewer.`
  return ''
}

export function validateTimeRange(startTime: Maybe<string>, endTime: Maybe<string>): string {
  if (!isValidTime(startTime)) return 'Start time is invalid.'
  if (!isValidTime(endTime)) return 'End time is invalid.'
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return 'End time must be after start time.'
  return ''
}

export function validateTimeZone(zone: Maybe<string>): string {
  if (!zone) return 'Time zone is required.'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone })
    return ''
  } catch {
    return 'Unknown time zone.'
  }
}

export function validateAttachmentFile(file: Maybe<Pick<File, 'type' | 'size'>>): string {
  if (!file) return 'No file selected.'
  if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type))
    return 'Only images (PNG, JPG, GIF, WEBP, SVG) or PDF files are allowed.'
  if (file.size > LIMITS.ATTACHMENT_MAX_BYTES) return 'File must be 5 MB or smaller.'
  return ''
}

const compact = (obj: Record<string, string>): ValidationErrors =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v))

export const hasErrors = (errors: Maybe<ValidationErrors>): boolean => Object.keys(errors ?? {}).length > 0

/** Create-node dialog. */
export function validateNodeForm({
  title,
  description,
  type,
}: {
  title: string
  description: string
  type: string
}): ValidationErrors {
  return compact({
    title: validateTitle(title),
    description: validateDescription(description),
    type: validateNodeType(type),
  })
}

/** Send-message drawer: errors keyed as `text-<index>` plus `payload`. */
export function validateSendMessage({
  texts = [],
  attachments = [],
}: {
  texts?: readonly string[]
  attachments?: readonly unknown[]
}): ValidationErrors {
  const errors: ValidationErrors = {}
  texts.forEach((t, i) => {
    const msg = validateMessageText(t)
    if (msg) errors[`text-${i}`] = msg
  })
  if (texts.length + attachments.length === 0) errors.payload = 'Add at least one text or attachment.'
  return errors
}

/** Business-hours drawer: errors keyed by day, plus `timezone`. */
export function validateBusinessHours({
  times = [],
  timezone,
}: {
  times?: readonly BusinessHoursTime[]
  timezone: Maybe<string>
}): ValidationErrors {
  const errors: ValidationErrors = {}
  for (const t of times) {
    const msg = validateTimeRange(t.startTime, t.endTime)
    if (msg) errors[t.day] = msg
  }
  const tz = validateTimeZone(timezone)
  if (tz) errors.timezone = tz
  return errors
}
