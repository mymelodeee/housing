import { useEffect, useState } from 'react'

type ScriptStatus = 'loading' | 'ready' | 'error'

const SCRIPT_ID = 'naver-maps-sdk'
const LOAD_TIMEOUT_MS = 10000

export function useNaverMapsScript(clientId: string | undefined): ScriptStatus {
  const [status, setStatus] = useState<ScriptStatus>(() => (window.naver?.maps ? 'ready' : 'loading'))

  useEffect(() => {
    if (!clientId || window.naver?.maps) return

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null

    const handleLoad = () => {
      if (window.naver?.maps) {
        setStatus('ready')
      } else {
        setStatus('error')
      }
    }
    const handleError = () => setStatus('error')

    const script = existing ?? document.createElement('script')
    if (!existing) {
      script.id = SCRIPT_ID
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
      script.async = true
      document.head.appendChild(script)
    }

    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)

    const timeoutId = window.setTimeout(() => {
      if (!window.naver?.maps) {
        setStatus('error')
      }
    }, LOAD_TIMEOUT_MS)

    return () => {
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
      window.clearTimeout(timeoutId)
    }
  }, [clientId])

  if (!clientId) return 'error'

  return status
}
