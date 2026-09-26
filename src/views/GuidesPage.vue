<script setup>
import { computed, nextTick, ref, watch } from 'vue'

import { catalog, catalogLabel, fitsClass, itemById, normalizeName } from '@/common/catalog'
import { emptyPlanner, plannerStages } from '@/common/planner'
import CatalogBrowser from '@/components/CatalogBrowser.vue'
import guides from '@/data/guides-1.5.5.json'
import { questArtifacts } from '@/data/quest-artifacts-1.5.5'

const selectedClassId = ref(guides.classes[0].id)
const selectedVariantId = ref('')
const role = ref('Все роли')
const activeLevel = ref(10)
const plannerSearch = ref('')
const selectedCraftId = ref(null)
const classTree = ref(null)
const selectedClass = computed(() => guides.classes.find((hero) => hero.id === selectedClassId.value))
const classVariants = computed(() => guides.variants.filter((variant) => variant.classId === selectedClassId.value))
const visibleVariants = computed(() => classVariants.value.filter((variant) => role.value === 'Все роли' || variant.tags.includes(role.value)))
const selectedVariant = computed(() => classVariants.value.find((variant) => variant.id === selectedVariantId.value))

function storageKey() {
  return `gs-planner-1.5.5:${selectedClassId.value}:${selectedVariantId.value}`
}

function readPlanner() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()))

    return saved && typeof saved.overrides === 'object' && saved.overrides !== null
      ? { loaded: !!saved.loaded, overrides: saved.overrides }
      : emptyPlanner()
  } catch {
    return emptyPlanner()
  }
}

const planner = ref(emptyPlanner())
watch(selectedClassId, () => { selectedVariantId.value = classVariants.value[0]?.id || '' })
watch(visibleVariants, (variants) => {
  if (variants.length && !variants.some((variant) => variant.id === selectedVariantId.value)) {
    selectedVariantId.value = variants[0].id
  }
}, { immediate: true })
watch(selectedVariantId, () => { planner.value = readPlanner() }, { immediate: true })
watch(planner, (value) => {
  if (selectedVariantId.value) localStorage.setItem(storageKey(), JSON.stringify(value))
}, { deep: true })

const stages = computed(() => plannerStages(selectedVariant.value, guides.levels, planner.value))
const slots = computed(() => stages.value[activeLevel.value] || [])
const recommendation = computed(() => selectedVariant.value?.stages.find((stage) => stage.level === activeLevel.value))
const eligibleItems = computed(() => catalog.filter((item) => fitsClass(item, selectedClass.value?.name)))
const classQuestArtifacts = computed(() => (questArtifacts[selectedClassId.value] || []).map((id) => itemById.get(id)).filter(Boolean))
watch([selectedClassId, selectedVariantId, activeLevel], () => { selectedCraftId.value = null })
const guideUsage = computed(() => {
  const usage = {}
  for (const variant of classVariants.value) {
    for (const stage of variant.stages) {
      for (const pick of stage.items) {
        if (pick.itemId && !(usage[pick.itemId] || []).includes(variant.title)) {
          (usage[pick.itemId] ||= []).push(variant.title)
        }
      }
    }
  }

  return usage
})

function choices(currentId) {
  const search = normalizeName(plannerSearch.value)

  return eligibleItems.value.filter((item) => item.id === currentId || normalizeName(item.name).includes(search))
}

function editSlot(index, id) {
  const level = String(activeLevel.value)
  planner.value.overrides[level] ||= {}
  planner.value.overrides[level][index] = id || null
}

function loadGuide() {
  planner.value = { loaded: true, overrides: {} }
}

function clearPlanner() {
  planner.value = emptyPlanner()
}

