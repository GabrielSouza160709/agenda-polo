import { Button } from '@/components/ui/button'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { signIn } from 'next-auth/react'
import { buildNextAuthOptions } from './api/auth/[...nextauth].api'

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        fill="var(--google-blue)"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="var(--google-green)"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="var(--google-yellow)"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="var(--google-red)"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

export default function Home() {
  return (
    <main className="grid min-h-dvh bg-background md:grid-cols-[40%_60%]">
      <section className="hidden bg-primary px-8 py-10 text-[var(--text-on-brand)] md:flex md:flex-col md:items-center md:justify-center">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <img
            src="/logo-polo.png"
            alt="Polo Negocios Imobiliarios"
            width={160}
            height={56}
            className="h-auto"
            style={{
              width: '160px',
              height: 'auto',
              filter: 'brightness(0) invert(1)',
            }}
          />
          <p className="text-base font-normal opacity-90">
            Agenda de Sala de Reuniao
          </p>
        </div>
        <p className="text-[11px] opacity-60">Desenvolvido por Gabriel Souza</p>
      </section>

      <section className="flex min-h-dvh items-center justify-center bg-card px-6 py-10">
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
            <div className="grid gap-2">
              <h1 className="text-2xl font-semibold leading-tight text-foreground">
                Bem-vindo
              </h1>
              <p className="text-sm text-muted-foreground">
                Entre com sua conta Google para acessar a agenda
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-12 bg-card text-base font-medium text-foreground shadow-[var(--shadow-sm)] hover:bg-muted"
              onClick={() => signIn('google', { callbackUrl: '/agenda' })}
            >
              <GoogleIcon />
              Entrar com Google
            </Button>
            <p className="text-xs text-[var(--text-muted)]">
              Acesso restrito a colaboradores da Polo Negocios
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(
    req,
    res,
    buildNextAuthOptions(req, res),
  )

  if (session) {
    return {
      redirect: {
        destination: '/agenda',
        permanent: false,
      },
    }
  }

  return { props: {} }
}
