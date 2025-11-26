import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  useWebhooks,
  useCreateWebhook,
  useRegenerateWebhook,
  getWebhookUrl
} from '@/hooks/useWebhook'
import {
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Webhook,
  AlertTriangle,
  Plus
} from 'lucide-react'

export function Settings() {
  const { data: webhooks, isLoading, error } = useWebhooks()
  const createWebhook = useCreateWebhook()
  const regenerateWebhook = useRegenerateWebhook()
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const webhook = webhooks?.[0] // Get first webhook (main one)

  const handleCopyUrl = async () => {
    if (webhook) {
      const url = getWebhookUrl(webhook.token)
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCreateWebhook = async () => {
    await createWebhook.mutateAsync('Default')
  }

  const handleRegenerateToken = async () => {
    if (webhook && confirm('Tem certeza? O token antigo deixara de funcionar imediatamente.')) {
      setRegenerating(true)
      try {
        await regenerateWebhook.mutateAsync(webhook.id)
      } finally {
        setRegenerating(false)
      }
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca'
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Configuracoes</h1>
          <p className="text-muted-foreground">
            Gerencie suas configuracoes e integracoes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook
            </CardTitle>
            <CardDescription>
              Use este link para adicionar conteudo automaticamente via Zapier,
              atalhos iOS/Android, ou qualquer automacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Erro ao carregar webhook
              </div>
            ) : webhook ? (
              <>
                {/* Webhook URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL do Webhook</label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={getWebhookUrl(webhook.token)}
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyUrl}
                      title="Copiar URL"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRegenerateToken}
                    disabled={regenerating}
                    className="gap-2"
                  >
                    {regenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Regenerar Token
                  </Button>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-yellow-800 dark:text-yellow-200">
                    Mantenha esta URL em segredo. Qualquer pessoa com ela pode
                    adicionar conteudo a sua conta.
                  </p>
                </div>

                {/* Last used */}
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  <span className="font-medium">Ultimo uso:</span>{' '}
                  {formatDate(webhook.last_used_at)}
                </div>

                {/* Instructions */}
                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-medium">Como usar</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      Envie uma requisicao POST para a URL do webhook com o link
                      do Instagram no corpo:
                    </p>
                    <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
{`curl -X POST "${getWebhookUrl(webhook.token)}" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://instagram.com/reel/ABC123"}'`}
                    </pre>
                    <p>
                      Tambem aceita texto puro ou form data, ideal para atalhos do celular.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">
                  Voce ainda nao tem um webhook configurado.
                </p>
                <Button
                  onClick={handleCreateWebhook}
                  disabled={createWebhook.isPending}
                  className="gap-2"
                >
                  {createWebhook.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Criar Webhook
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
