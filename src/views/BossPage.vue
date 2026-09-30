<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'

import BaseAccordeon from '@/components/BaseAccordeon.vue'
import BaseLink from '@/components/BaseLink.vue'
import BaseMarkdownWrapper from '@/components/BaseMarkdownWrapper.vue'
import { store } from '@/components/composables/store.js'
import { bossFor, catalog, iconFor } from '@/common/catalog.js'
import { fallbackBosses } from '@/data/bosses-fallback.js'
import {
  SpiderIcon,
  SlaveOwnerIcon,
  GuardianIcon,
  ExcavatorIcon,
  LustIcon,
  ArtilleryIcon,
  GreedIcon,
  HazulIcon,
  FearIcon,
  HandlerIcon,
  EnvyIcon,
  ShizzlIcon,
  DeathIcon,
  EvilIcon,
  DejavuIcon,
  DejavuGirlIcon,
  JaegerIcon,
  WizardIcon,
  TankIcon,
} from '@/components/icons/bosses'

const route = useRoute()
const isContentVisible = ref(true)
const showSidebar = ref(false)
const animationsLoaded = ref(false)

const bosses = computed(() => {
  const remote = store.entities.bosses || []
  const knownNames = new Set(fallbackBosses.map((boss) => boss.name))

  return [
    ...fallbackBosses.map((boss) => remote.find((entry) => entry.name === boss.name) || boss),
    ...remote.filter((boss) => !knownNames.has(boss.name)),
  ]
})

const currentBoss = computed(
  () => bosses.value.find((boss) => boss.name === route.query.name) || bosses.value[0]
)
const currentIcon = computed(() => bossIcons[currentBoss.value?.id] || SpiderIcon)

const bossIcons = {
  1: SpiderIcon,
  2: SlaveOwnerIcon,
  3: GuardianIcon,
  4: ExcavatorIcon,
  5: LustIcon,
  6: ArtilleryIcon,
  7: GreedIcon,
  8: HazulIcon,
  9: FearIcon,
  10: HandlerIcon,
  11: EnvyIcon,
  12: ShizzlIcon,
  13: DeathIcon,
  14: EvilIcon,
  15: DejavuGirlIcon,
  16: DejavuIcon,
  17: WizardIcon,
  18: JaegerIcon,
  19: TankIcon,
}
const noseSlotBosses = new Set(['Потный рабовладелец', 'Экскаватор КУС', 'Бомбс и Аккуратерс', 'Хазул', 'Дрессировщик'])

const currentBossItems = computed(() => {
  if (!currentBoss.value) return []
  return catalog.filter((item) => bossFor(item) === currentBoss.value.name)
})

// Проверка наличия контента для босса
const hasAbilities = computed(() => currentBoss.value?.ability?.length > 0)
const hasUpgrade = computed(() => currentBoss.value?.upgrade)
const hasItems = computed(() => currentBossItems.value.length > 0)

// Анимация при смене босса
watch(
  () => route.query.name,
  () => {
    isContentVisible.value = false
    setTimeout(() => {
      isContentVisible.value = true
    }, 150)
    // Закрываем сайдбар на мобильных после выбора босса
    showSidebar.value = false
  }
)

