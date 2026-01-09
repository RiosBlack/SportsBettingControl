"use client";

import { useState, useTransition } from "react";
import { updateBankrollBalance } from "@/lib/actions/bankroll";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DepositDialogProps {
  bankroll: {
    id: string;
    name: string;
    currentBalance: number;
  };
}

export function DepositDialog({ bankroll }: DepositDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDeposit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }

    startTransition(async () => {
      const result = await updateBankrollBalance({
        id: bankroll.id,
        amount: Number(amount),
        operation: "add",
        description: description.trim() || undefined,
      });

      if (result.success) {
        toast.success("Depósito realizado com sucesso!");
        setOpen(false);
        setAmount("");
        setDescription("");
      } else {
        toast.error(result.error || "Erro ao realizar depósito");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex-1">
          <Plus className="mr-2 h-4 w-4" />
          Depositar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Depositar na Banca</DialogTitle>
          <DialogDescription>
            {bankroll.name} - Saldo atual: R$ {bankroll.currentBalance.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Depósito (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {amount && Number(amount) > 0 && (
              <p className="text-sm text-muted-foreground">
                Saldo após depósito: R$ {(bankroll.currentBalance + Number(amount)).toFixed(2)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Depósito inicial"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleDeposit} disabled={isPending || !amount || Number(amount) <= 0}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar Depósito"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

