"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAW";
  amount: number;
  description: string | null;
  createdAt: Date;
  bankroll?: {
    id: string;
    name: string;
  };
}

interface TransactionsListProps {
  transactions: Transaction[];
  showBankrollName?: boolean;
}

export function TransactionsList({ transactions, showBankrollName = false }: TransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma transação encontrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const isDeposit = transaction.type === "DEPOSIT";
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`p-2 rounded-full ${
                      isDeposit
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    {isDeposit ? (
                      <ArrowDownCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isDeposit ? "default" : "destructive"}
                        className={
                          isDeposit
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }
                      >
                        {isDeposit ? "Depósito" : "Saque"}
                      </Badge>
                      {showBankrollName && transaction.bankroll && (
                        <span className="text-sm text-muted-foreground">
                          {transaction.bankroll.name}
                        </span>
                      )}
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {transaction.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(transaction.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold text-lg ${
                      isDeposit
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isDeposit ? "+" : "-"}R$ {transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

