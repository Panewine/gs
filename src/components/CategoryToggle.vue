<script setup>
defineOptions({ name: 'CategoryToggle' })
const props = defineProps({
  group: { type: Object, required: true },
  selected: { type: Object, required: true },
})
const emit = defineEmits(['toggle'])

function toggle(event) {
  emit('toggle', props.group.id, event.target.checked)
}

function forwardToggle(id, checked) {
  emit('toggle', id, checked)
}
</script>

<template>
  <div class="category-toggle" :class="{ active: !!selected[group.id] }">
    <label><input type="checkbox" :checked="!!selected[group.id]" @change="toggle" /> {{ group.title }}</label>
    <details v-if="group.children?.length" class="children-menu">
      <summary>Подкатегории</summary>
      <div class="children">
        <CategoryToggle v-for="child in group.children" :key="child.id" :group="child" :selected="selected" @toggle="forwardToggle" />
      </div>
    </details>
  </div>
</template>

<style scoped>
.category-toggle { min-width: 0; }
label { display: flex; align-items: center; gap: .4rem; min-height: 2rem; padding: .35rem .45rem; border: 1px solid #514636; border-radius: 6px; background: #23282d; cursor: pointer; line-height: 1.2; }
.active > label { color: #efc47d; border-color: #a17b43; background: #3f3527; }
input { accent-color: #c69b52; width: 1rem; height: 1rem; flex: none; }
.children-menu { margin: .2rem 0 .15rem .25rem; }
.children-menu summary { color: #bfb7a9; cursor: pointer; font-size: .8rem; }
.children { margin: .3rem 0 0 .25rem; padding-left: .5rem; border-left: 1px solid #725633; display: grid; gap: .3rem; }
</style>
