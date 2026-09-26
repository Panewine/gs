<script setup>
import { computed, watch, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { useGoblinState } from '@/components/composables/useGoblinState'
import GrenadeIcon from '@/components/icons/GrenadeIcon.vue'
import BottomPanel from '@/components/layouts/panels/BottomPanel.vue'
import GoblinPanel from '@/components/layouts/panels/GoblinPanel.vue'
import InventoryPanel from '@/components/layouts/panels/InventoryPanel.vue'
import SkillPanel from '@/components/layouts/panels/SkillPanel.vue'

const route = useRoute()

const activeGoblin = computed(() => route.query.goblin)
const isDataLoaded = ref(false)
const showAnimations = ref(false)

const { user, setSkill } = useGoblinState()

// Следим за изменениями активного гоблина
watch(
  () => activeGoblin.value,
  (newGoblin) => {
    if (newGoblin && user.goblin?.abilities[0]) {
      setSkill(user.goblin.abilities[0])
      // Перезапускаем анимации при смене гоблина
      restartAnimations()
    }
  }
)

// Следим за изменениями данных пользователя
watch(
  () => user.goblin,
  (newGoblin) => {
    if (newGoblin) {
      isDataLoaded.value = true
      if (!showAnimations.value) {
        startAnimations()
      }
    }
  }
)

const startAnimations = () => {
  setTimeout(() => {
    showAnimations.value = true
    // Показываем скроллбар после завершения анимаций
    setTimeout(() => {
      document.body.classList.add('animations-loaded')
    }, 1500)
  }, 100)
}

const restartAnimations = () => {
  showAnimations.value = false
  setTimeout(() => {
    showAnimations.value = true
  }, 50)
}

onMounted(() => {
  // Если данные уже загружены, сразу запускаем анимации
  if (user.goblin) {
    isDataLoaded.value = true
    startAnimations()
  }
})
</script>
<template>
  <main class="align-center relative flex flex-col -mt-16">
    <!-- Заголовок с анимацией -->
    <div
      v-if="!activeGoblin"
      class="animate-on-mount-top"
      :class="{ 'slide-in-top': showAnimations }"
    >
      <img src="/images/header.webp" alt="main" class="min-h-[150px] w-full object-cover" />
      <div
        class="px-6 text-right text-3xl text-purple xxl:text-6xl fixed right-8 top-15 name-shadow"
      >
        G<GrenadeIcon class="mb-2 inline" />blin Survival
      </div>
    </div>

    <!-- Описание с анимацией opacity -->
    <div
      v-if="!activeGoblin"
      class="px-8 transition-opacity animate-on-mount-opacity"
      :class="{ 'fade-in-opacity delay-200': showAnimations }"
      ref="body"
    >
      <div class="text-xl lg:text-2xl mb-2 warcraft-title">
        <span>
          Интерактивный редактор персонажа, дерево крафта и библиотека оружия для твоей любимой
          карты. <br />
          <span class="warcraft-title-underline">Каталог крафта и гайды: версия 1.5.5fix9</span>
        </span>
      </div>

      <div class="warcraft-panel p-6 mb-4">
        <div class="indent-8 mb-4">
          Небольшой гоблинской экспедиции становится известным о старой заброшенной пещере, в
          которой несколько сотен лет назад пропала безвести целая бригада гномов-археологов.
        </div>
        <div class="indent-8 mb-4">
          Всё-бы ничего, но в той бригаде было множество очень умных инженеров-механиков, и все свои
          секретные чертежи и разработки были утеряны вместе с ними. Никому неизвестно почему именно
          пропала та бригада, но известно лишь что они откопали в глубине скальной породы несколько
          храмовых помещений, в которых, по всей видимости, жили самые первые гномы.
        </div>
        <div class="indent-8">
          Отважные и обезбашенные гоблины разбивают лагерь перед входом в пещеру, настраивают
          мини-телепорты для передачи предметов с поверхности, и спускаются в заброшенную шахту, с
          надеждой выкрасть и найти уникальные секреты гномов и научиться использовать их в своих
          смертоносных сумасшедших изобретениях...
        </div>
      </div>
    </div>

    <!-- Информация о гоблине с анимацией -->
    <div v-if="activeGoblin && user.goblin && isDataLoaded" class="flex h-full gap-4 mt-20">
      <!-- Левый блок - выезжает слева -->
      <div
        class="w-1/2 animate-on-mount-left opacity-0"
        :class="{ 'slide-in-left delay-200': showAnimations }"
      >
        <div class="text-active text-3xl my-4 px-4 w-fit warcraft-title">
          {{ user.goblin.name }}
        </div>
        <div
          class="w-full rounded-r-xl warcraft-panel p-4 text-2xl h-fit"
          v-if="user.goblin.description"
        >
          {{ user.goblin.description }}
        </div>
      </div>

      <!-- Правый блок - выезжает справа -->
      <div
        class="w-1/2 mt-16 animate-on-mount-right opacity-0"
        :class="{ 'slide-in-right delay-300': showAnimations }"
      >
        <div class="text-2xl text-active py-2 warcraft-title" v-if="user.activeSkill">
          {{ user.activeSkill.name }}
        </div>
        <div
          v-if="user.activeSkill?.description"
          class="w-full rounded-l-xl warcraft-panel p-4 mb-2 leading-5"
        >
          <div v-html="user.activeSkill.description" />
          <div v-if="user.activeSkill.cd" class="text-green warcraft-stat">
            кд: {{ user.activeSkill.cd }} сек
          </div>
          <div v-if="user.activeSkill.dur" class="text-purple warcraft-stat">
            длительность: {{ user.activeSkill.dur }} сек
          </div>
          <div v-if="user.activeSkill.mc" class="text-red warcraft-stat">
            манакост: {{ user.activeSkill.mc }} маны
          </div>
        </div>
      </div>
    </div>

    <!-- Нижняя панель только на главной странице -->
    <BottomPanel>
      <GoblinPanel />
      <InventoryPanel />
      <SkillPanel />
    </BottomPanel>
  </main>
</template>
<style>
.name-shadow {
  text-shadow: 1px 1px 2px black;
}

/* Предотвращение появления скроллбара во время загрузки */
main {
  overflow: hidden;
  min-height: 100vh;
}

/* Скрываем скроллбар на время загрузки анимаций */
body {
  overflow: hidden;
}

/* Показываем скроллбар только после загрузки всех анимаций */
body.animations-loaded {
  overflow: auto;
}
</style>
