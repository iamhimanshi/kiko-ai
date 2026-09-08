import api from './api'

export async function signup({ name, email, password }) {
  const { data } = await api.post('/api/auth/signup', { name, email, password })
  return data
}

export async function login({ email, password }) {
  const { data } = await api.post('/api/auth/login', { email, password })
  return data
}

export async function logout() {
  const { data } = await api.post('/api/auth/logout')
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/api/auth/me')
  return data
}

export async function startDemo() {
  const { data } = await api.post('/api/auth/demo')
  return data
}
