<script setup>
import { catalogLabel, catalogRowMeta, fallbackIcon, iconFor } from '@/common/catalog'

defineOptions({ name: 'CatalogGroup' })
defineProps({
  group: { type: Object, required: true },
  selectedId: { type: String, default: '' },
  guideUsage: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['select'])
</script>

<template>
  <details class="item-group">
    <summary>{{ group.title }} <span>{{ group.count }}</span></summary>
    <CatalogGroup v-for="child in group.children" :key="child.title" :group="child" :selected-id="selectedId" :guide-usage="guideUsage" @select="emit('select', $event)" />
    <button v-for="item in group.items" :key="item.id" type="button" class="item-row" :class="{ active: item.id === selectedId }" @click="emit('select', item)">
      <img :src="iconFor(item)" :alt="item.name" loading="lazy" @error="$event.target.src = fallbackIcon" />
      <span>{{ catalogLabel(item) }}<small v-if="catalogRowMeta(item, !!guideUsage[item.id])">{{ catalogRowMeta(item, !!guideUsage[item.id]) }}</small></span>
    </button>
  </details>
</template>

<style scoped>
.item-group { border-bottom: 1px solid #725633; }
.item-group .item-group { margin-left: .8rem; border-left: 1px solid #725633; }
summary { cursor: pointer; padding: .7rem .35rem; color: #efc47d; }
summary:hover { background: #3f3527; }
summary span { color: #bfb7a9; margin-left: .35rem; }
.item-row { display: flex; width: 100%; align-items: center; text-align: left; gap: .6rem; padding: .35rem; border-bottom: 1px solid #353b42; }
.item-row:hover, .item-row.active { background: #3f3527; }
.item-row img { width: 44px; height: 44px; }
.item-row span { display: flex; flex-direction: column; min-width: 0; }
.item-row small { color: #bfb7a9; font-size: .75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
