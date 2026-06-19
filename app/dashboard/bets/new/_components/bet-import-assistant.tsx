'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  analyzeBetScreenshotAction,
  confirmBetFromDraftAction,
  refineBetDraftAction,
} from '@/lib/actions/bet-import'
import { applyImportChoices } from '@/lib/ai/apply-import-choices'
import { formatBetSummary } from '@/lib/ai/format-bet-summary'
import type {
  AiProvider,
  BetDraftWithMarket,
  SerializedBetDraft,
} from '@/lib/ai/bet-draft-schema'
import { BOOKMAKER_OPTIONS } from '@/lib/constants/bookmakers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Bot,
  ImageIcon,
  Loader2,
  Send,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PROVIDER_STORAGE_KEY = 'bet-import-ai-provider'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
}

interface Bankroll {
  id: string
  name: string
  currentBalance: number
  isActive: boolean
}

interface Market {
  id: string
  name: string
}

interface BetImportAssistantProps {
  bankrolls: Bankroll[]
}

type AssistantStatus =
  | 'idle'
  | 'analyzing'
  | 'asking_market'
  | 'selecting_market'
  | 'selecting_bookmaker'
  | 'confirming'
  | 'refining'
  | 'creating'
  | 'cancelled'

function isConfirmMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return ['sim', 's', 'confirmar', 'confirmo', 'ok', 'yes'].includes(normalized)
}

function isCancelMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return ['cancelar', 'cancela', 'cancel', 'parar', 'sair'].includes(normalized)
}

function isYesMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return ['sim', 's', 'yes'].includes(normalized)
}

function isNoMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return ['não', 'nao', 'n', 'no'].includes(normalized)
}

function toDraftWithMarket(draft: SerializedBetDraft): BetDraftWithMarket {
  return {
    ...draft,
    eventDate: new Date(draft.eventDate),
  }
}

