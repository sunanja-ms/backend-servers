import client from './client'

export const getMasterPlaylist = () => client.get('/stream/master.m3u8')
export const getStreamUrl = (resolution, file) => `/api/v1/stream/${resolution}/${file}`
export const getMasterUrl = () => '/api/v1/stream/master.m3u8'
