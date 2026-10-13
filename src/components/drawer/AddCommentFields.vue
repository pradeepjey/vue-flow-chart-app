<script setup lang="ts">
import { Eraser } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import FieldError from '@/components/common/FieldError.vue'
import { LIMITS } from '@/constants/flow'

withDefaults(defineProps<{ error?: string }>(), { error: '' })
const comment = defineModel<string>({ default: '' })
</script>

<template>
  <section class="space-y-1.5">
    <div class="flex items-center justify-between">
      <Label for="node-comment">Comment</Label>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="text-muted-foreground"
        :disabled="!comment"
        data-testid="clear-comment"
        @click="comment = ''"
      >
        <Eraser /> Remove
      </Button>
    </div>
    <Textarea
      id="node-comment"
      v-model="comment"
      rows="4"
      :maxlength="LIMITS.COMMENT_MAX"
      placeholder="Add an internal comment…"
      :aria-invalid="!!error || undefined"
    />
    <div class="flex justify-between text-xs text-muted-foreground">
      <FieldError :message="error" />
      <span class="ml-auto tabular-nums">{{ comment.length }}/{{ LIMITS.COMMENT_MAX }}</span>
    </div>
  </section>
</template>
