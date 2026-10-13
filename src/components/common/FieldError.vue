<script setup lang="ts">
defineProps<{ id?: string; message?: string }>()
</script>

<template>
  <p v-if="message" :id="id" role="alert" class="text-xs font-medium text-destructive" data-testid="field-error">
    {{ message }}
  </p>
</template>
