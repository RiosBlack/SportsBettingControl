'use client'

import { useState, useActionState } from 'react'
import { createBankroll } from '@/lib/actions/bankroll'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function CreateBankrollDialog() {
  const [open, setOpen] = useState(false)

  const [state, formAction, pending] = useActionState(
    async (_: any, formData: FormData) => {
      const result = await createBankroll({
        name: formData.get('name') as string,
        initialBalance: Number(formData.get('initialBalance')),
        currency: 'BRL',
      })

      if (result.success) {
        toast.success('Banca criada com sucesso!')
        setOpen(false)
      }

      return result
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Banca
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Banca</DialogTitle>
          <DialogDescription>
            Crie uma nova banca para gerenciar suas apostas
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <div className="space-y-4 py-4">
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome da Banca *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Banca Principal"
                required
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialBalance">Saldo Inicial (R$) *</Label>
              <Input
                id="initialBalance"
                name="initialBalance"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 1000.00"
                required
                disabled={pending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Banca'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

