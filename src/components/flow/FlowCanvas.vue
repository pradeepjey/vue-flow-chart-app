<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { VueFlow, useVueFlow, type NodeDragEvent, type NodeMouseEvent } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import FlowNodeCard from './nodes/FlowNode.vue'
import ConnectorPill from './nodes/ConnectorNode.vue'
import { useFlowStore } from '@/stores/flow'
import { buildEdges } from '@/utils/flow'
import { nodeSize } from '@/utils/layout'
import {
  centreTarget,
  isRectVisible,
  toFlowNode,
  type CanvasNode,
  type ConnectorPillData,
  type FlowCardData,
} from '@/utils/canvas'
import { DRAWER_WIDTH } from '@/constants/flow'
import type { FlowNode as FlowRecord, XYPosition } from '@/types/flow'

const FLOW_ID = 'flow-canvas'

const props = withDefaults(
  defineProps<{
    /** Node whose details drawer is open (from the route). */
    activeNodeId?: string | null
  }>(),
  { activeNodeId: null },
)
const emit = defineEmits<{
  'toggle-node': [id: string]
  close: []
}>()

const store = useFlowStore()
const { setCenter, getViewport, dimensions, findNode, fitView } = useVueFlow(FLOW_ID)

interface CacheEntry {
  record: FlowRecord
  position: XYPosition
  active: boolean
  node: CanvasNode
}

/*
 * Memoise Vue Flow node objects per record: an unchanged record, position
 * and active flag returns the *same* object, so Vue Flow and the node
 * components skip work for nodes that did not change.
 */
const cache = new Map<string, CacheEntry>()
const flowNodes = computed<CanvasNode[]>(() => {
  const seen = new Set<string>()
  const result = store.nodes.map((record) => {
    const position = store.positions[record.id] ?? { x: 0, y: 0 }
    const active = record.id === props.activeNodeId
    seen.add(record.id)
    const hit = cache.get(record.id)
    if (hit && hit.record === record && hit.position === position && hit.active === active) return hit.node
    const node = toFlowNode(record, position, props.activeNodeId)
    cache.set(record.id, { record, position, active, node })
    return node
  })
  for (const id of cache.keys()) if (!seen.has(id)) cache.delete(id)
  return result
})

const flowEdges = computed(() => buildEdges(store.nodes))

function onNodeClick({ node }: NodeMouseEvent): void {
  if (node.type === 'connector') return
  emit('toggle-node', node.id)
}

function onDragStop({ nodes }: NodeDragEvent): void {
  store.moveNodes(nodes.map((n) => ({ id: n.id, position: n.position })))
}

/** Enter / Space on a focused node toggles its drawer (Escape is global). */
function onKeydown(event: KeyboardEvent): void {
  const el = event.target instanceof Element ? event.target.closest('.vue-flow__node') : null
  if (!el || (event.key !== 'Enter' && event.key !== ' ')) return
  const record = store.getNode(el.getAttribute('data-id'))
  if (!record || record.type === 'dateTimeConnector') return
  event.preventDefault()
  emit('toggle-node', record.id)
}

/** Smoothly bring the active node into view, clear of the drawer. */
function revealNode(id: string): void {
  const node = findNode(id)
  const record = store.getNode(id)
  if (!node || !record) return
  const viewport = getViewport()
  const size = nodeSize(record)
  const pane = dimensions.value
  const obstructRight = Math.min(DRAWER_WIDTH, pane.width * 0.6)
  if (isRectVisible({ position: node.position, size, viewport, pane, obstructRight })) return
  const target = centreTarget({ position: node.position, size, zoom: viewport.zoom, obstructRight })
  void setCenter(target.x, target.y, { zoom: viewport.zoom, duration: 450 })
}

watch(
  () => props.activeNodeId,
  async (id) => {
    if (!id) return
    await nextTick()
    revealNode(id)
  },
)

function onInit(): void {
  void fitView({ padding: 0.2, maxZoom: 1 })
  const id = props.activeNodeId
  if (id) setTimeout(() => revealNode(id), 60)
}

defineExpose({ fitView: () => fitView({ padding: 0.2, maxZoom: 1, duration: 400 }) })
</script>

<template>
  <div class="h-full w-full" @keydown="onKeydown">
    <VueFlow
      :id="FLOW_ID"
      :nodes="flowNodes"
      :edges="flowEdges"
      :min-zoom="0.2"
      :max-zoom="2"
      :nodes-connectable="false"
      :edges-updatable="false"
      :edges-focusable="false"
      :delete-key-code="null"
      :zoom-on-double-click="false"
      :snap-to-grid="true"
      :snap-grid="[4, 4]"
      class="h-full w-full"
      aria-label="Flow chart canvas"
      @init="onInit"
      @node-click="onNodeClick"
      @node-drag-stop="onDragStop"
      @pane-click="emit('close')"
    >
      <!-- Custom node renderers (typed slots; only the props each card needs). -->
      <template #node-flow="{ id, data }">
        <FlowNodeCard :id="id" :data="data as FlowCardData" />
      </template>
      <template #node-connector="{ id, data }">
        <ConnectorPill :id="id" :data="data as ConnectorPillData" />
      </template>
      <Background :gap="18" :size="1.2" pattern-color="#cbd5e1" />
      <Controls position="bottom-left" :show-interactive="false" />
    </VueFlow>
  </div>
</template>
