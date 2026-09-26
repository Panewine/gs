<script setup>
import { computed, reactive, ref } from 'vue'

import { bossFor, catalog, fitsClass, itemById } from '@/common/catalog'
import CatalogBrowser from '@/components/CatalogBrowser.vue'
import CategoryToggle from '@/components/CategoryToggle.vue'
import guides from '@/data/guides-1.5.5.json'
import { questArtifacts } from '@/data/quest-artifacts-1.5.5'

const fromLevel = ref(1)
const toLevel = ref(150)
const selectedClass = ref('')
const categories = reactive({})
const categoryPicker = ref(null)
const selectedCategoryCount = computed(() => Object.values(categories).filter(Boolean).length)
const questIds = new Set(Object.values(questArtifacts).flat())
const jewelName = /кольц|колечк|перст|ожерель|амулет|подвеск|медальон/i
const setName = /(?:^| )сет /i
const shopSource = /^(?:Покупается|Портал в |В Магазе)/i
const greatForge = /Создается в Великой кузнице/i
const angelForge = /Создается в Ангельской кузнице/i
const demonForge = /Создается в Демонической кузнице/i
const dragonForge = /Создается в Драконьей кузнице/i
const oreNames = [
  ['Арканит', /^Арканитовый слиток/i],
  ['Торий', /^Ториевый слиток/i],
  ['Серебро', /^Серебряный слиток/i],
  ['Железо', /^Железный слиток/i],
]
const stoneName = /^(?:Алмаз|Аметист|Изумруд|Рубин|Сапфир|Топаз)(?:\s|$)|камень|камни/i
const energyName = /энергетик/i
// The old catalog places this item in the Great Forge; the CSV omits its forge.
const greatForgeWithoutRecipeNote = new Set(['item-386'])
// The CSV and old catalog do not specify a forge for these late recipes.
const unknownForge = new Set(['item-458', 'item-459', 'item-462'])

function hasBossOrigin(item, visited = new Set()) {
  if (!item || visited.has(item.id)) return false
  if (bossFor(item)) return true

  visited.add(item.id)

  const result = item.ingredients.some((ingredient) => hasBossOrigin(itemById.get(ingredient.itemId), visited))
  visited.delete(item.id)

  return result
}

function isBossCraft(item) {
  if (greatForge.test(item.recipe) || angelForge.test(item.recipe) || demonForge.test(item.recipe) ||
    dragonForge.test(item.recipe) || greatForgeWithoutRecipeNote.has(item.id) || unknownForge.has(item.id)) return false

  return item.ingredients.some((ingredient) => hasBossOrigin(itemById.get(ingredient.itemId), new Set([item.id])))
}

