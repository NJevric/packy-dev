<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Dark rounded background -->
    <rect width="32" height="32" rx="8" fill="#18181b" />

    <!-- Box body -->
    <rect x="6" y="14" width="20" height="13" rx="1.5" fill="white" opacity="0.95" />

    <!-- Lid -->
    <rect x="5" y="11" width="22" height="5" rx="1.5" fill="white" />

    <!-- Center vertical ribbon -->
    <rect x="14.5" y="11" width="3" height="16" rx="1" fill="#18181b" opacity="0.15" />

    <!-- Bow left loop -->
    <path
      d="M14.5 11 C14 8 11 5.5 9.5 7 C8 8.5 10.5 11 14.5 11"
      fill="white"
      opacity="0.9"
    />

    <!-- Bow right loop -->
    <path
      d="M17.5 11 C18 8 21 5.5 22.5 7 C24 8.5 21.5 11 17.5 11"
      fill="white"
      opacity="0.9"
    />

    <!-- Bow center knot -->
    <ellipse cx="16" cy="11" rx="2" ry="1.5" fill="white" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 28 })
</script>
