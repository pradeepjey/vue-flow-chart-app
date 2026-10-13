import { CalendarClock, MessageSquareText, Send, Zap } from 'lucide-vue-next'
import { markRaw, type Component } from 'vue'
import type { NodeKind } from '@/types/flow'

export interface NodeKindMeta {
  label: string
  icon: Component
  color: string
}

/** Visual metadata per node kind (icons are raw components: never reactive). */
export const NODE_KIND_META: Readonly<Record<NodeKind, NodeKindMeta>> = {
  trigger: { label: 'Trigger', icon: markRaw(Zap), color: 'var(--kind-trigger)' },
  sendMessage: { label: 'Send Message', icon: markRaw(Send), color: 'var(--kind-message)' },
  addComment: { label: 'Add Comment', icon: markRaw(MessageSquareText), color: 'var(--kind-comment)' },
  businessHours: { label: 'Business Hours', icon: markRaw(CalendarClock), color: 'var(--kind-hours)' },
}

export const getKindMeta = (kind: NodeKind | null | undefined): NodeKindMeta =>
  (kind && NODE_KIND_META[kind]) || NODE_KIND_META.sendMessage
