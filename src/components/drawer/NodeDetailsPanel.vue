<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { LoaderCircle, RotateCcw, Trash2, X } from 'lucide-vue-next'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent } from '@/components/ui/alert-dialog'
import FieldError from '@/components/common/FieldError.vue'
import SendMessageFields from './SendMessageFields.vue'
import AddCommentFields from './AddCommentFields.vue'
import BusinessHoursFields from './BusinessHoursFields.vue'
import { getKindMeta } from '@/constants/nodeKinds'
import { LIMITS } from '@/constants/flow'
import type { FlowNode, NodePatch, ValidationErrors } from '@/types/flow'
import { draftFromNode, isDraftDirty, patchFromDraft, validateDraft, type NodeDraft } from '@/utils/draft'
import { hasErrors } from '@/utils/validation'

/**
 * Editable details for one node. Works on a local draft: "Save" validates
 * and emits a `{ name, data }` patch, "Reset" discards edits. When the
 * stored node changes underneath (undo / redo) the draft is re-seeded.
 */
const props = withDefaults(defineProps<{ node: FlowNode; saving?: boolean; deleting?: boolean }>(), {
  saving: false,
  deleting: false,
})
const emit = defineEmits<{
  save: [patch: Required<NodePatch>]
  delete: []
  close: []
}>()

const draft = ref<NodeDraft>(draftFromNode(props.node))
const submitted = ref(false)
const confirmOpen = ref(false)

watch(
  () => props.node,
  (node) => {
    draft.value = draftFromNode(node)
    submitted.value = false
  },
)

const meta = computed(() => getKindMeta(draft.value.kind))
const errors = computed<ValidationErrors>(() => validateDraft(draft.value))
const dirty = computed(() => isDraftDirty(draft.value, props.node))
const showErrors = computed(() => submitted.value || dirty.value)
const visibleErrors = computed<ValidationErrors>(() => (showErrors.value ? errors.value : {}))
const oncePerContact = computed(() => props.node.type === 'trigger' && props.node.data.oncePerContact)

function onSubmit(): void {
  submitted.value = true
  if (hasErrors(errors.value) || !dirty.value) return
  emit('save', patchFromDraft(draft.value, props.node))
}

function reset(): void {
  draft.value = draftFromNode(props.node)
  submitted.value = false
}
</script>

<template>
  <form class="flex h-full flex-col" novalidate data-testid="node-details-form" @submit.prevent="onSubmit">
    <header class="flex items-start gap-3 border-b px-5 py-4">
      <span
        class="grid size-9 shrink-0 place-items-center rounded-lg"
        :style="{ color: meta.color, backgroundColor: `color-mix(in oklab, ${meta.color} 12%, transparent)` }"
        aria-hidden="true"
      >
        <component :is="meta.icon" class="size-5" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 id="drawer-title" class="truncate text-base font-semibold" data-testid="drawer-title">{{ node.name }}</h2>
        <p class="text-xs text-muted-foreground">{{ meta.label }} · <span class="font-mono">#{{ node.id }}</span></p>
      </div>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Close details" data-testid="close-drawer" @click="emit('close')">
        <X />
      </Button>
    </header>

    <div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
      <section class="space-y-4">
        <div class="space-y-1.5">
          <Label for="node-title">Title</Label>
          <Input
            id="node-title"
            v-model="draft.title"
            :maxlength="LIMITS.TITLE_MAX"
            autocomplete="off"
            :aria-invalid="!!visibleErrors.title || undefined"
            aria-describedby="node-title-error"
          />
          <FieldError id="node-title-error" :message="visibleErrors.title" />
        </div>
        <div class="space-y-1.5">
          <Label for="node-description">Description</Label>
          <Textarea
            id="node-description"
            v-model="draft.description"
            :rows="2"
            :maxlength="LIMITS.DESCRIPTION_MAX"
            placeholder="Optional — shown on the canvas card"
            :aria-invalid="!!visibleErrors.description || undefined"
          />
          <FieldError :message="visibleErrors.description" />
        </div>
      </section>

      <div class="h-px bg-border" />

      <SendMessageFields
        v-if="draft.kind === 'sendMessage'"
        v-model="draft.payload"
        :errors="errors"
        :show-errors="showErrors"
      />
      <AddCommentFields v-else-if="draft.kind === 'addComment'" v-model="draft.comment" :error="visibleErrors.comment" />
      <BusinessHoursFields
        v-else-if="draft.kind === 'businessHours'"
        v-model:days="draft.days"
        v-model:timezone="draft.timezone"
        :errors="errors"
        :show-errors="showErrors"
      />
      <section v-else-if="draft.kind === 'trigger'" class="space-y-2 text-sm">
        <h3 class="font-medium">Trigger</h3>
        <dl class="grid grid-cols-[120px_1fr] gap-y-1 text-muted-foreground">
          <dt>Event</dt>
          <dd class="text-foreground">Conversation opened</dd>
          <dt>Once per contact</dt>
          <dd class="text-foreground">{{ oncePerContact ? 'Yes' : 'No' }}</dd>
        </dl>
      </section>
    </div>

    <footer class="flex items-center gap-2 border-t px-5 py-3">
      <AlertDialog v-model:open="confirmOpen">
        <Button
          v-if="draft.kind !== 'trigger'"
          type="button"
          variant="ghost"
          class="text-destructive hover:bg-destructive/10 hover:text-destructive"
          :disabled="deleting"
          data-testid="delete-node"
          @click="confirmOpen = true"
        >
          <Trash2 /> Delete
        </Button>
        <AlertDialogContent
          :title="`Delete “${node.name}”?`"
          description="The node will be removed from the flow. Any nodes connected below it will be re-attached to its parent. You can undo this."
        >
          <template #footer>
            <AlertDialogCancel :class="buttonVariants({ variant: 'outline' })">Cancel</AlertDialogCancel>
            <AlertDialogAction
              :class="buttonVariants({ variant: 'destructive' })"
              data-testid="confirm-delete"
              @click="emit('delete')"
            >
              Delete node
            </AlertDialogAction>
          </template>
        </AlertDialogContent>
      </AlertDialog>
      <div class="ml-auto flex gap-2">
        <Button type="button" variant="outline" :disabled="!dirty || saving" data-testid="reset-node" @click="reset">
          <RotateCcw /> Reset
        </Button>
        <Button type="submit" :disabled="!dirty || saving" data-testid="save-node">
          <LoaderCircle v-if="saving" class="animate-spin" />
          Save changes
        </Button>
      </div>
    </footer>
  </form>
</template>
