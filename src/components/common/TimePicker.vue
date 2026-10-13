<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Clock } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { HOURS, MINUTES, splitTime, type TimeParts } from '@/utils/time'

/**
 * Custom 24h time picker: a trigger showing HH:mm and a popover with hour
 * and minute columns (5-minute steps). Emits "HH:mm" strings.
 */
withDefaults(defineProps<{ id?: string; label?: string; disabled?: boolean; invalid?: boolean }>(), {
  id: undefined,
  label: 'Time',
  disabled: false,
  invalid: false,
})
const model = defineModel<string>({ default: '09:00' })

const open = ref(false)
const parts = computed(() => splitTime(model.value))
const minuteOptions = computed<readonly string[]>(() =>
  MINUTES.includes(parts.value.minute) ? MINUTES : [...MINUTES, parts.value.minute].sort(),
)

const hourList = ref<HTMLUListElement | null>(null)
const minuteList = ref<HTMLUListElement | null>(null)

function select(part: keyof TimeParts, value: string): void {
  const next = { ...parts.value, [part]: value }
  model.value = `${next.hour}:${next.minute}`
  if (part === 'minute') open.value = false
}

/** Scroll the selected values into view when the popover opens. */
watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  for (const list of [hourList.value, minuteList.value]) {
    list?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'center' })
  }
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child :disabled="disabled">
      <button
        :id="id"
        type="button"
        :disabled="disabled"
        :aria-label="`${label}: ${model}`"
        :aria-invalid="invalid || undefined"
        :class="
          cn(
            'inline-flex h-9 w-[92px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm tabular-nums shadow-xs transition-[color,box-shadow] outline-none',
            'hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
          )
        "
        data-testid="time-picker-trigger"
      >
        {{ model }}
        <Clock class="size-4 text-muted-foreground" aria-hidden="true" />
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-1" align="start">
      <div class="flex h-56 gap-1" data-testid="time-picker-content">
        <ul ref="hourList" role="listbox" :aria-label="`${label} hour`" class="w-14 overflow-y-auto overscroll-contain">
          <li v-for="h in HOURS" :key="h">
            <button
              type="button"
              role="option"
              :aria-selected="h === parts.hour"
              :class="
                cn(
                  'w-full rounded-sm py-1.5 text-center text-sm tabular-nums hover:bg-accent focus-visible:bg-accent outline-none',
                  h === parts.hour && 'bg-primary text-primary-foreground hover:bg-primary',
                )
              "
              @click="select('hour', h)"
            >
              {{ h }}
            </button>
          </li>
        </ul>
        <div class="w-px bg-border" />
        <ul ref="minuteList" role="listbox" :aria-label="`${label} minute`" class="w-14 overflow-y-auto overscroll-contain">
          <li v-for="m in minuteOptions" :key="m">
            <button
              type="button"
              role="option"
              :aria-selected="m === parts.minute"
              :class="
                cn(
                  'w-full rounded-sm py-1.5 text-center text-sm tabular-nums hover:bg-accent focus-visible:bg-accent outline-none',
                  m === parts.minute && 'bg-primary text-primary-foreground hover:bg-primary',
                )
              "
              @click="select('minute', m)"
            >
              {{ m }}
            </button>
          </li>
        </ul>
      </div>
    </PopoverContent>
  </Popover>
</template>
