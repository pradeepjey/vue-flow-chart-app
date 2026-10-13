<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Clock } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import TimePicker from '@/components/common/TimePicker.vue'
import FieldError from '@/components/common/FieldError.vue'
import { DAYS } from '@/constants/flow'
import type { DayKey, ValidationErrors } from '@/types/flow'
import type { DraftDay } from '@/utils/draft'
import { formatTimeZoneLabel, getTimeZones } from '@/utils/time'

const props = withDefaults(defineProps<{ errors?: ValidationErrors; showErrors?: boolean }>(), {
  errors: () => ({}),
  showErrors: false,
})
const days = defineModel<DraftDay[]>('days', { required: true })
const timezone = defineModel<string>('timezone', { default: 'UTC' })

const dayLabel = Object.fromEntries(DAYS.map((d) => [d.key, d])) as Record<DayKey, (typeof DAYS)[number]>
// Computed once per mount; ~400 entries, formatting is cheap.
const zoneOptions = getTimeZones().map((z) => ({ value: z, label: formatTimeZoneLabel(z) }))
const zones = computed(() =>
  zoneOptions.some((z) => z.value === timezone.value)
    ? zoneOptions
    : [{ value: timezone.value, label: timezone.value }, ...zoneOptions],
)

function patchDay(day: DayKey, patch: Partial<DraftDay>): void {
  days.value = days.value.map((d) => (d.day === day ? { ...d, ...patch } : d))
}
</script>

<template>
  <section class="space-y-3" aria-labelledby="hours-heading">
    <h3 id="hours-heading" class="sr-only">Business hours</h3>
    <p class="text-xs text-muted-foreground">
      Branches the flow by date &amp; time. Contacts arriving inside these hours follow
      <span class="font-medium text-emerald-700">Success</span>, otherwise
      <span class="font-medium text-red-700">Failure</span>.
    </p>
    <div class="grid grid-cols-[88px_1fr] items-center gap-x-3 text-xs font-medium text-muted-foreground">
      <span class="flex items-center gap-1.5"><CalendarDays class="size-3.5" /> Day</span>
      <span class="flex items-center gap-1.5"><Clock class="size-3.5" /> Time</span>
    </div>
    <ul class="space-y-2">
      <li v-for="d in days" :key="d.day" data-testid="hours-row" :data-day="d.day">
        <div class="grid grid-cols-[88px_1fr] items-center gap-x-3">
          <label class="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              class="size-4 accent-[var(--primary)]"
              :checked="d.enabled"
              :aria-label="`Open on ${dayLabel[d.day].long}`"
              @change="patchDay(d.day, { enabled: ($event.target as HTMLInputElement).checked })"
            />
            {{ dayLabel[d.day].label }}
          </label>
          <div v-if="d.enabled" class="flex items-center gap-2">
            <TimePicker
              :model-value="d.startTime"
              :label="`${dayLabel[d.day].long} opening time`"
              :invalid="showErrors && !!props.errors[d.day]"
              @update:model-value="patchDay(d.day, { startTime: $event })"
            />
            <span class="text-xs text-muted-foreground">to</span>
            <TimePicker
              :model-value="d.endTime"
              :label="`${dayLabel[d.day].long} closing time`"
              :invalid="showErrors && !!props.errors[d.day]"
              @update:model-value="patchDay(d.day, { endTime: $event })"
            />
          </div>
          <span v-else class="text-sm text-muted-foreground">Closed</span>
        </div>
        <FieldError class="mt-1 pl-[100px]" :message="showErrors ? props.errors[d.day] : ''" />
      </li>
    </ul>
    <div class="space-y-1.5 pt-2">
      <Label for="node-timezone">Time zone</Label>
      <NativeSelect id="node-timezone" v-model="timezone" :aria-invalid="(showErrors && !!props.errors.timezone) || undefined">
        <option v-for="z in zones" :key="z.value" :value="z.value">{{ z.label }}</option>
      </NativeSelect>
      <FieldError :message="showErrors ? props.errors.timezone : ''" />
    </div>
  </section>
</template>
