import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import { profileAPI } from '@/lib/profile'
import { authAPI } from '@/lib/supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminDashboardView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/admin-management',
      name: 'admin-management',
      component: () => import('../views/AdminAdminsView.vue'),
      meta: { requiresSuperAdmin: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const publicRoutes = ['/login', '/register']
  if (publicRoutes.includes(to.path)) {
    return true
  }

  try {
    const { data } = await authAPI.getCurrentUser()
    if (!data.user) {
      return '/login'
    }

    if (to.meta.requiresSuperAdmin) {
      const allowed = await profileAPI.hasRole('super_admin')
      if (!allowed) {
        return '/admin'
      }
    } else if (to.meta.requiresAdmin) {
      const isAdmin = await profileAPI.hasRole('admin')
      const isSuper = await profileAPI.hasRole('super_admin')
      if (!isAdmin && !isSuper) {
        return '/dashboard'
      }
    }

    return true
  } catch {
    return '/login'
  }
})

export default router
