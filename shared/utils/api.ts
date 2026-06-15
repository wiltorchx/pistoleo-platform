import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const extractData = <T>(response: unknown): T => {
  const res = response as { data?: { data?: T } | T };
  const data = res.data;
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}

export default api
