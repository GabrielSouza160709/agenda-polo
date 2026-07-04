import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

type ToastTone = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (message: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function toastClasses(tone: ToastTone) {
  if (tone === 'error') {
    return 'grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border border-[var(--error)] border-l-4 border-l-[var(--error)] bg-[var(--error-subtle)] px-4 py-3 text-[var(--error-text)] shadow-[var(--shadow-md)]'
  }

  if (tone === 'info') {
    return 'grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border border-[var(--info)] border-l-4 border-l-[var(--info)] bg-[var(--info-subtle)] px-4 py-3 text-[var(--info-text)] shadow-[var(--shadow-md)]'
  }

  return 'grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border border-[var(--success)] border-l-4 border-l-[var(--success)] bg-[var(--success-subtle)] px-4 py-3 text-[var(--success-text)] shadow-[var(--shadow-md)]'
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'error') {
    return <XCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
  }

  if (tone === 'info') {
    return <Info className="mt-0.5 h-4 w-4" aria-hidden="true" />
  }

  return <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const toast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID()
    setMessages((current) => [...current, { ...message, id }])
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {messages.map((message) => (
          <ToastPrimitive.Root
            key={message.id}
            className={toastClasses(message.tone)}
            duration={4000}
            role="status"
            aria-live="polite"
            onOpenChange={(open) => {
              if (!open) {
                setMessages((current) =>
                  current.filter((item) => item.id !== message.id),
                )
              }
            }}
          >
            <ToastIcon tone={message.tone} />
            <ToastPrimitive.Title className="text-sm font-semibold">
              {message.title}
            </ToastPrimitive.Title>
            {message.description ? (
              <ToastPrimitive.Description className="col-start-2 text-sm">
                {message.description}
              </ToastPrimitive.Description>
            ) : null}
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed inset-x-4 top-4 z-[100] flex max-h-[calc(100dvh-2rem)] flex-col gap-2 outline-none sm:left-auto sm:w-[calc(100vw-2rem)] sm:max-w-sm" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }

  return context
}