export function BetImportAssistant({ bankrolls }: BetImportAssistantProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const defaultBankroll = bankrolls.find((b) => b.isActive) || bankrolls[0]

  const [sheetOpen, setSheetOpen] = useState(false)
  const [status, setStatus] = useState<AssistantStatus>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pendingDraft, setPendingDraft] = useState<SerializedBetDraft | null>(null)
  const [draft, setDraft] = useState<SerializedBetDraft | null>(null)
  const [markets, setMarkets] = useState<Market[]>([])
  const [selectedMarketId, setSelectedMarketId] = useState('')
  const [selectedBookmaker, setSelectedBookmaker] = useState('')
  const [provider, setProvider] = useState<AiProvider>('openai')
  const [bankrollId, setBankrollId] = useState(defaultBankroll?.id ?? '')
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY)
    if (stored === 'openai' || stored === 'gemini') {
      setProvider(stored)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  const handleProviderChange = (value: AiProvider) => {
    setProvider(value)
    localStorage.setItem(PROVIDER_STORAGE_KEY, value)
  }

  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [
      ...prev,
      { ...message, id: `${Date.now()}-${prev.length}` },
    ])
  }, [])

  const resetSession = useCallback(() => {
    setStatus('idle')
    setMessages([])
    setPendingDraft(null)
    setDraft(null)
    setMarkets([])
    setSelectedMarketId('')
    setSelectedBookmaker('')
    setInput('')
  }, [])

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open)
    if (!open && status !== 'creating') {
      resetSession()
    }
  }

  const fetchMarkets = async (): Promise<Market[]> => {
    try {
      const response = await fetch('/api/markets')
      if (!response.ok) return []
      const data = await response.json()
      return data.success && data.data ? data.data : []
    } catch {
      return []
    }
  }

  const proceedToBookmakerSelection = useCallback(
    (aiMarketName?: string) => {
      if (aiMarketName) {
        addMessage({
          role: 'assistant',
          content: `Ok, usarei a sugestão da IA para o mercado: ${aiMarketName}`,
        })
      }

      addMessage({
        role: 'assistant',
        content: 'Qual casa de apostas?',
      })
      setStatus('selecting_bookmaker')
    },
    [addMessage]
  )

  const showSummary = useCallback(
    (
      baseDraft: SerializedBetDraft,
      marketChoice:
        | { type: 'existing'; marketId: string; marketName: string }
        | { type: 'ai' },
      bookmaker: string
    ) => {
      const finalDraft = applyImportChoices(baseDraft, {
        market: marketChoice,
        bookmaker,
      })
      const summary = formatBetSummary(toDraftWithMarket(finalDraft))

      setDraft(finalDraft)
      addMessage({ role: 'assistant', content: summary })
      setStatus('confirming')
    },
    [addMessage]
  )

  const handleUseExistingMarket = useCallback(() => {
    addMessage({ role: 'user', content: 'Sim' })

    if (markets.length === 0) {
      addMessage({
        role: 'assistant',
        content:
          'Não há mercados cadastrados. Vou usar a sugestão da IA para o mercado.',
      })
      proceedToBookmakerSelection(pendingDraft?.marketName)
      return
    }

    addMessage({
      role: 'assistant',
      content: 'Selecione o mercado cadastrado:',
    })
    setStatus('selecting_market')
  }, [addMessage, markets.length, pendingDraft?.marketName, proceedToBookmakerSelection])

  const handleUseAiMarket = useCallback(() => {
    addMessage({ role: 'user', content: 'Não' })
    proceedToBookmakerSelection(pendingDraft?.marketName)
  }, [addMessage, pendingDraft?.marketName, proceedToBookmakerSelection])

  const handleMarketContinue = () => {
    if (!selectedMarketId) {
      toast.error('Selecione um mercado')
      return
    }

    const market = markets.find((item) => item.id === selectedMarketId)
    if (!market || !pendingDraft) {
      toast.error('Mercado inválido')
      return
    }

    addMessage({
      role: 'user',
      content: market.name,
    })

    setDraft(
      applyImportChoices(pendingDraft, {
        market: {
          type: 'existing',
          marketId: market.id,
          marketName: market.name,
        },
        bookmaker: pendingDraft.bookmaker ?? '',
      })
    )

    proceedToBookmakerSelection()
  }

  const handleBookmakerContinue = () => {
    if (!selectedBookmaker) {
      toast.error('Selecione a casa de apostas')
      return
    }

    if (!pendingDraft) {
      toast.error('Rascunho não encontrado')
      return
    }

    addMessage({
      role: 'user',
      content: selectedBookmaker,
    })

    const marketChoice = draft?.marketId
      ? {
          type: 'existing' as const,
          marketId: draft.marketId,
          marketName: draft.marketName,
        }
      : { type: 'ai' as const }

    showSummary(pendingDraft, marketChoice, selectedBookmaker)
  }

  const startMarketQuestion = useCallback(
    (partialDraft: SerializedBetDraft, availableMarkets: Market[]) => {
      setPendingDraft(partialDraft)
      setMarkets(availableMarkets)
      setSelectedMarketId('')
      setSelectedBookmaker('')
      setDraft(null)

      addMessage({
        role: 'assistant',
        content:
          'Analisei o print. Deseja usar um mercado já cadastrado?\n\nResponda "sim" ou "não", ou use os botões abaixo.',
      })
      setStatus('asking_market')
    },
    [addMessage]
  )

  const processImage = async (file: File) => {
    if (!bankrollId) {
      toast.error('Selecione uma banca antes de importar')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Use uma imagem JPEG, PNG ou WebP')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 5MB.')
      return
    }

    setSheetOpen(true)
    setStatus('analyzing')
    setMessages([])

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      addMessage({ role: 'user', content: 'Print da aposta enviado', imageUrl: dataUrl })

      const [result, availableMarkets] = await Promise.all([
        analyzeBetScreenshotAction({
          imageBase64: dataUrl,
          provider,
          bankrollId,
        }),
        fetchMarkets(),
      ])

      if (!result.success) {
        addMessage({
          role: 'assistant',
          content: result.error ?? 'Não foi possível analisar o print.',
        })
        setStatus('idle')
        return
      }

      startMarketQuestion(result.data.draft, availableMarkets)
    }
    reader.onerror = () => {
      toast.error('Erro ao ler a imagem')
      setStatus('idle')
    }
    reader.readAsDataURL(file)
  }

  const handleFileSelect = (files: FileList | null) => {
    const file = files?.[0]
    if (file) {
      void processImage(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleConfirm = async () => {
    if (!draft) return

    setStatus('creating')
    addMessage({ role: 'user', content: 'sim' })

    const result = await confirmBetFromDraftAction({ draft })

    if (!result.success) {
      addMessage({
        role: 'assistant',
        content: result.error ?? 'Erro ao registrar a aposta.',
      })
      setStatus('confirming')
      return
    }

    addMessage({
      role: 'assistant',
      content: 'Aposta registrada com sucesso! Redirecionando...',
    })
    toast.success('Aposta criada com sucesso!')
    setTimeout(() => {
      router.push('/dashboard/bets')
    }, 800)
  }

  const handleCancel = () => {
    addMessage({ role: 'user', content: 'cancelar' })
    addMessage({
      role: 'assistant',
      content: 'Importação cancelada. Você pode enviar um novo print quando quiser.',
    })
    setStatus('cancelled')
    setPendingDraft(null)
    setDraft(null)
  }

  const handleSendMessage = async () => {
    const text = input.trim()
    if (
      !text ||
      status === 'analyzing' ||
      status === 'refining' ||
      status === 'creating'
    ) {
      return
    }

    if (isCancelMessage(text)) {
      setInput('')
      handleCancel()
      return
    }

    if (status === 'asking_market') {
      setInput('')
      if (isYesMessage(text)) {
        handleUseExistingMarket()
        return
      }
      if (isNoMessage(text)) {
        handleUseAiMarket()
        return
      }
      addMessage({
        role: 'assistant',
        content: 'Responda "sim" para usar um mercado cadastrado ou "não" para a sugestão da IA.',
      })
      return
    }

    if (status === 'selecting_market' || status === 'selecting_bookmaker') {
      setInput('')
      addMessage({
        role: 'assistant',
        content: 'Use os seletores acima para continuar, ou digite "cancelar".',
      })
      return
    }

    if (isConfirmMessage(text) && draft && status === 'confirming') {
      setInput('')
      await handleConfirm()
      return
    }

    if (!draft) {
      addMessage({
        role: 'assistant',
        content: 'Envie um print da aposta para começar.',
      })
      setInput('')
      return
    }

    setInput('')
    addMessage({ role: 'user', content: text })
    setStatus('refining')

    const result = await refineBetDraftAction({
      draft,
      message: text,
      provider,
    })

    if (!result.success) {
      addMessage({
        role: 'assistant',
        content: result.error ?? 'Não foi possível aplicar a correção.',
      })
      setStatus('confirming')
      return
    }

    setDraft(result.data.draft)
    addMessage({ role: 'assistant', content: result.data.summary })
    setStatus('confirming')
  }

  const isBusy =
    status === 'analyzing' || status === 'refining' || status === 'creating'

  const isWizardStep =
    status === 'asking_market' ||
    status === 'selecting_market' ||
    status === 'selecting_bookmaker'

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Importar do print</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Envie um screenshot da aposta e o assistente vai interpretar os dados para você confirmar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Banca para importação</Label>
            <Select value={bankrollId} onValueChange={setBankrollId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a banca" />
              </SelectTrigger>
              <SelectContent>
                {bankrolls.map((bankroll) => (
                  <SelectItem key={bankroll.id} value={bankroll.id}>
                    {bankroll.name} (R$ {bankroll.currentBalance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Provedor de IA</Label>
            <Select
              value={provider}
              onValueChange={(v) => handleProviderChange(v as AiProvider)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Arraste o print ou clique para enviar</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG ou WebP — máx. 5MB
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm">
            <ImageIcon className="mr-2 h-4 w-4" />
            Importar do print
          </Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md p-0">
          <SheetHeader className="border-b px-6 py-4 pr-12">
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Assistente de importação
            </SheetTitle>
            <SheetDescription>
              Escolha mercado e casa de apostas, confirme os dados ou digite &quot;cancelar&quot;.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {messages.length === 0 && status === 'analyzing' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando print...
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.imageUrl && (
                      <div className="relative mb-2 h-32 w-full overflow-hidden rounded-md">
                        <Image
                          src={message.imageUrl}
                          alt="Print da aposta"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    {message.content}
                  </div>
                </div>
              ))}

              {status === 'asking_market' && (
                <div className="flex gap-2 pl-9">
                  <div className="w-full max-w-[85%] space-y-3 rounded-lg bg-muted px-3 py-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1"
                        onClick={handleUseExistingMarket}
                      >
                        Sim
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={handleUseAiMarket}
                      >
                        Não
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {status === 'selecting_market' && (
                <div className="flex gap-2 pl-9">
                  <div className="w-full max-w-[85%] space-y-3 rounded-lg bg-muted px-3 py-3">
                    <div className="space-y-2">
                      <Label>Mercado</Label>
                      <Select
                        value={selectedMarketId}
                        onValueChange={setSelectedMarketId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um mercado" />
                        </SelectTrigger>
                        <SelectContent>
                          {markets.map((market) => (
                            <SelectItem key={market.id} value={market.id}>
                              {market.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={handleMarketContinue}
                      disabled={!selectedMarketId}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {status === 'selecting_bookmaker' && (
                <div className="flex gap-2 pl-9">
                  <div className="w-full max-w-[85%] space-y-3 rounded-lg bg-muted px-3 py-3">
                    <div className="space-y-2">
                      <Label>Casa de apostas</Label>
                      <Select
                        value={selectedBookmaker}
                        onValueChange={setSelectedBookmaker}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a casa" />
                        </SelectTrigger>
                        <SelectContent>
                          {BOOKMAKER_OPTIONS.map((bookmaker) => (
                            <SelectItem key={bookmaker.value} value={bookmaker.value}>
                              {bookmaker.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={handleBookmakerContinue}
                      disabled={!selectedBookmaker}
                    >
                      Ver resumo
                    </Button>
                  </div>
                </div>
              )}

              {isBusy && messages.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {status === 'analyzing' && 'Analisando print...'}
                  {status === 'refining' && 'Aplicando correção...'}
                  {status === 'creating' && 'Registrando aposta...'}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4 space-y-3">
            {status === 'confirming' && draft && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  onClick={() => void handleConfirm()}
                  disabled={isBusy}
                >
                  Confirmar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isBusy}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                void handleSendMessage()
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  status === 'cancelled'
                    ? 'Sessão encerrada'
                    : status === 'asking_market'
                      ? 'Digite sim ou não...'
                      : isWizardStep
                        ? 'Use os seletores acima...'
                        : 'Digite sim, correção ou cancelar...'
                }
                disabled={isBusy || status === 'cancelled'}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isBusy || !input.trim() || status === 'cancelled'}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
