import { AppShell, type AppUser } from '@/components/app-shell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { getActiveUser } from '@/lib/server-auth'
import type { GetServerSideProps } from 'next'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

interface UserRow {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  role: 'USER' | 'ADMIN'
  isActive: boolean
  created_at: string
}

interface AdminUsersProps {
  currentUser: AppUser & { id: string; role: 'USER' | 'ADMIN' }
  initialUsers: UserRow[]
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

async function patchUser(
  userId: string,
  data: { role?: 'USER' | 'ADMIN'; isActive?: boolean },
): Promise<UserRow> {
  const res = await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...data }),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(
      (payload as { message?: string }).message ?? 'Erro ao atualizar usuário.',
    )
  }

  const payload = (await res.json()) as { user: UserRow }
  return payload.user
}

async function deleteUser(userId: string): Promise<void> {
  const res = await fetch('/api/admin/users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(
      (payload as { message?: string }).message ?? 'Erro ao remover usuário.',
    )
  }
}

export default function AdminUsuarios({
  currentUser,
  initialUsers,
}: AdminUsersProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null)
  const { toast } = useToast()

  async function handleUpdate(
    userId: string,
    data: { role?: 'USER' | 'ADMIN'; isActive?: boolean },
  ) {
    setLoadingId(userId)
    try {
      const updated = await patchUser(userId, data)
      setUsers((current) =>
        current.map((u) => (u.id === updated.id ? updated : u)),
      )
      toast({ title: 'Usuário atualizado', tone: 'success' })
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        tone: 'error',
      })
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(user: UserRow) {
    setLoadingId(user.id)
    try {
      await deleteUser(user.id)
      setUsers((current) => current.filter((u) => u.id !== user.id))
      setConfirmDelete(null)
      toast({ title: 'Usuário removido', tone: 'success' })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Tente novamente.'
      toast({
        title: 'Não foi possível remover',
        description: message,
        tone: 'error',
      })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-normal text-foreground">
            Gerenciar Usuários
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o acesso e as permissões dos colaboradores.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-sm)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Ativo
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const isSelf = user.id === currentUser.id
                  const isLoading = loadingId === user.id

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0 bg-[var(--brand-subtle)] text-[var(--brand-text)]">
                            <AvatarImage
                              src={user.avatar_url ?? undefined}
                              alt={user.name}
                            />
                            <AvatarFallback className="text-xs">
                              {initials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email ?? '—'}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          id={`role-${user.id}`}
                          disabled={isSelf || isLoading}
                          value={user.role}
                          onChange={(e) =>
                            handleUpdate(user.id, {
                              role: e.target.value as 'USER' | 'ADMIN',
                            })
                          }
                          className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant={user.isActive ? 'success' : 'destructive'}
                        >
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Switch
                          id={`active-${user.id}`}
                          checked={user.isActive}
                          disabled={isSelf || isLoading}
                          onCheckedChange={(checked) =>
                            handleUpdate(user.id, { isActive: checked })
                          }
                          aria-label={
                            user.isActive ? 'Desativar usuário' : 'Ativar usuário'
                          }
                        />
                      </td>

                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
                          disabled={isSelf || isLoading}
                          onClick={() => setConfirmDelete(user)}
                          aria-label={`Remover ${user.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </p>
          )}
        </div>

        <p className="mt-2 text-center text-[11px] text-[var(--text-muted)] md:hidden">
          Desenvolvido por Gabriel Souza
        </p>
      </div>

      <Dialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover usuário?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{' '}
              <strong>{confirmDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loadingId === confirmDelete?.id}
              onClick={() => setConfirmDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={loadingId === confirmDelete?.id}
              onClick={() => {
                if (confirmDelete) handleDelete(confirmDelete)
              }}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

export const getServerSideProps: GetServerSideProps<AdminUsersProps> = async ({
  req,
  res,
}) => {
  const activeUser = await getActiveUser(req, res)

  if (!activeUser.user || activeUser.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/agenda',
        permanent: false,
      },
    }
  }

  const { prisma } = await import('@/lib/prisma')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatar_url: true,
      role: true,
      isActive: true,
      created_at: true,
    },
    orderBy: { created_at: 'asc' },
  })

  return {
    props: {
      currentUser: {
        id: activeUser.user.id,
        name: activeUser.user.name,
        email: activeUser.user.email ?? '',
        image: activeUser.user.avatar_url,
        role: activeUser.user.role,
      },
      initialUsers: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email ?? null,
        avatar_url: u.avatar_url ?? null,
        role: u.role,
        isActive: u.isActive,
        created_at: u.created_at.toISOString(),
      })),
    },
  }
}
