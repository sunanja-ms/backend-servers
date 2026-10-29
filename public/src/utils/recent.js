const KEY = 'recent-products'
const MAX = 8

export function getRecentIds() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function pushRecentId(id) {
  const list = [id, ...getRecentIds().filter((x) => x !== id)].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(list))
}
