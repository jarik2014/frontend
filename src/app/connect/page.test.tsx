import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@/test/render'

const mockReplace = vi.fn()
let mockSearch = ''

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}))

let walletConnected: boolean
const connect = vi.fn()
const connectDemo = vi.fn()

const netState = vi.hoisted(() => ({ isMainnet: false }))
vi.mock('../../config/network', () => ({
  get isMainnet() {
    return netState.isMainnet
  },
}))

vi.mock('../../wallet/WalletProvider', () => ({
  useWallet: () => ({ connected: walletConnected, connect, connectDemo }),
}))

vi.mock('../../screens/Connect', () => ({
  Connect: ({
    onWallet,
    onNew,
    onCancel,
    showDemo = true,
  }: {
    onWallet: () => void
    onNew?: () => void
    onCancel: () => void
    showDemo?: boolean
  }) => (
    <div>
      <button onClick={onWallet}>connect wallet</button>
      {showDemo && onNew ? <button onClick={onNew}>start with email</button> : null}
      <button onClick={onCancel}>keep exploring</button>
    </div>
  ),
}))

import ConnectPage from './page'

describe('ConnectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearch = ''
    walletConnected = false
    netState.isMainnet = false
  })

  it('lets a returning (restored-session) user stay on the Connect screen', () => {
    walletConnected = true
    render(<ConnectPage />)
    expect(screen.getByText('connect wallet')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('advances to the default stop after an explicit connect action', async () => {
    const { rerender } = render(<ConnectPage />)
    screen.getByText('connect wallet').click()
    expect(connect).toHaveBeenCalled()
    act(() => {
      walletConnected = true
    })
    rerender(<ConnectPage />)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/deposit')
    })
  })

  it('does not offer the demo wallet on mainnet (#788)', () => {
    netState.isMainnet = true
    render(<ConnectPage />)

    expect(screen.getByText('connect wallet')).toBeInTheDocument()
    expect(screen.queryByText('start with email')).toBeNull()
  })

  it('keeps the demo wallet on testnet (#788)', () => {
    netState.isMainnet = false
    render(<ConnectPage />)

    expect(screen.getByText('start with email')).toBeInTheDocument()
  })

  it('honours the return target when a guard sent the visitor here', async () => {
    mockSearch = 'next=%2Fportfolio'
    const { rerender } = render(<ConnectPage />)
    screen.getByText('start with email').click()
    expect(connectDemo).toHaveBeenCalled()
    act(() => {
      walletConnected = true
    })
    rerender(<ConnectPage />)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/portfolio')
    })
  })
})
