import type { ConnectorType, CreatableNodeType, DayKey } from '@/types/flow'

/** Remote source of the flow payload. */
export const PAYLOAD_URL =
  'https://respond-io-fe-bucket.s3.ap-southeast-1.amazonaws.com/candidate-assessments/payload.json'

/** TanStack Query key for the flow document. */
export const FLOW_QUERY_KEY = ['flow'] as const

/** Raw node `type` values found in the payload. */
export const NODE_TYPES = {
  TRIGGER: 'trigger',
  SEND_MESSAGE: 'sendMessage',
  ADD_COMMENT: 'addComment',
  DATE_TIME: 'dateTime',
  DATE_TIME_CONNECTOR: 'dateTimeConnector',
} as const

/** Node kinds a user can create from the "Create New Node" dialog. */
export const CREATABLE_NODE_TYPES: ReadonlyArray<{ value: CreatableNodeType; label: string }> = [
  { value: 'sendMessage', label: 'Send Message' },
  { value: 'addComment', label: 'Add Comments' },
  { value: 'businessHours', label: 'Business Hours' },
]

export const CONNECTOR_TYPES = { SUCCESS: 'success', FAILURE: 'failure' } as const satisfies Record<string, ConnectorType>

export const DAYS: ReadonlyArray<{ key: DayKey; label: string; long: string }> = [
  { key: 'mon', label: 'Mon', long: 'Monday' },
  { key: 'tue', label: 'Tue', long: 'Tuesday' },
  { key: 'wed', label: 'Wed', long: 'Wednesday' },
  { key: 'thu', label: 'Thu', long: 'Thursday' },
  { key: 'fri', label: 'Fri', long: 'Friday' },
  { key: 'sat', label: 'Sat', long: 'Saturday' },
  { key: 'sun', label: 'Sun', long: 'Sunday' },
]

export const DEFAULT_BUSINESS_HOURS = { startTime: '09:00', endTime: '17:00' } as const

/** Field limits shared by the validators and the inputs (maxlength). */
export const LIMITS = {
  TITLE_MAX: 60,
  DESCRIPTION_MAX: 200,
  MESSAGE_TEXT_MAX: 1000,
  COMMENT_MAX: 500,
  ATTACHMENT_MAX_BYTES: 5 * 1024 * 1024,
  MAX_TEXTS: 10,
  MAX_ATTACHMENTS: 10,
} as const

export const ACCEPTED_ATTACHMENT_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]

/** Geometry used by the auto-layout and by the node components. */
export const LAYOUT = {
  NODE_WIDTH: 260,
  NODE_HEIGHT: 112,
  CONNECTOR_WIDTH: 110,
  CONNECTOR_HEIGHT: 32,
  H_GAP: 56,
  V_GAP: 72,
} as const

export const HISTORY_LIMIT = 100
export const DRAWER_WIDTH = 440
