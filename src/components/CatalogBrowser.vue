<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { bossFor, bossLevelFor, catalog, catalogLabel, catalogLevelLabel, catalogRowMeta, fallbackIcon, iconFor, itemById, normalizeName } from '@/common/catalog'
import CatalogGroup from '@/components/CatalogGroup.vue'
import CatalogRecipe from '@/components/CatalogRecipe.vue'
import guides from '@/data/guides-1.5.5.json'

const props = defineProps({
  items: { type: Array, default: () => catalog },
  groups: { type: Array, default: () => [] },
  heading: { type: String, default: '' },
  showClassFilter: { type: Boolean, default: true },
  fixedClass: { type: String, default: '' },
  allowClassFilter: { type: Boolean, default: false },
  guideUsage: { type: Object, default: () => ({}) },
  selectedItemId: { type: String, default: '' },
})
const emit = defineEmits(['select'])
const route = useRoute()
const router = useRouter()
const query = ref('')
const hoveredUsed = ref(null)
const previewStyle = ref({})
let hidePreviewTimer
const selectedClass = ref(props.fixedClass || String(route.query.class || ''))
const selected = ref(itemById.get(String(props.selectedItemId || route.query.item || '')) || null)
const selectedId = computed(() => selected.value?.id)
const className = computed(() => !props.showClassFilter ? '' : props.fixedClass && !props.allowClassFilter ? props.fixedClass : selectedClass.value)
const belongsToClass = (item) => !className.value || item.classes.some(
  (name) => normalizeName(name) === normalizeName(className.value)
)
const filtered = computed(() => props.items.filter((item) =>
  belongsToClass(item) &&
  normalizeName(item.name + item.description).includes(normalizeName(query.value))
))
const visibleGroups = computed(() => {
  const visibleIds = new Set(filtered.value.map((item) => item.id))
  const filterGroup = (group) => {
    const items = group.items.filter((item) => visibleIds.has(item.id))
    const children = (group.children || []).map(filterGroup).filter((child) => child.count)

    return { title: group.title, items, children, count: items.length + children.reduce((sum, child) => sum + child.count, 0) }
  }

  return props.groups.map(filterGroup).filter((group) => group.count)
})
const usedIn = computed(() => selected.value
  ? catalog.filter((item) => belongsToClass(item) && item.ingredients.some((ingredient) => ingredient.itemId === selectedId.value))
  : [])

watch(() => route.query.item, (id) => {
  if (!props.fixedClass) selected.value = itemById.get(String(id || '')) || null
})
watch(() => props.selectedItemId, (id) => {
  if (props.fixedClass) selected.value = itemById.get(id) || null
})
watch(() => props.items, (items) => {
  if (selected.value && !items.some((item) => item.id === selected.value.id)) selected.value = null
})

function choose(item) {
  hoveredUsed.value = null
  selected.value = item
  emit('select', item)
  if (!props.fixedClass) router.replace({ query: { ...route.query, item: item.id } })
}

function showUsedPreview(item, event) {
  clearTimeout(hidePreviewTimer)
  const rect = event.currentTarget.getBoundingClientRect()
  const width = Math.min(340, window.innerWidth - 24)
  const below = window.innerHeight - rect.bottom
  const showAbove = below < 260 && rect.top > below

  previewStyle.value = {
    left: `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`,
    top: `${showAbove ? rect.top - 8 : rect.bottom + 8}px`,
    width: `${width}px`,
    transform: showAbove ? 'translateY(-100%)' : 'none',
  }
  hoveredUsed.value = item
}

function hideUsedPreview() {
  clearTimeout(hidePreviewTimer)
  hidePreviewTimer = setTimeout(() => { hoveredUsed.value = null }, 120)
}

function keepUsedPreview() {
  clearTimeout(hidePreviewTimer)
}

onBeforeUnmount(() => clearTimeout(hidePreviewTimer))

function changeClass() {
  selected.value = null
  if (props.fixedClass) {
    emit('select', null)

    return
  }

  router.replace({ query: { ...route.query, class: selectedClass.value || undefined, item: undefined } })
}
</script>

