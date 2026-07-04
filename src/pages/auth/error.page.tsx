import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'
import { signOut } from 'next-auth/react'

export default function AuthErrorPage() {
  const router = useRouter()
  const error = router.query.error

  const isAccessDenied = error === 'AccessDenied'

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-10">
      <div className="grid w-full max-w-sm gap-8 text-center">
        <div className="grid gap-5">
          <img
            src="/logo-polo.png"
            alt="Polo Negocios Imobiliarios"
            width={120}
            height={42}
            className="mx-auto h-auto"
            style={{ width: 'clamp(100px, 32vw, 120px)', height: 'auto' }}
          />

          <div className="grid gap-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--error-subtle)]">
              <svg
                aria-hidden="true"
                className="h-7 w-7 text-[var(--error)]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-semibold leading-tight text-foreground">
              {isAccessDenied ? 'Acesso negado' : 'Erro de autenticação'}
            </h1>

            <p className="text-sm text-muted-foreground">
              {isAccessDenied
                ? 'Seu email não tem permissão para acessar este sistema. Entre em contato com o administrador.'
                : 'Ocorreu um erro de autenticação.'}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full"
        >
          Tentar novamente
        </Button>
      </div>
    </main>
  )
}
