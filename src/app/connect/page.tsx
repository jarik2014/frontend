'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Connect } from '../../screens/Connect'
import { isMainnet } from '../../config/network'
import { useWallet } from '../../wallet/WalletProvider'

/**
 * Only same-origin, absolute in-app paths are honoured as a return target.
 * `next` arrives in the URL, so treating it as a bare redirect would let a
 * crafted link bounce a freshly-connected wallet holder off-site. A leading
 * `//` (or `/\`) is rejected because the browser reads it as protocol-relative.
 */
function safeNext(raw: string | null): string | null {
  if (!raw) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//') || raw.startsWith('/\\')) return null
  return raw
}

function ConnectRoute() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { connected, connect, connectDemo } = useWallet()

  const next = safeNext(searchParams.get('next'))

  // A restored session sets `connected` on mount without any user input, so the
  // fact of being connected must not alone bounce a returning user off this
  // screen — they came here to review or switch their connection. Only an
  // explicit connect action performed here should advance to the first stop.
  const didConnectRef = useRef(false)

  // Once the visitor connects on this page (real modal selection or the demo
  // path), move on — back to whatever they were originally reaching for, if a
  // guard sent them here, otherwise the default first stop.
  useEffect(() => {
    if (connected && didConnectRef.current) router.replace(next ?? '/deposit')
  }, [connected, router, next])

  return (
    <Connect
      onWallet={() => {
        didConnectRef.current = true
        void connect()
      }}
      showDemo={!isMainnet}
      onNew={
        isMainnet
          ? undefined
          : () => {
              didConnectRef.current = true
              connectDemo()
            }
      }
      onCancel={() => router.push('/explore')}
    />
  )
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <ConnectRoute />
    </Suspense>
  )
}
