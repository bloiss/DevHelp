import { api } from '@/lib/api'

export interface UploadResult {
  url: string
  name: string
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif']
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Format non supporté. Utilisez PNG, JPEG ou GIF.'
  }
  if (file.size > MAX_SIZE) {
    return 'L\'image dépasse la limite de 20 MB.'
  }
  return null
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<UploadResult>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
