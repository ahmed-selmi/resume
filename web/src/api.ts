import type { TailorRequest, TailorResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim()

function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured.')
  }

  return `${API_BASE_URL.replace(/\/$/, '')}${path}`
}

export async function generateTailoredResume(
  payload: TailorRequest,
): Promise<TailorResponse> {
  const response = await fetch(getApiUrl('/api/tailor'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let details = response.statusText
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) {
        details = body.error
      }
    } catch {
      // Ignore parsing failures and fall back to status text.
    }

    throw new Error(`Resume generation failed: ${details}`)
  }

  return (await response.json()) as TailorResponse
}
