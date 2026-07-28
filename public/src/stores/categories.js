import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCategories } from '../api/categories'

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)

  async function fetchCategories() {
    loading.value = true
    try {
      const res = await getCategories()
      categories.value = res.data.data || []
    } catch { categories.value = [] }
    finally { loading.value = false }
  }

  function buildTree(list, parentId = null) {
    return list
      .filter(c => c.parentId === parentId)
      .map(c => ({ ...c, children: buildTree(list, c.id) }))
  }

  const tree = () => buildTree(categories.value)

  return { categories, loading, fetchCategories, tree }
})
