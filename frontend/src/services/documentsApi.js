import api from './api'

export async function uploadPdf(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function listDocuments() {
  const { data } = await api.get('/api/documents')
  return data.documents
}

export async function deleteDocument(documentId) {
  const { data } = await api.delete(`/api/documents/${documentId}`)
  return data
}