async function showCraft(itemId) {
  selectedCraftId.value = selectedCraftId.value === itemId ? null : itemId
  if (selectedCraftId.value) {
    await nextTick()
    classTree.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <main class="guides">
    <header class="page-head"><h1>Гайды и планер сборки</h1><p>Goblin Survival 1.5.5fix9 · {{ guides.classes.length }} классов · {{ guides.variants.length }} вариантов</p></header>
    <div class="guide-controls">
      <label>Класс<select v-model="selectedClassId"><option v-for="hero in guides.classes" :key="hero.id" :value="hero.id">{{ hero.name }}</option></select></label>
      <label>Роль<select v-model="role"><option v-for="filter in ['Все роли', 'ДД', 'Танк', 'Поддержка', 'Смешанная']" :key="filter">{{ filter }}</option></select></label>
      <label>Сборка<select v-model="selectedVariantId"><option v-for="variant in visibleVariants" :key="variant.id" :value="variant.id">{{ variant.title }}</option></select></label>
    </div>
    <p v-if="!visibleVariants.length" class="panel">Для этой роли у выбранного класса пока нет гайда.</p>
    <template v-else-if="selectedVariant">
      <div class="panel intro"><h2>{{ selectedClass.name }}</h2><p>{{ selectedClass.summary }}</p><p class="tags"><span v-for="tag in selectedVariant.tags" :key="tag">{{ tag }}</span></p></div>
      <div class="guide-grid">
        <section class="panel">
          <h2>Рекомендация из гайда</h2>
          <p class="muted">Этап {{ activeLevel }} уровня<span v-if="recommendation && recommendation.sourceLevel !== activeLevel"> · источник: уровень {{ recommendation.sourceLevel }}</span></p>
          <ol v-if="recommendation" class="recommendations">
            <li v-for="(pick, index) in recommendation.items" :key="index">
              <template v-if="pick.itemId">
                <span>{{ pick.name }}</span>
                <button type="button" class="craft-toggle" :aria-expanded="selectedCraftId === pick.itemId" @click="showCraft(pick.itemId)">
                  {{ selectedCraftId === pick.itemId ? 'Скрыть крафт' : 'Крафт' }}
                </button>
              </template>
              <span v-else>{{ pick.name }} <small>(нет точного совпадения в CSV)</small></span>
            </li>
          </ol>
          <p v-if="recommendation?.note" class="note">{{ recommendation.note }}</p>
        </section>
        <section class="panel">
          <div class="planner-title"><h2>Мой планер · 6 ячеек</h2><div><button type="button" @click="loadGuide">Загрузить гайд</button><button type="button" @click="clearPlanner">Очистить</button></div></div>
          <div class="levels"><button v-for="level in guides.levels" :key="level" type="button" :class="{ active: activeLevel === level }" @click="activeLevel = level">{{ level }}</button></div>
          <input v-model="plannerSearch" class="planner-search" type="search" placeholder="Поиск предмета для ячейки" aria-label="Поиск для планера" />
          <div class="slots">
            <label v-for="(itemId, index) in slots" :key="index"><span>{{ index + 1 }}.</span><select :value="itemId || ''" @change="editSlot(index, $event.target.value)"><option value="">Пустая ячейка</option><option v-for="item in choices(itemId)" :key="item.id" :value="item.id">{{ catalogLabel(item) }}{{ item.level == null ? '' : ` (${item.level} ур.)` }}</option></select></label>
          </div>
          <p class="muted">Изменения сохраняются в этом браузере отдельно для каждой сборки. Поздние замены остаются на своих этапах.</p>
        </section>
      </div>
      <section class="panel quest-artifacts">
        <h2>Квестовые артефакты класса «{{ selectedClass.name }}»</h2>
        <p class="muted">Требование уровня, характеристики и рецепт взяты из CSV 1.5.5. Нажмите «Рецепт», чтобы открыть полное дерево крафта в нижнем правом окне.</p>
        <div class="quest-list">
          <article v-for="item in classQuestArtifacts" :key="item.id" class="quest-item">
            <div class="quest-heading"><strong>{{ catalogLabel(item) }}</strong><span>Уровень {{ item.level }}</span><button type="button" class="craft-toggle" @click="showCraft(item.id)">{{ selectedCraftId === item.id ? 'Скрыть рецепт' : 'Рецепт' }}</button></div>
            <details><summary>Характеристики и эффект</summary><p>{{ item.description }}</p></details>
          </article>
        </div>
      </section>
      <section ref="classTree" class="class-tree"><h2>Общая ветка вещей класса</h2><p>По умолчанию показаны предметы выбранного класса. Фильтр позволяет открыть вещи другого класса или весь каталог.</p><CatalogBrowser :key="selectedClassId" :fixed-class="selectedClass.name" allow-class-filter :guide-usage="guideUsage" :selected-item-id="selectedCraftId || ''" @select="selectedCraftId = $event?.id || null" /></section>
    </template>
  </main>
</template>

<style scoped>
.guides { color: #f6eee1; width: 100%; height: calc(100vh - 60px); overflow-y: auto; padding: 1rem 1.5rem 3rem; }
.page-head h1 { color: #efc47d; font-size: 1.8rem; }
.page-head p, .muted, .class-tree p { color: #bfb7a9; }
.guide-controls { display: flex; gap: .8rem; margin: 1rem 0; }
.guide-controls label { display: flex; flex-direction: column; gap: .25rem; flex: 1; }
select { background: #292e33; border: 1px solid #846943; border-radius: 5px; padding: .5rem; min-width: 0; color: white; }
.panel, .class-tree { background: #171b20ed; border: 1px solid #725633; border-radius: 10px; padding: 1rem; }
.panel h2, .class-tree h2 { color: #efc47d; font-size: 1.2rem; }
.intro { margin-bottom: 1rem; }
.intro p { margin-top: .4rem; line-height: 1.45; }
.tags { display: flex; gap: .4rem; }
.tags span { border: 1px solid #846943; border-radius: 999px; padding: .1rem .6rem; color: #efc47d; }
.guide-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.recommendations { list-style: decimal; padding-left: 1.5rem; margin: .8rem 0; }
.recommendations li { margin: .35rem 0; }
.recommendations li > span { color: #efc47d; }
.recommendations small { color: #bfb7a9; }
.craft-toggle { margin-left: .6rem; font-size: .8rem; padding: .1rem .4rem; }
.note { color: #d0c9bd; border-top: 1px solid #63523c; padding-top: .6rem; }
.planner-title { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }
.planner-title div, .levels { display: flex; gap: .3rem; }
button { border: 1px solid #846943; border-radius: 5px; padding: .3rem .55rem; color: #efc47d; }
button:hover, button.active { background: #66502f; }
.levels { margin: .8rem 0; }
.levels button { flex: 1; }
.slots { display: grid; gap: .4rem; }
.planner-search { width: 100%; background: #292e33; border: 1px solid #846943; border-radius: 5px; padding: .5rem; margin-bottom: .5rem; }
.slots label { display: flex; align-items: center; gap: .5rem; }
.slots select { flex: 1; }
.class-tree { margin-top: 1rem; scroll-margin-top: 70px; }
.quest-artifacts { margin-top: 1rem; }
.quest-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .55rem; margin-top: .8rem; }
.quest-item { border: 1px solid #514739; border-radius: 6px; padding: .6rem; min-width: 0; }
.quest-heading { display: flex; align-items: center; gap: .5rem; }
.quest-heading strong { color: #efc47d; }
.quest-heading span { color: #bfb7a9; margin-left: auto; white-space: nowrap; }
.quest-item details { margin-top: .35rem; }
.quest-item summary { cursor: pointer; color: #d0c9bd; }
.quest-item details p { white-space: pre-wrap; margin: .55rem 0 0; line-height: 1.4; }
.class-tree :deep(.browser) { height: 650px; padding: .8rem 0 0; }
@media (max-width: 1100px) { .guide-grid, .quest-list { grid-template-columns: 1fr; } }
</style>
