import {
  createRouter,
  createWebHistory,
  type Router,
  type RouteRecordRaw,
} from 'vue-router'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import { profileAPI } from '@/lib/profile'
import { authAPI } from '@/lib/auth'

/** Public routes — no auth required; landing stays reachable when signed in. */
const publicPaths = new Set(['/', '/install-app'])

/** Logged-in users are sent to the dashboard instead of these auth paths. */
const guestAuthPathsRedirectWhenAuthenticated = new Set([
  '/login',
  '/register',
])

export const publicNavPaths = new Set<string>([
  ...publicPaths,
  ...guestAuthPathsRedirectWhenAuthenticated,
])

export function replaceWithDashboardIfOnGuestAuthPath(r: Router): void {
  if (guestAuthPathsRedirectWhenAuthenticated.has(r.currentRoute.value.path)) {
    void r.replace({ path: '/dashboard' })
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/LandingView.vue'),
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
    path: '/install-app',
    name: 'install-app',
    component: () => import('../views/InstallAppView.vue'),
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
    redirect: '/admin/management',
  },
  {
    path: '/admin/management',
    name: 'admin-management',
    component: () => import('../views/AdminManagementView.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/organizations',
    name: 'admin-organizations',
    component: () => import('../views/AdminOrganizationsView.vue'),
    meta: { requiresSuperAdmin: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  if (publicPaths.has(to.path)) {
    return true
  }

  if (guestAuthPathsRedirectWhenAuthenticated.has(to.path)) {
    try {
      const { data } = await authAPI.getCurrentUser()
      if (data.user) {
        return { path: '/dashboard', replace: true }
      }
    } catch {
      // Stay on auth pages if the session cannot be read.
    }
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
