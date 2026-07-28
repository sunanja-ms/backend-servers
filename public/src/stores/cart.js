import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCart, addToCart, updateCartItem, removeCartItem } from '../api/cart'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const loading = ref(false)

  const totalItems = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const subtotal = computed(() => items.value.reduce((s, i) => s + Number(i.price) * i.quantity, 0))

  async function fetchCart() {
    loading.value = true
    try {
      const res = await getCart()
      items.value = res.data.data || []
    } catch { items.value = [] }
    finally { loading.value = false }
  }

  async function addItem(productId, quantity = 1) {
    const res = await addToCart({ productId, quantity })
    await fetchCart()
    return res.data
  }

  async function updateQty(id, quantity) {
    if (quantity < 1) return removeItem(id)
    await updateCartItem(id, { quantity })
    const item = items.value.find(i => i.id === id)
    if (item) item.quantity = quantity
  }

  async function removeItem(id) {
    await removeCartItem(id)
    items.value = items.value.filter(i => i.id !== id)
  }

  async function clearCart() {
    for (const item of items.value) {
      await removeCartItem(item.id)
    }
    items.value = []
  }

  return { items, loading, totalItems, subtotal, fetchCart, addItem, updateQty, removeItem, clearCart }
})
