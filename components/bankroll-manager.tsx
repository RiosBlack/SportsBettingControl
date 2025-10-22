"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Wallet, TrendingUp, TrendingDown, Plus, Minus, AlertCircle, Target, DollarSign } from "lucide-react"

interface BankrollManagerProps {
  bankroll: number
  initialBankroll: number
  onUpdateBankroll: (newBankroll: number, newInitialBankroll: number) => void
}

export function BankrollManager({ bankroll, initialBankroll, onUpdateBankroll }: BankrollManagerProps) {
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [newInitialBankroll, setNewInitialBankroll] = useState(initialBankroll.toString())
  const [error, setError] = useState("")

  const bankrollChange = bankroll - initialBankroll
  const bankrollChangePercent = initialBankroll > 0 ? (bankrollChange / initialBankroll) * 100 : 0

  const handleDeposit = () => {
    const amount = Number.parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      setError("Valor deve ser um número positivo")
      return
    }

    onUpdateBankroll(bankroll + amount, initialBankroll)
    setDepositAmount("")
    setError("")
  }

  const handleWithdraw = () => {
    const amount = Number.parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      setError("Valor deve ser um número positivo")
      return
    }

    if (amount > bankroll) {
      setError("Valor não pode ser maior que a banca atual")
      return
    }

    onUpdateBankroll(bankroll - amount, initialBankroll)
    setWithdrawAmount("")
    setError("")
  }

  const handleResetBankroll = () => {
    const newInitial = Number.parseFloat(newInitialBankroll)
    if (isNaN(newInitial) || newInitial <= 0) {
      setError("Valor inicial deve ser um número positivo")
      return
    }

    onUpdateBankroll(newInitial, newInitial)
    setError("")
  }

  // Cálculo de níveis de risco
  const getRiskLevel = () => {
    const changePercent = Math.abs(bankrollChangePercent)
    if (changePercent < 10) return { level: "Baixo", color: "text-lime-500" }
    if (changePercent < 25) return { level: "Médio", color: "text-yellow-500" }
    return { level: "Alto", color: "text-red-500" }
  }

  const riskLevel = getRiskLevel()

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lime-500 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Gerenciamento de Banca
          </CardTitle>
          <CardDescription>Controle seus depósitos, saques e acompanhe a evolução da sua banca</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status atual da banca */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-lime-500" />
                <span className="text-sm text-gray-400">Banca Atual</span>
              </div>
              <div className="text-2xl font-bold text-lime-500">R$ {bankroll.toFixed(2)}</div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-400">Banca Inicial</span>
              </div>
              <div className="text-2xl font-bold">R$ {initialBankroll.toFixed(2)}</div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {bankrollChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-lime-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm text-gray-400">Variação</span>
              </div>
              <div className={`text-2xl font-bold ${bankrollChange >= 0 ? "text-lime-500" : "text-red-500"}`}>
                {bankrollChange >= 0 ? "+" : ""}R$ {bankrollChange.toFixed(2)}
              </div>
              <div className={`text-sm ${bankrollChange >= 0 ? "text-lime-500" : "text-red-500"}`}>
                {bankrollChangePercent >= 0 ? "+" : ""}
                {bankrollChangePercent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Progresso visual */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Evolução da Banca</span>
              <span className={`text-sm font-medium ${riskLevel.color}`}>Risco: {riskLevel.level}</span>
            </div>
            <Progress value={Math.max(0, Math.min(200, (bankroll / initialBankroll) * 100))} className="h-3" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>R$ 0</span>
              <span>R$ {initialBankroll.toFixed(2)}</span>
              <span>R$ {(initialBankroll * 2).toFixed(2)}</span>
            </div>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Depósito */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-lime-500 hover:bg-lime-600 text-black font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Depositar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-lime-500">Fazer Depósito</DialogTitle>
                  <DialogDescription>Adicione fundos à sua banca</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {error && (
                    <Alert className="border-red-500 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-500">{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Valor do Depósito (R$)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="bg-gray-800 p-3 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Banca atual:</span>
                      <span>R$ {bankroll.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Após depósito:</span>
                      <span className="text-lime-500 font-semibold">
                        R$ {(bankroll + (Number.parseFloat(depositAmount) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleDeposit} className="bg-lime-500 hover:bg-lime-600 text-black">
                    Confirmar Depósito
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Saque */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                  <Minus className="h-4 w-4 mr-2" />
                  Sacar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-lime-500">Fazer Saque</DialogTitle>
                  <DialogDescription>Retire fundos da sua banca</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {error && (
                    <Alert className="border-red-500 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-500">{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="withdraw">Valor do Saque (R$)</Label>
                    <Input
                      id="withdraw"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={bankroll}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="bg-gray-800 p-3 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Banca atual:</span>
                      <span>R$ {bankroll.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Após saque:</span>
                      <span className="font-semibold">
                        R$ {(bankroll - (Number.parseFloat(withdrawAmount) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleWithdraw} variant="outline" className="border-gray-700">
                    Confirmar Saque
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Reset */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                  <Target className="h-4 w-4 mr-2" />
                  Redefinir
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-red-500">Redefinir Banca</DialogTitle>
                  <DialogDescription>
                    Redefina sua banca inicial. Esta ação irá resetar todo o histórico de evolução.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {error && (
                    <Alert className="border-red-500 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-500">{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="newBankroll">Nova Banca Inicial (R$)</Label>
                    <Input
                      id="newBankroll"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newInitialBankroll}
                      onChange={(e) => setNewInitialBankroll(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <Alert className="border-yellow-500 bg-yellow-500/10">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-500">
                      Atenção: Esta ação irá redefinir sua banca atual e inicial para o valor especificado.
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter>
                  <Button onClick={handleResetBankroll} className="bg-red-500 hover:bg-red-600 text-white">
                    Confirmar Reset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Dicas de gerenciamento */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-lime-500 mb-3">💡 Dicas de Gerenciamento</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Nunca aposte mais de 5% da sua banca em uma única aposta</li>
              <li>• Defina metas de lucro e stop loss antes de começar</li>
              <li>• Mantenha registros detalhados de todas as suas apostas</li>
              <li>• Retire lucros periodicamente para proteger seus ganhos</li>
              <li>• Não persiga perdas aumentando o valor das apostas</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
