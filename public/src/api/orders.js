import client from './client'

export const getOrders = (params) => client.get('/orders', { params })
export const getOrder = (id) => client.get(`/orders/${id}`)
export const createOrder = (data) => client.post('/orders', data)
export const uploadPaymentProof = (id, formData) => client.patch(`/orders/${id}/pay`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
