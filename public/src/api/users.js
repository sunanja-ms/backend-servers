import client from './client'

export const getUsers = (params) => client.get('/users', { params })
export const getUser = (id) => client.get(`/users/${id}`)
export const updateUser = (id, data) => client.put(`/users/${id}`, data)
export const deleteUser = (id) => client.delete(`/users/${id}`)
export const changePassword = (id, data) => client.post(`/users/${id}/change-password`, data)
export const toggleUserStatus = (id, data) => client.patch(`/users/${id}/toggle-status`, data)
export const restoreUser = (id) => client.patch(`/users/${id}/restore`)
