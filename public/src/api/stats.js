import client from './client'

export const getOverview = (threshold = 10) => client.get('/stats/overview', { params: { threshold } })
