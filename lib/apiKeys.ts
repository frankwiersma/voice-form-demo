/**
 * BYOK (Bring Your Own Keys) — localStorage-based key storage.
 * Keys never leave the browser except when sent to this app's own server actions.
 */

const LS_PREFIX = 'vfd_key_'

export type Provider = 'elevenlabs' | 'deepgram' | 'google'

interface ProviderConfig {
  label: string
  description: string
  docsUrl: string
  docsLabel: string
  placeholder: string
  required: boolean
}

export const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  google: {
    label: 'Google Gemini API Key',
    description: 'Required for field extraction (all providers) and Gemini voice transcription.',
    docsUrl: 'https://aistudio.google.com/apikey',
    docsLabel: 'Get key at aistudio.google.com →',
    placeholder: 'AIzaSy...',
    required: true,
  },
  elevenlabs: {
    label: 'ElevenLabs API Key',
    description: 'High-accuracy transcription with ElevenLabs Scribe.',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    docsLabel: 'Get key at elevenlabs.io →',
    placeholder: 'sk_...',
    required: false,
  },
  deepgram: {
    label: 'Deepgram API Key',
    description: 'Fast, cost-effective transcription with Deepgram Nova.',
    docsUrl: 'https://console.deepgram.com/',
    docsLabel: 'Get key at console.deepgram.com →',
    placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: false,
  },
}

export function getKey(provider: Provider): string {
  return (typeof window !== 'undefined' ? localStorage.getItem(LS_PREFIX + provider) : null) ?? ''
}

export function setKey(provider: Provider, value: string): void {
  if (typeof window === 'undefined') return
  if (value.trim()) {
    localStorage.setItem(LS_PREFIX + provider, value.trim())
  } else {
    localStorage.removeItem(LS_PREFIX + provider)
  }
}

export function hasKey(provider: Provider): boolean {
  return !!getKey(provider)
}

export function getAllKeys(): Record<Provider, string> {
  return {
    elevenlabs: getKey('elevenlabs'),
    deepgram: getKey('deepgram'),
    google: getKey('google'),
  }
}

export function hasRequiredKeys(): boolean {
  return hasKey('google')
}
