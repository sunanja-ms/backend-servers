import client from './client'

export const getProducts = (params) => client.get('/products', { params })
export const getProduct = (id) => client.get(`/products/${id}`)
export const createProduct = (data) => client.post('/products', data)
export const updateProduct = (id, data) => client.put(`/products/${id}`, data)
export const deleteProduct = (id) => client.delete(`/products/${id}`)
export const updateStock = (id, data) => client.patch(`/products/${id}/stock`, data)
export const restoreProduct = (id) => client.patch(`/products/${id}/restore`)
export const toggleProductStatus = (id, data) => client.patch(`/products/${id}/toggle-status`, data)
export const uploadProductImage = (id, formData) => client.post(`/products/${id}/images`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const deleteProductImage = (productId, imageId) => client.delete(`/products/${productId}/images/${imageId}`)
export const setPrimaryProductImage = (productId, imageId) => client.patch(`/products/${productId}/images/${imageId}/primary`)
export const getLowStock = (threshold = 10) => client.get('/products/low-stock', { params: { threshold } })
