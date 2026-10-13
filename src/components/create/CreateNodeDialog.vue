<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import FieldError from '@/components/common/FieldError.vue'
import { CREATABLE_NODE_TYPES, LIMITS } from '@/constants/flow'
import { useFlowStore } from '@/stores/flow'
import type { CreatableNodeType, CreateNodeInput, ValidationErrors } from '@/types/flow'
import { getAttachableParents, isConnector } from '@/utils/flow'
import { hasErrors, validateNodeForm } from '@/utils/validation'

type Field = 'title' | 'description' | 'type'
interface FormState {
  title: string
  description: string
  type: CreatableNodeType | ''
  parentId: string
}

/**
 * "Create New Node" dialog. Emits `submit` with a validated form payload;
 * the parent owns the mutation so this component stays presentational.
 */
const props = withDefaults(
  defineProps<{
    pending?: boolean
    /** Pre-selected parent (e.g. the node whose drawer is open). */
    defaultParentId?: string | null
  }>(),
  { pending: false, defaultParentId: null },
)
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ submit: [input: CreateNodeInput] }>()

const store = useFlowStore()
const emptyForm = (): FormState => ({ title: '', description: '', type: '', parentId: '' })
const form = reactive<FormState>(emptyForm())
const touched = reactive<Partial<Record<Field, boolean>>>({})
const submitted = ref(false)

const parentOptions = computed(() => {
  const byId = new Map(store.nodes.map((n) => [n.id, n]))
  return getAttachableParents(store.nodes).map((n) => ({
    value: n.id,
    label: isConnector(n) ? `${(n.parentId && byId.get(n.parentId)?.name) || 'Business Hours'} → ${n.name}` : n.name,
  }))
})

const errors = computed<ValidationErrors>(() => validateNodeForm(form))
const show = (field: Field): string => (submitted.value || touched[field] ? (errors.value[field] ?? '') : '')

watch(open, (isOpen) => {
  if (!isOpen) return
  Object.assign(form, emptyForm())
  ;(Object.keys(touched) as Field[]).forEach((k) => delete touched[k])
  submitted.value = false
  if (props.defaultParentId && parentOptions.value.some((o) => o.value === props.defaultParentId)) {
    form.parentId = props.defaultParentId
  }
})

function onSubmit(): void {
  submitted.value = true
  if (hasErrors(errors.value) || !form.type) return
  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    type: form.type,
    parentId: form.parentId || null,
  })
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md" data-testid="create-dialog">
      <DialogHeader>
        <DialogTitle>Create new node</DialogTitle>
        <DialogDescription>Add a step to the flow. You can edit its details afterwards.</DialogDescription>
      </DialogHeader>
      <form id="create-node-form" class="space-y-4" novalidate @submit.prevent="onSubmit">
        <div class="space-y-1.5">
          <Label for="create-title">Title <span class="text-destructive" aria-hidden="true">*</span></Label>
          <Input
            id="create-title"
            v-model="form.title"
            :maxlength="LIMITS.TITLE_MAX"
            placeholder="e.g. Welcome Message"
            autocomplete="off"
            required
            :aria-invalid="!!show('title') || undefined"
            @blur="touched.title = true"
          />
          <FieldError :message="show('title')" />
        </div>
        <div class="space-y-1.5">
          <Label for="create-description">Description</Label>
          <Textarea
            id="create-description"
            v-model="form.description"
            :rows="3"
            :maxlength="LIMITS.DESCRIPTION_MAX"
            placeholder="What does this step do?"
            :aria-invalid="!!show('description') || undefined"
            @blur="touched.description = true"
          />
          <div class="flex text-xs text-muted-foreground">
            <FieldError :message="show('description')" />
            <span class="ml-auto tabular-nums">{{ form.description.length }}/{{ LIMITS.DESCRIPTION_MAX }}</span>
          </div>
        </div>
        <div class="space-y-1.5">
          <Label for="create-type">Type of node <span class="text-destructive" aria-hidden="true">*</span></Label>
          <NativeSelect
            id="create-type"
            v-model="form.type"
            required
            :aria-invalid="!!show('type') || undefined"
            @blur="touched.type = true"
          >
            <option value="" disabled>Select a type…</option>
            <option v-for="t in CREATABLE_NODE_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </NativeSelect>
          <FieldError :message="show('type')" />
        </div>
        <div class="space-y-1.5">
          <Label for="create-parent">Connect after</Label>
          <NativeSelect id="create-parent" v-model="form.parentId">
            <option value="">None (standalone node)</option>
            <option v-for="p in parentOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
          </NativeSelect>
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" @click="open = false">Cancel</Button>
        <Button type="submit" form="create-node-form" :disabled="pending" data-testid="create-submit">
          <LoaderCircle v-if="pending" class="animate-spin" />
          Create node
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
