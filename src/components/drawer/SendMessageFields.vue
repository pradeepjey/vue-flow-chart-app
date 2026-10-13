<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileText, ImagePlus, Plus, Trash2, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import FieldError from '@/components/common/FieldError.vue'
import { ACCEPTED_ATTACHMENT_TYPES, LIMITS } from '@/constants/flow'
import { nextKey, type DraftAttachmentItem, type DraftPayloadItem, type DraftTextItem } from '@/utils/draft'
import { attachmentName, isImageAttachment } from '@/utils/flow'
import { readFileAsDataUrl } from '@/utils/file'
import { validateAttachmentFile } from '@/utils/validation'
import type { ValidationErrors } from '@/types/flow'

/** Texts + attachments editor for "Send Message" nodes. */
const props = withDefaults(defineProps<{ errors?: ValidationErrors; showErrors?: boolean }>(), {
  errors: () => ({}),
  showErrors: false,
})
const payload = defineModel<DraftPayloadItem[]>({ required: true })

const texts = computed(() => payload.value.filter((p): p is DraftTextItem => p.type === 'text'))
const attachments = computed(() => payload.value.filter((p): p is DraftAttachmentItem => p.type === 'attachment'))
const uploadError = ref('')
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
/** Keys of attachments whose preview failed to load (fallback to file tile). */
const broken = ref<Set<string>>(new Set())
const markBroken = (key: string): void => {
  broken.value = new Set(broken.value).add(key)
}

const accept = ACCEPTED_ATTACHMENT_TYPES.join(',')
const tileName = (item: DraftAttachmentItem): string => item.fileName ?? attachmentName(item.attachment)

function updateText(key: string, text: string): void {
  payload.value = payload.value.map((p) => (p.key === key && p.type === 'text' ? { ...p, text } : p))
}
function removeItem(key: string): void {
  payload.value = payload.value.filter((p) => p.key !== key)
}
function addText(): void {
  payload.value = [...payload.value, { key: nextKey(), type: 'text', text: '' }]
}

async function onFiles(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  uploadError.value = ''
  const files = [...(input.files ?? [])]
  input.value = ''
  if (attachments.value.length + files.length > LIMITS.MAX_ATTACHMENTS) {
    uploadError.value = `You can attach up to ${LIMITS.MAX_ATTACHMENTS} files.`
    return
  }
  const invalid = files.map(validateAttachmentFile).find(Boolean)
  if (invalid) {
    uploadError.value = invalid
    return
  }
  uploading.value = true
  try {
    const urls = await Promise.all(files.map(readFileAsDataUrl))
    payload.value = [
      ...payload.value,
      ...urls.map(
        (attachment, i): DraftAttachmentItem => ({
          key: nextKey(),
          type: 'attachment',
          attachment,
          fileName: files[i]?.name,
        }),
      ),
    ]
  } catch {
    uploadError.value = 'Could not read the selected file.'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <section class="space-y-3" aria-labelledby="attachments-heading">
    <div class="flex items-center justify-between">
      <h3 id="attachments-heading" class="text-sm font-medium">Attachments</h3>
      <span class="text-xs text-muted-foreground">{{ attachments.length }}/{{ LIMITS.MAX_ATTACHMENTS }}</span>
    </div>
    <ul class="grid grid-cols-3 gap-2" data-testid="attachment-list">
      <li
        v-for="item in attachments"
        :key="item.key"
        class="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
        data-testid="attachment-tile"
      >
        <img
          v-if="isImageAttachment(item.attachment) && !broken.has(item.key)"
          :src="item.attachment"
          :alt="tileName(item)"
          class="size-full object-cover"
          loading="lazy"
          @error="markBroken(item.key)"
        />
        <div v-else class="flex size-full flex-col items-center justify-center gap-1 p-2 text-center">
          <FileText class="size-6 text-muted-foreground" />
          <span class="line-clamp-2 text-[11px] break-all">{{ tileName(item) }}</span>
        </div>
        <button
          type="button"
          class="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          :aria-label="`Remove attachment ${tileName(item)}`"
          @click="removeItem(item.key)"
        >
          <X class="size-3.5" />
        </button>
      </li>
      <li v-if="attachments.length < LIMITS.MAX_ATTACHMENTS" class="aspect-square">
        <button
          type="button"
          class="flex size-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
          :disabled="uploading"
          data-testid="upload-button"
          @click="fileInput?.click()"
        >
          <ImagePlus class="size-5" />
          {{ uploading ? 'Uploading…' : 'Upload' }}
        </button>
        <input
          ref="fileInput"
          type="file"
          class="sr-only"
          multiple
          :accept="accept"
          aria-label="Upload attachments"
          data-testid="file-input"
          @change="onFiles"
        />
      </li>
    </ul>
    <FieldError :message="uploadError" />
  </section>

  <section class="space-y-3" aria-labelledby="texts-heading">
    <div class="flex items-center justify-between">
      <h3 id="texts-heading" class="text-sm font-medium">Messages</h3>
      <Button
        type="button"
        variant="outline"
        size="sm"
        :disabled="texts.length >= LIMITS.MAX_TEXTS"
        data-testid="add-text"
        @click="addText"
      >
        <Plus /> Add text
      </Button>
    </div>
    <p v-if="!texts.length" class="text-xs text-muted-foreground">No text messages.</p>
    <div v-for="(item, index) in texts" :key="item.key" class="space-y-1.5" data-testid="text-item">
      <div class="flex items-center justify-between">
        <Label :for="`text-${item.key}`" class="text-xs text-muted-foreground">Text {{ index + 1 }}</Label>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          class="text-muted-foreground hover:text-destructive"
          :aria-label="`Remove text ${index + 1}`"
          data-testid="remove-text"
          @click="removeItem(item.key)"
        >
          <Trash2 />
        </Button>
      </div>
      <Textarea
        :id="`text-${item.key}`"
        :model-value="item.text"
        :rows="3"
        :maxlength="LIMITS.MESSAGE_TEXT_MAX"
        placeholder="Type a message…"
        :aria-invalid="(showErrors && !!props.errors[item.key]) || undefined"
        @update:model-value="updateText(item.key, String($event))"
      />
      <FieldError :message="showErrors ? props.errors[item.key] : ''" />
    </div>
    <FieldError :message="showErrors ? props.errors.payload : ''" />
  </section>
</template>
