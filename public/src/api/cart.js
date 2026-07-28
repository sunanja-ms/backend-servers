import client from './client'

export const getCart = () => client.get('/cart')
export const addToCart = (data) => client.post('/cart', data)
export const updateCartItem = (id, data) => client.patch(`/cart/${id}`, data)
export const removeCartItem = (id) => client.delete(`/cart/${id}`)
