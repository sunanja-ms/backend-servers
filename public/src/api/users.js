import client from './client'

export const getUsers = () => client.get('/users')
export const getUser = (id) => client.get(`/users/${id}`)
export const updateUser = (id, data) => client.put(`/users/${id}`, data)
export const deleteUser = (id) => client.delete(`/users/${id}`)
export const changePassword = (id, data) => client.post(`/users/${id}/change-password`, data)
export const toggleUserStatus = (id) => client.patch(`/users/${id}/toggle-status`)
