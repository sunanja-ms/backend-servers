import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getWishlistIds, addToWishlist, removeFromWishlist } from '../api/wishlist'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref([])
  const loaded = ref(false)

  const count = computed(() => ids.value.length)
  const has = (productId) => ids.value.includes(productId)

  async function load(force = false) {
    if (loaded.value && !force) return
    const res = await getWishlistIds()
    ids.value = res.data.data || []
    loaded.value = true
  }

  // Returns the new state so the caller can show the right toast.
  async function toggle(productId) {
    if (has(productId)) {
      await removeFromWishlist(productId)
      ids.value = ids.value.filter((id) => id !== productId)
      return false
    }
    await addToWishlist(productId)
    ids.value = [...ids.value, productId]
    return true
  }

  function reset() {
    ids.value = []
    loaded.value = false
  }

  return { ids, loaded, count, has, load, toggle, reset }
})
