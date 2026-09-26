<script setup>
import MarkdownIt from 'markdown-it'
import { computed, ref } from 'vue'

const markdown = new MarkdownIt({ html: false })
const files = import.meta.glob('../data/quests/[0-9][0-9]_*.md', { query: '?raw', import: 'default', eager: true })

const quests = Object.entries(files)
  .filter(([path]) => !path.endsWith('00_Индекс_квестов.md'))
  .map(([path, source]) => {
    const number = Number(path.match(/\/(\d\d)_/)?.[1])
    const body = source.split(/^---\s*$/m)[0]
    const title = body.match(/^# Квест \d+: (.+)$/m)?.[1].trim() || path.split('/').pop()
    const steps = [...body.matchAll(/^- (.+)$/gm)].map((match) => match[1].trim())

    return { number, title, steps }
  })
  .sort((a, b) => a.number - b.number)

const index = files['../data/quests/00_Индекс_квестов.md']
const tips = [...(index.match(/## Где обычно теряется время\s*([\s\S]*?)\n---/)?.[1] || '').matchAll(/^- (.+)$/gm)]
  .map((match) => match[1].trim())
const search = ref('')
const selectedNumber = ref(1)
const selectedQuest = computed(() => quests.find((quest) => quest.number === selectedNumber.value))
const visibleQuests = computed(() => quests.filter((quest) =>
  `${quest.title} ${quest.steps.join(' ')}`.toLocaleLowerCase('ru').includes(search.value.toLocaleLowerCase('ru').trim())
))

function renderStep(text) {
  return markdown.renderInline(text)
}
</script>

<template>
  <main class="quests-page">
    <header class="page-head">
      <h1>Квесты</h1>
      <p>Последовательность из {{ quests.length }} заданий по реконструкции прохождения Goblin Survival.</p>
    </header>

    <div class="quest-layout">
      <section class="panel quest-list" aria-label="Список квестов">
        <label class="search-label" for="quest-search">Поиск по квестам</label>
        <input id="quest-search" v-model="search" type="search" placeholder="Название или шаг прохождения" />
        <p class="count">Найдено: {{ visibleQuests.length }} из {{ quests.length }}</p>
        <div class="quest-links">
          <button
            v-for="quest in visibleQuests"
            :key="quest.number"
            type="button"
            :class="{ active: selectedNumber === quest.number }"
            @click="selectedNumber = quest.number"
          >
            <span class="quest-number">{{ String(quest.number).padStart(2, '0') }}</span>
            <span>{{ quest.title }}</span>
          </button>
          <p v-if="!visibleQuests.length" class="empty">По этому запросу квесты не найдены.</p>
        </div>
      </section>

      <section v-if="selectedQuest" class="panel quest-detail">
        <p class="eyebrow">Квест {{ selectedQuest.number }} из {{ quests.length }}</p>
        <h2>{{ selectedQuest.title }}</h2>
        <ol class="steps">
          <li v-for="(step, index) in selectedQuest.steps" :key="index" v-html="renderStep(step)" />
        </ol>
        <div class="quest-nav">
          <button type="button" :disabled="selectedNumber === 1" @click="selectedNumber--">← Предыдущий</button>
          <button type="button" :disabled="selectedNumber === quests.length" @click="selectedNumber++">Следующий →</button>
        </div>
      </section>
    </div>

    <section class="panel tips">
      <h2>Где обычно теряется время</h2>
      <ul><li v-for="(tip, index) in tips" :key="index" v-html="renderStep(tip)" /></ul>
      <p class="source-note">Это структурированная реконструкция по сохранившейся индексации, не дословная копия. <a href="https://goblinworkshops.org/forum/viewtopic.php?f=8&t=76" target="_blank" rel="noopener noreferrer">Источник</a>.</p>
    </section>
  </main>
</template>

<style scoped>
.quests-page { color: #f6eee1; width: 100%; height: calc(100vh - 60px); overflow-y: auto; padding: 1rem 1.5rem 3rem; }
.page-head h1 { color: #efc47d; font-size: 1.8rem; }
.page-head p, .count, .source-note { color: #bfb7a9; }
.quest-layout { display: grid; grid-template-columns: minmax(260px, 340px) minmax(0, 1fr); gap: 1rem; margin-top: 1rem; align-items: start; }
.panel { background: #171b20ed; border: 1px solid #725633; border-radius: 10px; padding: 1rem; }
.quest-list { display: flex; flex-direction: column; max-height: min(720px, calc(100vh - 170px)); }
.search-label, .eyebrow { color: #efc47d; }
.quest-list input { width: 100%; margin: .45rem 0; padding: .55rem; color: #fff; background: #292e33; border: 1px solid #846943; border-radius: 5px; }
.count { margin: .1rem 0 .55rem; font-size: .9rem; }
.quest-links { overflow-y: auto; }
.quest-links button { display: flex; width: 100%; gap: .65rem; align-items: center; text-align: left; padding: .55rem .45rem; border-bottom: 1px solid #3c3c3c; }
.quest-links button:hover, .quest-links button.active { background: #463a2b; }
.quest-number { color: #efc47d; font-variant-numeric: tabular-nums; }
.empty { color: #bfb7a9; padding: .7rem .4rem; }
.quest-detail { min-height: 380px; }
.eyebrow { font-size: .9rem; }
.quest-detail h2, .tips h2 { color: #efc47d; font-size: 1.3rem; margin: .3rem 0 1rem; }
.steps { list-style: decimal; padding-left: 1.5rem; line-height: 1.55; }
.steps li { margin-bottom: .75rem; padding-left: .25rem; }
.steps li::marker { color: #efc47d; }
.quest-nav { display: flex; justify-content: space-between; gap: .5rem; margin-top: 2rem; }
.quest-nav button { border: 1px solid #846943; border-radius: 5px; color: #efc47d; padding: .35rem .65rem; }
.quest-nav button:hover:not(:disabled) { background: #66502f; }
.quest-nav button:disabled { opacity: .4; cursor: default; }
.tips { margin-top: 1rem; }
.tips ul { list-style: disc; padding-left: 1.4rem; line-height: 1.5; }
.tips li { margin: .3rem 0; }
.source-note { margin-top: 1rem; font-size: .9rem; }
.source-note a { color: #efc47d; text-decoration: underline; }
@media (max-width: 750px) { .quest-layout { grid-template-columns: 1fr; } .quest-list { max-height: 280px; } }
</style>