// Переключение сайдбара
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// Запуск анимаций после монтирования
onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      animationsLoaded.value = true
    }, 100)
  })
})
</script>
<template>
  <main class="flex w-full z-10 overflow-x-hidden h-screen">
    <!-- Мобильная кнопка меню -->
    <button
      @click="toggleSidebar"
      class="fixed top-20 left-4 z-50 md:hidden bg-purple text-white p-2 rounded-lg shadow-lg"
      title="Показать боссов"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        ></path>
      </svg>
    </button>

    <!-- Сайдбар -->
    <div
      class="fixed border-r border-gray-600 h-full w-72 overflow-y-auto bg-gray-800 z-40 transition-transform duration-300 animate-on-mount"
      :class="[
        showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        { 'slide-in-left': animationsLoaded },
      ]"
    >
      <div class="p-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-center text-gray-200">Боссы</h2>
          <button
            @click="toggleSidebar"
            class="md:hidden text-gray-300 hover:text-white"
            title="Закрыть"
          >
            ✕
          </button>
        </div>

        <!-- Иконка босса -->
        <div class="flex justify-center mb-4">
          <div class="bg-gray-900 bg-opacity-80 p-4 backdrop-blur-sm rounded-lg">
            <component
              :is="currentIcon"
              class="w-16 h-16 opacity-40 transition-opacity duration-300"
            />
          </div>
        </div>

        <!-- Список боссов -->
        <div class="space-y-2">
          <router-link
            v-for="boss in bosses"
            :key="boss.id"
            :to="`/boss?name=${boss.name}`"
            class="block text-lg opacity-75 lg:text-xl text-white hover:text-active transition-all duration-200 hover:translate-x-1 py-1"
            :class="[{ 'underline font-semibold opacity-100': boss.id === currentBoss?.id, 'boss-with-nose': noseSlotBosses.has(boss.name) }]"
          >
            {{ boss.name }}<span v-if="noseSlotBosses.has(boss.name)" class="nose-slot">+ слот носа</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Затемнение для мобильных -->
    <div
      v-if="showSidebar"
      @click="toggleSidebar"
      class="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
    ></div>

    <!-- Основной контент с анимацией -->
    <div class="flex-1 md:ml-72 h-full min-h-0 flex flex-col">
      <Transition name="fade" mode="out-in">
        <div
          v-if="isContentVisible && currentBoss"
          key="content"
          class="flex flex-col lg:flex-row w-full mb-8 h-full min-h-0"
        >
          <div
            class="w-full lg:flex-1 min-w-0 px-4 pt-10 relative lg:pr-20 overflow-y-auto max-h-[calc(100%-24px)] h-full min-h-0"
          >
            <div
              class="mb-6 animate-on-mount-opacity"
              :class="{ 'fade-in-opacity': animationsLoaded }"
            >
              <h1 class="text-2xl lg:text-3xl font-bold text-white mb-2">{{ currentBoss.name }}</h1>
              <p v-if="currentBoss.recovered" class="text-sm text-gray-400 mb-3">
                Босс волны {{ currentBoss.wave }}. Описание восстановлено по старому гайду и не подтверждено для версии 1.5.5.
              </p>
              <p
                v-if="currentBoss.catchPhrase"
                class="text-base lg:text-lg text-gray-300 italic mb-4"
              >
                "{{ currentBoss.catchPhrase }}"
              </p>
            </div>

            <div v-if="currentBoss.recovered" class="px-2 mb-5 text-gray-300 space-y-2">
              <p v-if="currentBoss.summons"><strong>Призыв:</strong> {{ currentBoss.summons }}</p>
              <p v-if="currentBoss.danger"><strong>Чем опасен:</strong> {{ currentBoss.danger }}</p>
              <p v-if="currentBoss.stats"><strong>Параметры:</strong> {{ currentBoss.stats }}</p>
            </div>

            <div
              class="animate-on-mount-left mb-8"
              :class="{ 'slide-in-left delay-200': animationsLoaded }"
            >
              <BaseAccordeon>
                <template v-slot:button>
                  <div id="abilities" class="flex items-center">
                    <span>Скилы</span>
                    <div v-if="hasAbilities" class="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </template>
                <template v-slot:content>
                  <div v-if="!hasAbilities" class="text-gray-500">
                    Пока отсутствуют. Есть инфа? Пиши по ссылкам из раздела
                    <BaseLink title="«О проекте»" link="/about" class="test-red" />
                  </div>
                  <ul
                    v-for="(ability, index) in currentBoss.ability"
                    :key="ability.id"
                    class="py-2"
                  >
                    <li class="hover:bg-gray-50 p-2 rounded transition-colors">
                      <span class="font-bold text-purple">{{ index + 1 }}.</span>
                      <span v-if="ability.name">
                        <span v-html="ability.name" class="font-extrabold" />:
                      </span>
                      <span
                        v-html="ability.description.replaceAll('.', '.<br/>')"
                        class="indent-1"
                      />
                    </li>
                  </ul>
                </template>
              </BaseAccordeon>

              <BaseAccordeon class="pb-8">
                <template v-slot:button>
                  <div id="upgrade" class="flex items-center">
                    <span>Квест по апгрейду способностей</span>
                    <div v-if="hasUpgrade" class="ml-2 w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </template>
                <template v-slot:content>
                  <div v-if="!hasUpgrade" class="text-gray-500">
                    Пока отсутствует. Есть инфа? Пиши по ссылкам из раздела
                    <BaseLink title="«О проекте»" link="/about" class="test-red" />
                  </div>
                  <div class="content" ref="upgrade" v-else>
                    <div class="min-h-0">
                      <BaseMarkdownWrapper :source="currentBoss.upgrade" />
                    </div>
                  </div>
                </template>
              </BaseAccordeon>
            </div>
          </div>
          <div
            class="w-full lg:w-auto min-w-[290px] max-w-xs px-4 animate-on-mount-right sticky lg:top-16 right-0 mt-0 ml-8 z-20"
            :class="{ 'slide-in-top delay-300': animationsLoaded }"
          >
            <div id="items" class="my-4 text-xl font-semibold text-purple flex items-center">
              Дроп:
              <div v-if="hasItems" class="ml-2 w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
            <div class="grid grid-cols-1 gap-2">
              <router-link
                :to="`/arts?item=${item.id}`"
                class="flex items-center rounded-lg border-2 border-gray-500 bg-gray-700 hover:border-yellow-400 hover:shadow-[0_0_12px_gold] hover:bg-gray-600 transition-all duration-200 p-2"
                v-for="item in currentBossItems"
                :key="item.id"
              >
                <img :src="iconFor(item)" :alt="item.name" class="mr-3 w-12 h-12 object-contain" />
                <span class="text-link text-sm lg:text-base">{{ item.name }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </main>
</template>

<style scoped>
.boss-with-nose { font-size: 1.125rem; }
.nose-slot { display: inline-block; margin-left: .2rem; color: #efc47d; font-size: .6rem; white-space: nowrap; }
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
