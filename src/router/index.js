import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/item/:id',
      name: 'item',
      component: () => import('@/views/ItemPage.vue'),
    },
    {
      path: '/goblin/:id',
      name: 'goblin',
      component: () => import('@/views/GoblinPage.vue'),
    },
    // {
    //   path: '/craft',
    //   name: 'craft',
    //   component: () => import('@/views/ItemsPage.vue'),
    // },
    {
      path: '/boss',
      name: 'boss',
      component: () => import('@/views/BossPage.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutPage.vue'),
    },
    {
      path: '/quest',
      name: 'quest',
      component: () => import('@/views/QuestPage.vue'),
    },
    {
      path: '/craft',
      name: 'craft',
      component: () => import('@/views/CatalogPage.vue'),
    },
    {
      path: '/guides',
      name: 'guides',
      component: () => import('@/views/GuidesPage.vue'),
    },
    {
      path: '/arts',
      name: 'arts',
      component: () => import('@/views/ArtsPage.vue'),
    },
  ],
})

export default router
