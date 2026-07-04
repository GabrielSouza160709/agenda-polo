import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-10 text-foreground">
      <section className="grid w-full max-w-sm justify-items-center gap-6 text-center">
        <img
          src="/logo-polo.png"
          alt="Polo Negocios Imobiliarios"
          width={148}
          height={52}
          className="h-auto"
          style={{ width: '148px', height: 'auto' }}
        />
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold leading-tight">
            Pagina nao encontrada
          </h1>
          <p className="text-sm text-muted-foreground">
            O endereco acessado nao existe neste sistema.
          </p>
        </div>
        <Button asChild>
          <Link href="/agenda">Voltar para a Agenda</Link>
        </Button>
      </section>
    </main>
  )
}
