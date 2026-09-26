<script setup>
import { computed, ref } from 'vue'

import { bossFor, catalogLabel, fallbackIcon, iconFor, itemById } from '@/common/catalog'

defineOptions({ name: 'CatalogRecipe' })
const props = defineProps({
  item: { type: Object, required: true },
  visited: { type: Array, default: () => [] },
  depth: { type: Number, default: 0 },
})
const emit = defineEmits(['select'])
const expanded = ref({})
const nextVisited = computed(() => [...props.visited, props.item.id])

function linkedItem(ingredient) {
  return ingredient.itemId ? itemById.get(ingredient.itemId) : null
}

function ingredientLabel(ingredient, owner = props.item) {
  if (ingredient.text === 'Дроп с босса' && bossFor(owner)) {
    return `Дроп с босса: ${bossFor(owner)}`
  }
  if (/^Осколок пламенной души(?:\s|$)/i.test(ingredient.text)) {
    return `${ingredient.text} — дроп с волн 41–42 (по старому гайду)`
  }

  return ingredient.text
}

function sourceFor(item) {
  if (bossFor(item)) return `Дроп с босса: ${bossFor(item)}`
  if (item.ingredients.length !== 1 || item.ingredients[0].itemId) return ''

  const source = item.ingredients[0]

  return /^(?:Дроп|Портал|Магазин|Квест)/i.test(source.text) ? ingredientLabel(source, item) : ''
}

function canExpand(ingredient) {
  const linked = linkedItem(ingredient)

  return linked && linked.ingredients.length && !sourceFor(linked) &&
    props.depth < 7 && !nextVisited.value.includes(linked.id)
}
</script>

<template>
  <div v-if="item.ingredients.length" class="recipe">
    <p class="recipe-caption">{{ depth === 0 ? 'Компоненты' : `Для «${item.name}» нужно` }} · {{ item.ingredients.length }}</p>
    <div v-for="(ingredient, index) in item.ingredients" :key="`${index}-${ingredient.text}`" class="component">
      <div class="component-row">
        <template v-if="linkedItem(ingredient)">
          <img class="item-icon" :src="iconFor(linkedItem(ingredient))" :alt="linkedItem(ingredient).name" loading="lazy" @error="$event.target.src = fallbackIcon" />
          <div class="component-main">
            <button type="button" class="item-name" @click="emit('select', linkedItem(ingredient))">{{ catalogLabel(linkedItem(ingredient)) }}</button>
            <small v-if="sourceFor(linkedItem(ingredient))" class="source">{{ sourceFor(linkedItem(ingredient)) }}</small>
          </div>
          <span v-if="ingredient.count > 1" class="count">×{{ ingredient.count }}</span>
          <button v-if="canExpand(ingredient)" type="button" class="expand" :aria-expanded="!!expanded[index]" @click="expanded[index] = !expanded[index]">
            {{ expanded[index] ? 'Скрыть' : 'Состав' }} <span aria-hidden="true">{{ expanded[index] ? '▴' : '▾' }}</span>
          </button>
        </template>
        <template v-else>
          <span class="material-icon" aria-hidden="true">◆</span>
          <span class="material-name">{{ ingredientLabel(ingredient) }}</span>
        </template>
      </div>
      <CatalogRecipe
        v-if="linkedItem(ingredient) && canExpand(ingredient) && expanded[index]"
        :item="linkedItem(ingredient)"
        :visited="nextVisited"
        :depth="depth + 1"
        class="nested"
        @select="emit('select', $event)"
      />
    </div>
  </div>
  <p v-else-if="bossFor(item)" class="empty-source">Дроп с босса: {{ bossFor(item) }}</p>
  <p v-else-if="depth === 0" class="empty-source">Для этого предмета состав крафта в CSV не указан.</p>
</template>

<style scoped>
.recipe { display: grid; gap: .45rem; min-width: 0; }
.recipe-caption { color: #bfb7a9; font-size: .85rem; margin: 0 0 .1rem; }
.component { min-width: 0; }
.component-row { display: flex; align-items: center; gap: .65rem; min-width: 0; padding: .5rem .6rem; background: #22272c; border: 1px solid #554b3d; border-radius: 7px; }
.item-icon { width: 38px; height: 38px; flex: 0 0 38px; object-fit: cover; }
.component-main { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.item-name { color: #efc47d; text-align: left; width: fit-content; }
.item-name:hover { text-decoration: underline; }
.source { color: #bfb7a9; font-size: .75rem; line-height: 1.35; }
.count { color: #efc47d; background: #473927; border-radius: 4px; padding: .1rem .4rem; white-space: nowrap; font-weight: 600; }
.expand { color: #efc47d; border: 1px solid #846943; border-radius: 5px; padding: .25rem .45rem; white-space: nowrap; font-size: .8rem; }
.expand:hover { background: #51402a; }
.material-icon { display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px; color: #bfb7a9; background: #32383c; border-radius: 4px; }
.material-name { color: #d0c9bd; white-space: pre-wrap; }
.nested { margin: .45rem 0 .25rem 1rem; padding-left: .75rem; border-left: 2px solid #846943; }
.empty-source { color: #bfb7a9; }
</style>
