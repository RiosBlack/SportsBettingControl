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
import { Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WithdrawDialogProps {
  bankroll: {
    id: string;
    name: string;
    currentBalance: number;
  };
}

export function WithdrawDialog({ bankroll }: WithdrawDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleWithdraw = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }

    if (Number(amount) > bankroll.currentBalance) {
      toast.error("Saldo insuficiente");
      return;
    }

    startTransition(async () => {
      const result = await updateBankrollBalance({
        id: bankroll.id,
        amount: Number(amount),
        operation: "subtract",
        description: description.trim() || undefined,
      });

      if (result.success) {
        toast.success("Saque realizado com sucesso!");
        setOpen(false);
        setAmount("");
        setDescription("");
      } else {
        toast.error(result.error || "Erro ao realizar saque");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Minus className="mr-2 h-4 w-4" />
          Sacar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sacar da Banca</DialogTitle>
          <DialogDescription>
            {bankroll.name} - Saldo atual: R$ {bankroll.currentBalance.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Saque (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={bankroll.currentBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {amount && Number(amount) > 0 && (
              <p className="text-sm text-muted-foreground">
                Saldo após saque: R$ {(bankroll.currentBalance - Number(amount)).toFixed(2)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Saque para uso pessoal"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleWithdraw} disabled={isPending || !amount || Number(amount) <= 0}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar Saque"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

