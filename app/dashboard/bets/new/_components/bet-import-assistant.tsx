'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  analyzeBetScreenshotAction,
  confirmBetFromDraftAction,
  refineBetDraftAction,
} from '@/lib/actions/bet-import'
import type { AiProvider, SerializedBetDraft } from '@/lib/ai/bet-draft-schema'
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

interface BetImportAssistantProps {
  bankrolls: Bankroll[]
}

type AssistantStatus =
  | 'idle'
  | 'analyzing'
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

export function BetImportAssistant({ bankrolls }: BetImportAssistantProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const defaultBankroll = bankrolls.find((b) => b.isActive) || bankrolls[0]

  const [sheetOpen, setSheetOpen] = useState(false)
  const [status, setStatus] = useState<AssistantStatus>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [draft, setDraft] = useState<SerializedBetDraft | null>(null)
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
    setDraft(null)
    setInput('')
  }, [])

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open)
    if (!open && status !== 'creating') {
      resetSession()
    }
  }

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

      const result = await analyzeBetScreenshotAction({
        imageBase64: dataUrl,
        provider,
        bankrollId,
      })

      if (!result.success) {
        addMessage({
          role: 'assistant',
          content: result.error ?? 'Não foi possível analisar o print.',
        })
        setStatus('idle')
        return
      }

      setDraft(result.data.draft)
      addMessage({ role: 'assistant', content: result.data.summary })
      setStatus('confirming')
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
    setDraft(null)
  }

  const handleSendMessage = async () => {
    const text = input.trim()
    if (!text || status === 'analyzing' || status === 'refining' || status === 'creating') {
      return
    }

    if (isCancelMessage(text)) {
      setInput('')
      handleCancel()
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
              Confirme os dados ou descreva correções. Digite &quot;cancelar&quot; para encerrar.
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
