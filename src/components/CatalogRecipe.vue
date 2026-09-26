<script setup>
import { computed } from 'vue'

import { bossFor, itemById } from '@/common/catalog'

defineOptions({ name: 'CatalogRecipe' })
const props = defineProps({
  item: { type: Object, required: true },
  visited: { type: Array, default: () => [] },
  depth: { type: Number, default: 0 },
})
const emit = defineEmits(['select'])
const nextVisited = computed(() => [...props.visited, props.item.id])

function linkedItem(ingredient) {
  return ingredient.itemId ? itemById.get(ingredient.itemId) : null
}

function ingredientLabel(ingredient) {
  if (ingredient.text === 'Дроп с босса' && bossFor(props.item)) {
    return `Дроп с босса: ${bossFor(props.item)}`
  }
  if (/^Осколок пламенной души(?:\s|$)/i.test(ingredient.text)) {
    return `${ingredient.text} — дроп с волн 41–42 (по старому гайду)`
  }
  return ingredient.text
}
</script>

<template>
  <ul v-if="item.ingredients.length" class="recipe-list">
    <li v-for="(ingredient, index) in item.ingredients" :key="`${index}-${ingredient.text}`">
      <template v-if="linkedItem(ingredient)">
        <button type="button" class="recipe-link" @click="emit('select', linkedItem(ingredient))">
          {{ linkedItem(ingredient).name }}<span v-if="ingredient.count > 1"> ×{{ ingredient.count }}</span>
        </button>
        <CatalogRecipe
          v-if="depth < 7 && !nextVisited.includes(ingredient.itemId)"
          :item="linkedItem(ingredient)"
          :visited="nextVisited"
          :depth="depth + 1"
          @select="emit('select', $event)"
        />
      </template>
      <span v-else class="recipe-plain">{{ ingredientLabel(ingredient) }}</span>
    </li>
  </ul>
  <p v-else-if="bossFor(item)" class="muted">Дроп с босса: {{ bossFor(item) }}</p>
  <p v-else-if="depth === 0" class="muted">Для этого предмета состав крафта в CSV не указан.</p>
</template>

<style scoped>
.recipe-list { padding-left: 1.2rem; border-left: 1px solid #6b5e47; margin: .45rem 0; }
.recipe-list li { margin: .25rem 0; }
.recipe-link { color: #e7b85e; text-align: left; }
.recipe-link:hover { text-decoration: underline; }
.recipe-plain, .muted { color: #c8c0b5; white-space: pre-wrap; }
</style>
