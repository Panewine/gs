<script setup>
import BaseLink from '@/components/BaseLink.vue'
</script>

<template>
  <div class="fixed top-0 left-0 z-20 flex items-start">
    <img src="/images/t1.png" style="margin-left: -512px" class="nav-art pointer-events-none" />
    <img src="/images/t1.png" class="nav-art pointer-events-none" />
    <img src="/images/t2.png" class="nav-art pointer-events-none" />
    <img src="/images/t3.png" class="nav-art pointer-events-none" />
    <img src="/images/t4.png" class="nav-art pointer-events-none" />
    <img
      src="/images/t1.png"
      style="margin-right: -512px; height: 61px"
      class="nav-art pointer-events-none"
    />

    <!-- Ссылки располагаются в ячейках текстуры меню. -->
    <div class="nav-links absolute z-10">
      <BaseLink title="Главная" link="/" />
      <BaseLink title="Боссы" link="/boss" />
      <BaseLink title="Квесты" link="/quest" />
      <BaseLink title="Гайды" link="/guides" />
      <BaseLink title="Арты" link="/arts" />
    </div>

    <!-- Информационная панель -->
    <div class="version-panel absolute ml-256 w-lg">
      <div class="absolute left-20 top-2 text-orange font-extrabold text-xl">Version 1.5.5fix9</div>
      <a
        href="https://discord.gg/3rhvtTWU"
        target="_blank"
        class="absolute -right-13 my-3 font-medium text-link transition-all hover:scale-110 hover:text-active"
      >
        Гоблины в Discord
      </a>
    </div>
  </div>
</template>

<style scoped>
.nav-art, .version-panel {
  transform: translateX(372px);
}
.nav-links {
  left: 30px;
  top: 0;
  display: grid;
  grid-template-columns: repeat(6, 170px);
  width: 1020px;
  height: 58px;
  align-items: start;
}
.nav-links :deep(a) {
  display: flex;
  height: 48px;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
</style>
