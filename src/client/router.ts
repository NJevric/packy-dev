import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from './views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/dependencies',
      name: 'dependencies',
      component: () => import('./views/DependenciesView.vue'),
    },
    {
      path: '/package/:name',
      name: 'package-detail',
      component: () => import('./views/PackageDetailView.vue'),
    },
    {
      path: '/security',
      name: 'security',
      component: () => import('./views/SecurityAuditView.vue'),
    },
  ],
})

export default router
