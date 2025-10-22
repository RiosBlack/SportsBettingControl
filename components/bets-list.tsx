"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock, Trophy, Target } from "lucide-react"
import type { Bet } from "@/app/page"

interface BetsListProps {
  bets: Bet[]
  onUpdateBet: (id: string, status: "won" | "lost", result?: number) => void
}

export function BetsList({ bets, onUpdateBet }: BetsListProps) {
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null)
  const [resultValue, setResultValue] = useState("")

  const filteredBets = bets
    .filter((bet) => {
      const matchesFilter = filter === "all" || bet.status === filter
      const matchesSearch =
        bet.game.toLowerCase().includes(search.toLowerCase()) ||
        bet.bookmaker.toLowerCase().includes(search.toLowerCase()) ||
        bet.betType.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleUpdateBet = (status: "won" | "lost") => {
    if (!selectedBet) return

    let result = 0
    if (status === "won") {
      result = Number.parseFloat(resultValue) || selectedBet.amount * selectedBet.odd
    }

    onUpdateBet(selectedBet.id, status, result)
    setSelectedBet(null)
    setResultValue("")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <CheckCircle className="h-4 w-4 text-lime-500" />
      case "lost":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "won":
        return <Badge className="bg-lime-500/20 text-lime-500 border-lime-500">Ganha</Badge>
      case "lost":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500">Perdida</Badge>
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">Pendente</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lime-500 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Minhas Apostas
          </CardTitle>
          <CardDescription>Gerencie e acompanhe todas as suas apostas</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por jogo, casa de aposta ou tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="won">Ganhas</SelectItem>
                <SelectItem value="lost">Perdidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de apostas */}
          {filteredBets.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma aposta encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Jogo</TableHead>
                    <TableHead>Casa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Odd</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Retorno</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBets.map((bet) => (
                    <TableRow key={bet.id} className="border-gray-800">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(bet.status)}
                          {getStatusBadge(bet.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">{new Date(bet.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{bet.game}</TableCell>
                      <TableCell className="text-gray-400">{bet.bookmaker}</TableCell>
                      <TableCell className="text-gray-400">{bet.betType}</TableCell>
                      <TableCell className="font-semibold">{bet.odd.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">R$ {bet.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {bet.status === "won" && bet.result ? (
                          <span className="text-lime-500 font-semibold">R$ {bet.result.toFixed(2)}</span>
                        ) : bet.status === "lost" ? (
                          <span className="text-red-500 font-semibold">R$ 0.00</span>
                        ) : (
                          <span className="text-gray-400">R$ {(bet.amount * bet.odd).toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {bet.status === "pending" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-lime-500 hover:bg-lime-600 text-black"
                                onClick={() => {
                                  setSelectedBet(bet)
                                  setResultValue((bet.amount * bet.odd).toString())
                                }}
                              >
                                Finalizar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-800">
                              <DialogHeader>
                                <DialogTitle className="text-lime-500">Finalizar Aposta</DialogTitle>
                                <DialogDescription>Defina o resultado da aposta: {bet.game}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-400">Valor apostado:</span>
                                    <span className="ml-2 font-semibold">R$ {bet.amount.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Odd:</span>
                                    <span className="ml-2 font-semibold">{bet.odd.toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="result">Valor do retorno (se ganhou)</Label>
                                  <Input
                                    id="result"
                                    type="number"
                                    step="0.01"
                                    value={resultValue}
                                    onChange={(e) => setResultValue(e.target.value)}
                                    className="bg-gray-800 border-gray-700"
                                    placeholder="Valor recebido"
                                  />
                                </div>
                              </div>
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleUpdateBet("lost")}
                                  className="bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  Perdeu
                                </Button>
                                <Button
                                  onClick={() => handleUpdateBet("won")}
                                  className="bg-lime-500 hover:bg-lime-600 text-black"
                                >
                                  Ganhou
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
