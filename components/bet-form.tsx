"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Bet } from "@/app/page"

interface BetFormProps {
  onAddBet: (bet: Omit<Bet, "id">) => void
  currentBankroll: number
}

export function BetForm({ onAddBet, currentBankroll }: BetFormProps) {
  const [formData, setFormData] = useState({
    bookmaker: "",
    game: "",
    betType: "",
    odd: "",
    amount: "",
    strategy: "",
  })
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validações
    if (!formData.bookmaker || !formData.game || !formData.betType || !formData.odd || !formData.amount) {
      setError("Todos os campos obrigatórios devem ser preenchidos")
      return
    }

    const amount = Number.parseFloat(formData.amount)
    const odd = Number.parseFloat(formData.odd)

    if (isNaN(amount) || amount <= 0) {
      setError("Valor da aposta deve ser um número positivo")
      return
    }

    if (isNaN(odd) || odd <= 1) {
      setError("Odd deve ser um número maior que 1")
      return
    }

    if (amount > currentBankroll) {
      setError("Valor da aposta não pode ser maior que a banca atual")
      return
    }

    // Criar aposta
    const bet: Omit<Bet, "id"> = {
      bookmaker: formData.bookmaker,
      game: formData.game,
      betType: formData.betType,
      odd: odd,
      amount: amount,
      strategy: formData.strategy || "Não especificada",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    }

    onAddBet(bet)

    // Limpar formulário
    setFormData({
      bookmaker: "",
      game: "",
      betType: "",
      odd: "",
      amount: "",
      strategy: "",
    })

    setError("")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const potentialWin =
    formData.amount && formData.odd
      ? (Number.parseFloat(formData.amount) * Number.parseFloat(formData.odd)).toFixed(2)
      : "0.00"

  return (
    <Card className="bg-gray-900 border-gray-800 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lime-500 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nova Aposta
        </CardTitle>
        <CardDescription>Registre uma nova aposta esportiva</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6 border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-500">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bookmaker">Casa de Aposta *</Label>
              <Select value={formData.bookmaker} onValueChange={(value) => handleInputChange("bookmaker", value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Selecione a casa" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="bet365">Bet365</SelectItem>
                  <SelectItem value="betano">Betano</SelectItem>
                  <SelectItem value="sportingbet">Sportingbet</SelectItem>
                  <SelectItem value="betfair">Betfair</SelectItem>
                  <SelectItem value="1xbet">1xBet</SelectItem>
                  <SelectItem value="pixbet">Pixbet</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="betType">Tipo de Aposta *</Label>
              <Select value={formData.betType} onValueChange={(value) => handleInputChange("betType", value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="1x2">1x2 (Resultado Final)</SelectItem>
                  <SelectItem value="over-under">Over/Under</SelectItem>
                  <SelectItem value="ambas-marcam">Ambas Marcam</SelectItem>
                  <SelectItem value="handicap">Handicap</SelectItem>
                  <SelectItem value="dupla-chance">Dupla Chance</SelectItem>
                  <SelectItem value="gols">Total de Gols</SelectItem>
                  <SelectItem value="escanteios">Escanteios</SelectItem>
                  <SelectItem value="cartoes">Cartões</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="game">Jogo *</Label>
            <Input
              id="game"
              value={formData.game}
              onChange={(e) => handleInputChange("game", e.target.value)}
              placeholder="Ex: Flamengo x Palmeiras"
              className="bg-gray-800 border-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odd">Odd *</Label>
              <Input
                id="odd"
                type="number"
                step="0.01"
                min="1.01"
                value={formData.odd}
                onChange={(e) => handleInputChange("odd", e.target.value)}
                placeholder="Ex: 2.50"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor da Aposta (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={currentBankroll}
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="Ex: 100.00"
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Estratégia</Label>
            <Textarea
              id="strategy"
              value={formData.strategy}
              onChange={(e) => handleInputChange("strategy", e.target.value)}
              placeholder="Descreva sua estratégia para esta aposta..."
              className="bg-gray-800 border-gray-700 min-h-[80px]"
            />
          </div>

          {/* Informações da aposta */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-lime-500">Resumo da Aposta</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Valor apostado:</span>
                <span className="ml-2 font-semibold">R$ {formData.amount || "0.00"}</span>
              </div>
              <div>
                <span className="text-gray-400">Retorno potencial:</span>
                <span className="ml-2 font-semibold text-lime-500">R$ {potentialWin}</span>
              </div>
              <div>
                <span className="text-gray-400">Lucro potencial:</span>
                <span className="ml-2 font-semibold text-lime-500">
                  R$ {(Number.parseFloat(potentialWin) - Number.parseFloat(formData.amount || "0")).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Banca após aposta:</span>
                <span className="ml-2 font-semibold">
                  R$ {(currentBankroll - Number.parseFloat(formData.amount || "0")).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full bg-lime-500 hover:bg-lime-600 text-black font-semibold">
            Registrar Aposta
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