const sourceGroups = (() => {
  const forge = {
    id: 'forge', title: 'Кузница', items: [], children: [
      { id: 'ores', title: 'Руды', items: [], children: oreNames.map(([title]) => ({ id: title.toLowerCase(), title, items: [] })) },
      { id: 'stones', title: 'Камни', items: [] },
      { id: 'dragonForge', title: 'Драконья кузница', items: [] },
      { id: 'otherCraft', title: 'Другой крафт', items: [] },
    ],
  }
  const greatForgeGroup = { id: 'greatForge', title: 'Великая кузница (ВК)', items: [] }
  const angelForgeGroup = { id: 'angelForge', title: 'Ангельская кузница (АК)', items: [] }
  const demonForgeGroup = { id: 'demonForge', title: 'Демоническая кузница (ДК)', items: [] }
  const enemyDrops = { id: 'enemyDrops', title: 'Дроп с врагов', items: [] }
  const shop = { id: 'shop', title: 'Магазин', items: [] }
  const jewels = { id: 'jewels', title: 'Драгоценности', items: [] }
  const bossDrops = { id: 'bosses', title: 'Дроп с боссов', items: [] }
  const bossCraft = { id: 'bossCraft', title: 'Крафт с боссов', items: [] }
  const sets = { id: 'sets', title: 'Сеты', items: [] }
  const quests = { id: 'quests', title: 'Квесты', items: [] }
  const food = { id: 'food', title: 'Еда', items: [] }
  const pops = { id: 'pops', title: 'Попс', items: [] }
  const groups = [
    shop,
    jewels,
    bossDrops,
    bossCraft,
    sets,
    quests,
    forge,
    greatForgeGroup,
    angelForgeGroup,
    demonForgeGroup,
    enemyDrops,
    food,
    pops,
  ]

  for (const item of catalog) {
    if (item.id.startsWith('pops-')) pops.items.push(item)
    else if (item.kind === 'food' || energyName.test(item.name)) food.items.push(item)
    else if (questIds.has(item.id)) quests.items.push(item)
    else if (setName.test(item.name)) sets.items.push(item)
    else if (bossFor(item)) bossDrops.items.push(item)
    else if (isBossCraft(item)) bossCraft.items.push(item)
    else if (jewelName.test(item.name)) jewels.items.push(item)
    else if (shopSource.test(item.recipe)) shop.items.push(item)
    else if (/^Дроп с /i.test(item.recipe)) enemyDrops.items.push(item)
    else if (greatForge.test(item.recipe) || greatForgeWithoutRecipeNote.has(item.id)) greatForgeGroup.items.push(item)
    else if (angelForge.test(item.recipe)) angelForgeGroup.items.push(item)
    else if (demonForge.test(item.recipe)) demonForgeGroup.items.push(item)
    else if (dragonForge.test(item.recipe)) forge.children[2].items.push(item)
    else {
      const oreIndex = oreNames.findIndex(([, pattern]) => item.ingredients.some((ingredient) => pattern.test(ingredient.text)))

      if (oreIndex >= 0) forge.children[0].children[oreIndex].items.push(item)
      else if (item.ingredients.some((ingredient) => stoneName.test(ingredient.text))) forge.children[1].items.push(item)
      else forge.children[3].items.push(item)
    }
  }

  return groups
})()

function setCategory(id, checked) {
  categories[id] = checked
}

function closeCategories() {
  categoryPicker.value.open = false
}

const artGroups = computed(() => {
  const from = Number(fromLevel.value)
  const to = Number(toLevel.value)
  const validRange = Number.isInteger(from) && Number.isInteger(to) && from >= 1 && to <= 150 && from <= to
  const rangeActive = from !== 1 || to < 150
  const withinLimits = (item) => fitsClass(item, selectedClass.value) &&
    (!rangeActive || (validRange && (item.level == null ? item.kind === 'food' || item.id.startsWith('pops-') || item.id.startsWith('bombs-') : item.level >= from && item.level <= to)))
  const filterGroup = (group, parentSelected = false) => {
    const selected = parentSelected || !!categories[group.id]
    const items = selected ? group.items.filter(withinLimits) : []
    const children = (group.children || []).map((child) => filterGroup(child, selected)).filter((child) => child.items.length || child.children.length)

    return { id: group.id, title: group.title, items, children }
  }

  return sourceGroups.map((group) => filterGroup(group)).filter((group) => group.items.length || group.children.length)
})

const arts = computed(() => {
  const collect = (group) => [...group.items, ...group.children.flatMap(collect)]

  return artGroups.value.flatMap(collect).sort((a, b) => (a.level ?? Infinity) - (b.level ?? Infinity) || a.name.localeCompare(b.name, 'ru'))
})
</script>

