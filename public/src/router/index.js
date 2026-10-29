import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { guest: true, layout: 'auth' } },
  { path: '/register', name: 'Register', component: () => import('../views/RegisterView.vue'), meta: { guest: true, layout: 'auth' } },
  { path: '/', name: 'Home', component: () => import('../views/HomeView.vue'), meta: { auth: true, layout: 'shop' } },
  { path: '/products/:id', name: 'ProductDetail', component: () => import('../views/ProductDetailView.vue'), meta: { auth: true, layout: 'shop' } },
  { path: '/cart', name: 'Cart', component: () => import('../views/CartView.vue'), meta: { auth: true, layout: 'shop' } },
  { path: '/checkout', name: 'Checkout', component: () => import('../views/CheckoutView.vue'), meta: { auth: true, layout: 'shop' } },
  { path: '/orders', name: 'Orders', component: () => import('../views/OrdersView.vue'), meta: { auth: true, layout: 'shop' } },
  { path: '/orders/:id', name: 'OrderDetail', component: () => import('../views/OrderDetailView.vue'), meta: { auth: true, layout: 'shop' } },
  { path: '/wishlist', name: 'Wishlist', component: () => import('../views/WishlistView.vue'), meta: { auth: true, layout: 'shop' } },
  { path: '/profile', name: 'Profile', component: () => import('../views/ProfileView.vue'), meta: { auth: true, layout: 'sidebar' } },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/DashboardView.vue'), meta: { auth: true, layout: 'sidebar' } },
  { path: '/products', name: 'Products', component: () => import('../views/ProductsView.vue'), meta: { auth: true, layout: 'sidebar' } },
  { path: '/categories', name: 'Categories', component: () => import('../views/CategoriesView.vue'), meta: { auth: true, admin: true, layout: 'sidebar' } },
  { path: '/users', name: 'Users', component: () => import('../views/UsersView.vue'), meta: { auth: true, admin: true, layout: 'sidebar' } },
  { path: '/api-keys', name: 'ApiKeys', component: () => import('../views/ApiKeysView.vue'), meta: { auth: true, layout: 'sidebar' } },
  { path: '/stream', name: 'Stream', component: () => import('../views/StreamView.vue'), meta: { auth: true, layout: 'sidebar' } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.isAuthenticated) return next('/login')
  if (to.meta.guest && auth.isAuthenticated) return next('/')
  if (to.meta.admin && !auth.isAdmin) return next('/')
  next()
})

export default router
