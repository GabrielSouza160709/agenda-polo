import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { BarChart2, CalendarDays, ListTodo, LogOut, Plus, Users } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { ReactNode } from 'react'

export interface AppUser {
  name: string
  email: string
  image: string | null
  role?: 'USER' | 'ADMIN'
}

interface AppShellProps {
  user: AppUser
  children: ReactNode
  onNewReservation?: () => void
}

const navigation = [
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/minhas-reservas', label: 'Minhas Reservas', icon: ListTodo },
]

const adminNavigation = [
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/metricas', label: 'Métricas', icon: BarChart2 },
]

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function NewReservationButton({
  onNewReservation,
}: {
  onNewReservation?: () => void
}) {
  if (onNewReservation) {
    return (
      <Button
        type="button"
        onClick={onNewReservation}
        className="h-11 w-full justify-center"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span>Nova Reserva</span>
      </Button>
    )
  }

  return (
    <Button asChild className="h-11 w-full justify-center">
      <Link href="/agenda">
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span>Nova Reserva</span>
      </Link>
    </Button>
  )
}

export function AppShell({ user, children, onNewReservation }: AppShellProps) {
  const router = useRouter()
  const isAdmin = user.role === 'ADMIN'

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-card p-4 md:flex">
          <div className="flex h-full flex-col justify-between overflow-hidden">
            <div className="min-h-0">
              <div className="flex min-h-11 items-center justify-center">
                <img
                  src="/logo-polo.png"
                  alt="Polo Negocios Imobiliarios"
                  width={140}
                  height={48}
                  className="h-auto"
                  style={{ width: '140px', height: 'auto' }}
                />
              </div>

              <Separator className="my-6" />

              <NewReservationButton onNewReservation={onNewReservation} />

              <nav className="mt-6 grid gap-1" aria-label="Navegacao principal">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const active = router.pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active &&
                          'bg-[var(--brand-subtle)] text-[var(--brand-text)] hover:bg-[var(--brand-subtle)] hover:text-[var(--brand-text)]',
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {isAdmin ? (
                <>
                  <Separator className="my-4" />
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Admin
                  </p>
                  <nav className="grid gap-1" aria-label="Navegacao admin">
                    {adminNavigation.map((item) => {
                      const Icon = item.icon
                      const active = router.pathname === item.href

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active &&
                              'bg-[var(--brand-subtle)] text-[var(--brand-text)] hover:bg-[var(--brand-subtle)] hover:text-[var(--brand-text)]',
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </>
              ) : null}
            </div>

            <div className="grid gap-3 pb-1">
              <div className="flex min-w-0 items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-9 w-9 bg-[var(--brand-subtle)] text-[var(--brand-text)]">
                      <AvatarImage
                        src={user.image ?? undefined}
                        alt={user.name}
                      />
                      <AvatarFallback>{initials(user.name)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="grid gap-0.5">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-[var(--text-muted)]">
                        {user.email}
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-[13px] text-[var(--text-muted)] hover:text-destructive"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sair</span>
              </Button>

              <Separator />

              <p className="text-center text-[11px] text-[var(--text-muted)]">
                Desenvolvido por Gabriel Souza
              </p>
            </div>
          </div>
        </aside>

        <main className="min-h-dvh pb-[calc(64px+env(safe-area-inset-bottom)+24px)] md:pl-60 md:pb-0">
          <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6 md:py-6 lg:px-8">
            {children}
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 grid h-16 grid-cols-3 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = router.pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium text-[var(--text-muted)] transition-colors',
                  active && 'text-[var(--brand-text)]',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium text-[var(--text-muted)] transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Sair
          </button>
        </nav>
      </div>
    </TooltipProvider>
  )
}
