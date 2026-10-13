/*
 * Domain types for the flow document.
 *
 * `Raw*` types describe the JSON payload exactly as served from S3.
 * `FlowNode*` types describe the normalised records held in the store
 * (string ids, `null` for roots, guaranteed `name` / `data`).
 */

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type ConnectorType = 'success' | 'failure'
export type CreatableNodeType = 'sendMessage' | 'addComment' | 'businessHours'
export type NodeKind = 'trigger' | CreatableNodeType

export interface TextPayload {
  type: 'text'
  text: string
}
export interface AttachmentPayload {
  type: 'attachment'
  attachment: string
}
export type MessagePayload = TextPayload | AttachmentPayload

export interface BusinessHoursTime {
  day: DayKey
  startTime: string
  endTime: string
}

/** Optional user-entered description, available on every editable node. */
interface Describable {
  description?: string
}

export interface TriggerData extends Describable {
  type: string
  oncePerContact: boolean
}
export interface SendMessageData extends Describable {
  payload: MessagePayload[]
}
export interface AddCommentData extends Describable {
  comment: string
}
export interface BusinessHoursData extends Describable {
  times: BusinessHoursTime[]
  connectors: string[]
  timezone: string
  action: 'businessHours'
}
export interface ConnectorData {
  connectorType: ConnectorType
}

interface NodeBase<T extends string, D> {
  id: string
  parentId: string | null
  type: T
  name: string
  data: D
}

export type TriggerNode = NodeBase<'trigger', TriggerData>
export type SendMessageNode = NodeBase<'sendMessage', SendMessageData>
export type AddCommentNode = NodeBase<'addComment', AddCommentData>
export type BusinessHoursNode = NodeBase<'dateTime', BusinessHoursData>
export type ConnectorNode = NodeBase<'dateTimeConnector', ConnectorData>

export type FlowNode = TriggerNode | SendMessageNode | AddCommentNode | BusinessHoursNode | ConnectorNode
export type FlowNodeType = FlowNode['type']
export type FlowNodeData = FlowNode['data']

/** A node as found in the raw payload (ids may be numbers, root = -1). */
export interface RawFlowNode {
  id: string | number
  parentId?: string | number | null
  type: FlowNodeType
  name?: string
  data?: Record<string, unknown>
}

export interface XYPosition {
  x: number
  y: number
}
export interface Size {
  width: number
  height: number
}
export type PositionMap = Record<string, XYPosition>

/** Patch applied by the drawer's "Save changes". */
export interface NodePatch {
  name?: string
  data?: FlowNodeData
}

/** Submission of the "Create New Node" dialog. */
export interface CreateNodeInput {
  title: string
  description?: string
  type: CreatableNodeType
  parentId?: string | null
}

/** Field -> message map; only failing fields are present. */
export type ValidationErrors = Record<string, string>