<template>
  <section class="browser">
    <div class="browser-list">
      <h2>{{ heading || (fixedClass ? (className ? `Вещи для класса «${className}»` : 'Все предметы 1.5.5fix9') : 'Каталог предметов 1.5.5fix9') }}</h2>
      <div class="controls">
        <input v-model="query" type="search" placeholder="Название или описание" aria-label="Поиск предметов" />
        <select v-if="showClassFilter && (!fixedClass || allowClassFilter)" v-model="selectedClass" aria-label="Фильтр класса предметов" @change="changeClass">
          <option value="">Все классы</option>
          <option v-for="hero in guides.classes" :key="hero.id" :value="hero.name">{{ hero.name }}</option>
        </select>
      </div>
      <p class="count">Найдено: {{ filtered.length }} из {{ items.length }}</p>
      <div class="items">
        <template v-if="groups.length">
          <CatalogGroup v-for="group in visibleGroups" :key="group.title" :group="group" :selected-id="selectedId" :guide-usage="guideUsage" @select="choose" />
        </template>
        <template v-else>
          <button v-for="item in filtered" :key="item.id" type="button" class="item-row" :class="{ active: item.id === selectedId }" @click="choose(item)">
            <img :src="iconFor(item)" :alt="item.name" loading="lazy" @error="$event.target.src = fallbackIcon" />
            <span>{{ catalogLabel(item) }}<small v-if="catalogRowMeta(item, !!guideUsage[item.id])">{{ catalogRowMeta(item, !!guideUsage[item.id]) }}</small></span>
          </button>
        </template>
      </div>
    </div>
    <article class="details" v-if="selected">
      <header><img :src="iconFor(selected)" :alt="selected.name" @error="$event.target.src = fallbackIcon" /><div><h2>{{ catalogLabel(selected) }}</h2><p v-if="selected.level != null">{{ catalogLevelLabel(selected) }}</p></div></header>
      <p v-if="selected.classes.length" class="muted">Класс: {{ selected.classes.join(', ') }}</p>
      <p v-else class="muted">Доступно всем классам</p>
      <p v-if="bossFor(selected)" class="guide-note">Дроп с босса: {{ bossFor(selected) }}<span v-if="bossLevelFor(selected)"> (ур. {{ bossLevelFor(selected) }})</span></p>
      <p v-if="guideUsage[selected.id]" class="guide-note">В сборках: {{ guideUsage[selected.id].join(', ') }}</p>
      <h3>Описание</h3><p class="raw">{{ selected.description || 'В CSV не указано.' }}</p>
      <h3>Рецепт и источник</h3><CatalogRecipe :key="selected.id" :item="selected" @select="choose" />
      <h3 v-if="usedIn.length">Используется в</h3>
      <div class="used">
        <button v-for="item in usedIn" :key="item.id" type="button" :aria-label="item.name" :aria-describedby="hoveredUsed?.id === item.id ? 'used-preview' : undefined" @mouseenter="showUsedPreview(item, $event)" @mouseleave="hideUsedPreview" @focus="showUsedPreview(item, $event)" @blur="hideUsedPreview" @click="choose(item)">
          <img :src="iconFor(item)" alt="" loading="lazy" @error="$event.target.src = fallbackIcon" />
        </button>
      </div>
    </article>
    <div class="details empty" v-else>Выберите предмет, чтобы увидеть описание и дерево крафта.</div>
    <Teleport to="body">
      <div v-if="hoveredUsed" id="used-preview" class="used-preview" role="tooltip" :style="previewStyle" @mouseenter="keepUsedPreview" @mouseleave="hideUsedPreview">
        <strong>{{ catalogLabel(hoveredUsed) }}</strong>
        <span v-if="hoveredUsed.level != null" class="preview-level">{{ catalogLevelLabel(hoveredUsed) }}</span>
        <p>{{ hoveredUsed.description || 'Описание не указано.' }}</p>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.browser { display: grid; grid-template-columns: minmax(320px, 44%) minmax(420px, 1fr); gap: 1rem; width: 100%; height: calc(100vh - 80px); padding: 1rem 1.5rem 2rem; color: #f6eee1; }
.browser-list, .details { border: 1px solid #725633; background: #171b20ed; border-radius: 10px; padding: 1rem; min-height: 0; }
.browser-list { display: flex; flex-direction: column; }
h2 { font-size: 1.3rem; color: #efc47d; margin-bottom: .6rem; }
h3 { color: #efc47d; font-size: 1.05rem; margin: 1rem 0 .4rem; }
.controls { display: flex; gap: .4rem; }
input, select { background: #292e33; border: 1px solid #846943; border-radius: 5px; padding: .5rem; min-width: 0; }
input { flex: 1; }
.count, .muted, small { color: #bfb7a9; }
.count { margin: .4rem 0; }
.items, .details { overflow-y: auto; }
.item-row { display: flex; width: 100%; align-items: center; text-align: left; gap: .6rem; padding: .35rem; border-bottom: 1px solid #353b42; }
.item-row:hover, .item-row.active { background: #3f3527; }
.item-row img { width: 44px; height: 44px; }
.item-row span { display: flex; flex-direction: column; min-width: 0; }
.item-row small { font-size: .75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.guide-note { color: #d2ad6c; }
.details header { display: flex; align-items: center; gap: 1rem; }
.details header img { width: 64px; height: 64px; }
.details header h2 { margin: 0; }
.raw { white-space: pre-wrap; line-height: 1.5; }
.used { display: flex; flex-wrap: wrap; gap: .5rem; }
.used button { border: 1px solid #725633; border-radius: 5px; padding: .15rem; }
.used button:hover, .used button:focus-visible { border-color: #efc47d; background: #3f3527; }
.used img { width: 44px; height: 44px; object-fit: cover; }
.used-preview { position: fixed; z-index: 1000; max-height: 70vh; overflow-y: auto; padding: .75rem; border: 1px solid #a17b43; border-radius: 8px; background: #171b20; box-shadow: 0 12px 28px #000b; color: #f6eee1; }
.used-preview strong { display: block; color: #efc47d; }
.preview-level { color: #bfb7a9; font-size: .8rem; }
.used-preview p { white-space: pre-wrap; line-height: 1.4; margin-top: .5rem; }
.empty { color: #bfb7a9; }
</style>