<template>
  <main class="arts-page">
    <header>
      <h1>Арты</h1>
      <p>Выберите категории предметов. Класс и диапазон уровней ограничивают выбранное. Еда, зелья Попса и детали боссов без указанного уровня доступны при любом диапазоне.</p>
    </header>
    <div class="arts-filters">
      <label class="class-choice">Класс
        <select v-model="selectedClass" aria-label="Добавить предметы класса">
          <option value="">Не выбран</option>
          <option v-for="hero in guides.classes" :key="hero.id" :value="hero.name">{{ hero.name }}</option>
        </select>
      </label>
      <fieldset class="level-range">
        <legend>Диапазон уровней</legend>
        <label>От <input v-model.number="fromLevel" type="number" min="1" max="150" aria-label="Уровень от" /></label>
        <label>До <input v-model.number="toLevel" type="number" min="1" max="150" aria-label="Уровень до" /></label>
      </fieldset>
      <div class="category-picker">
        <details ref="categoryPicker">
          <summary class="category-trigger">Категории <span class="selected-count">{{ selectedCategoryCount }}</span></summary>
          <div class="category-menu">
            <p>Отметьте нужные группы. Галочка «Кузница» включает все её разделы.</p>
            <div class="category-grid">
              <CategoryToggle v-for="group in sourceGroups" :key="group.id" :group="group" :selected="categories" @toggle="setCategory" />
            </div>
            <button type="button" class="done-button" @click="closeCategories">Готово</button>
          </div>
        </details>
      </div>
      <p v-if="fromLevel > toLevel" class="range-error">Начальный уровень больше конечного.</p>
    </div>
    <CatalogBrowser :items="arts" :groups="artGroups" heading="Выбранные предметы" :show-class-filter="false" />
  </main>
</template>

<style scoped>
.arts-page { width: 100%; height: calc(100vh - 60px); min-height: 0; padding: 1rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: .75rem; color: #f6eee1; }
h1 { font-size: 1.8rem; color: #efc47d; }
header p { color: #bfb7a9; }
.arts-filters { position: relative; z-index: 2; display: flex; align-items: end; gap: 1.5rem; flex-wrap: wrap; padding: .65rem 1rem; border: 1px solid #725633; border-radius: 10px; background: #171b20ed; }
fieldset { display: flex; align-items: center; gap: .8rem; }
legend { color: #efc47d; padding-right: .5rem; }
label { display: flex; align-items: center; gap: .35rem; white-space: nowrap; }
.class-choice select { min-width: 9rem; padding: .3rem .4rem; color: white; background: #292e33; border: 1px solid #846943; border-radius: 5px; }
.level-range input { width: 5rem; padding: .3rem .4rem; color: white; background: #292e33; border: 1px solid #846943; border-radius: 5px; }
.category-picker { align-self: end; }
.category-trigger { display: flex; align-items: center; gap: .65rem; min-height: 2.2rem; padding: .35rem .7rem; border: 1px solid #846943; border-radius: 6px; background: #292e33; color: #efc47d; cursor: pointer; list-style: none; }
.category-trigger::-webkit-details-marker { display: none; }
.category-trigger::after { content: '▾'; margin-left: .15rem; }
.category-picker details[open] .category-trigger { background: #3f3527; }
.selected-count { display: inline-grid; place-items: center; min-width: 1.4rem; height: 1.4rem; padding: 0 .2rem; border-radius: 1rem; color: #171b20; background: #efc47d; font-size: .8rem; }
.category-menu { position: absolute; top: calc(100% + .5rem); left: 0; z-index: 10; width: min(740px, 100%); max-height: min(65vh, 540px); overflow-y: auto; padding: .9rem; border: 1px solid #846943; border-radius: 10px; background: #171b20; box-shadow: 0 16px 32px #0009; }
.category-menu p { color: #bfb7a9; margin-bottom: .7rem; }
.category-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; }
.done-button { display: block; margin: .8rem 0 0 auto; padding: .35rem .8rem; border: 1px solid #846943; border-radius: 5px; color: #efc47d; }
.done-button:hover { background: #3f3527; }
.range-error { color: #f1a081; }
.arts-page :deep(.browser) { flex: 1; min-height: 0; height: auto; padding: 0; }
@media (max-width: 760px) { .category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
