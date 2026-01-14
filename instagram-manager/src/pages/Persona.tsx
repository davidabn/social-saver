import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePersona, useUpdatePersona } from '@/hooks/useAI'
import { supabase } from '@/lib/supabase'
import { Loader2, Save, BrainCircuit, User, CheckCircle2, Type } from 'lucide-react'
import { FontSelector } from '@/components/carousel/FontSelector'

export function Persona() {
  const { data: persona, isLoading } = usePersona()
  const updatePersona = useUpdatePersona()

  const [formData, setFormData] = useState({
    niche: '',
    targetAudience: '',
    toneOfVoice: '',
    contentPillars: '',
    additionalContext: '',
    // Branding fields
    displayName: '',
    username: '',
    avatarUrl: '',
    isVerified: false,
    // Default fonts
    headlineFont: 'Georgia',
    headlineWeight: 700,
    headlineStyle: 'normal' as 'normal' | 'italic',
    bodyFont: 'Georgia',
    bodyWeight: 400,
    bodyStyle: 'normal' as 'normal' | 'italic'
  })
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  useEffect(() => {
    if (persona) {
      setFormData({
        niche: persona.niche || '',
        targetAudience: persona.targetAudience || '',
        toneOfVoice: persona.toneOfVoice || '',
        contentPillars: persona.contentPillars || '',
        additionalContext: persona.additionalContext || '',
        // Branding fields
        displayName: persona.displayName || '',
        username: persona.username || '',
        avatarUrl: persona.avatarUrl || '',
        isVerified: persona.isVerified || false,
        headlineFont: persona.headlineFont || 'Georgia',
        headlineWeight: persona.headlineWeight || 700,
        headlineStyle: (persona.headlineStyle as 'normal' | 'italic') || 'normal',
        bodyFont: persona.bodyFont || 'Georgia',
        bodyWeight: persona.bodyWeight || 400,
        bodyStyle: (persona.bodyStyle as 'normal' | 'italic') || 'normal'
      })
    }
  }, [persona])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      // Upload para Supabase Storage (bucket: avatars)
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (error) {
        console.error('Erro no upload:', error)
        return
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, avatarUrl: urlData.publicUrl }))
    } catch (error) {
      console.error('Erro no upload:', error)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updatePersona.mutateAsync(formData)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Persona AI</h1>
          <p className="text-muted-foreground">
            Configure sua identidade para que a IA gere conteudos alinhados com voce.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5" />
                Identidade e Nicho
              </CardTitle>
              <CardDescription>
                Quanto mais detalhes voce fornecer, melhor sera a geracao de conteudo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="niche">Nicho de Atuacao</Label>
                <Input
                  id="niche"
                  name="niche"
                  placeholder="Ex: Marketing Digital, Nutricao Esportiva, Programacao..."
                  value={formData.niche}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Qual e o tema principal do seu perfil?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Publico-Alvo</Label>
                <Input
                  id="targetAudience"
                  name="targetAudience"
                  placeholder="Ex: Empreendedores iniciantes, mulheres de 30-45 anos..."
                  value={formData.targetAudience}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Quem voce quer atingir?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toneOfVoice">Tom de Voz</Label>
                <Input
                  id="toneOfVoice"
                  name="toneOfVoice"
                  placeholder="Ex: Descontraido, Profissional, Motivacional, Tecnico..."
                  value={formData.toneOfVoice}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Como voce se comunica?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentPillars">Pilares de Conteudo (Opcional)</Label>
                <Input
                  id="contentPillars"
                  name="contentPillars"
                  placeholder="Ex: Dicas praticas, Bastidores, Estudos de caso..."
                  value={formData.contentPillars}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalContext">Contexto Adicional (Opcional)</Label>
                <textarea
                  id="additionalContext"
                  name="additionalContext"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Qualquer outra informacao relevante sobre voce ou sua marca."
                  value={formData.additionalContext}
                  onChange={handleChange}
                />
              </div>

            </CardContent>
          </Card>

          {/* Card de Branding do Perfil */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Branding do Perfil
              </CardTitle>
              <CardDescription>
                Estas informacoes aparecem no primeiro slide do carrossel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preview e upload da foto */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label>Foto de Perfil</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="flex-1"
                    />
                    {isUploadingAvatar && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </div>
              </div>

              {/* Nome de exibicao */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de Exibicao</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="Ex: David Facundo"
                  value={formData.displayName}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Como seu nome aparece no branding
                </p>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username (sem @)</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                    @
                  </span>
                  <Input
                    id="username"
                    name="username"
                    placeholder="davidabn_"
                    value={formData.username}
                    onChange={handleChange}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              {/* Verificado */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label className="cursor-pointer">Selo de Verificado</Label>
                    <p className="text-xs text-muted-foreground">
                      Exibe checkmark azul ao lado do nome
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                  className="h-5 w-5 rounded border-input accent-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card de Fontes Padrão */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Fontes Padrão
              </CardTitle>
              <CardDescription>
                Escolha as fontes que serão aplicadas por padrão nos seus carrosséis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FontSelector
                  label="Fonte de Título (Headlines)"
                  selectedFont={formData.headlineFont}
                  selectedWeight={formData.headlineWeight}
                  selectedStyle={formData.headlineStyle}
                  onFontChange={(font) => setFormData(prev => ({ ...prev, headlineFont: font }))}
                  onWeightChange={(weight) => setFormData(prev => ({ ...prev, headlineWeight: weight }))}
                  onStyleChange={(style) => setFormData(prev => ({ ...prev, headlineStyle: style }))}
                />
                <FontSelector
                  label="Fonte de Texto (Corpo)"
                  selectedFont={formData.bodyFont}
                  selectedWeight={formData.bodyWeight}
                  selectedStyle={formData.bodyStyle}
                  onFontChange={(font) => setFormData(prev => ({ ...prev, bodyFont: font }))}
                  onWeightChange={(weight) => setFormData(prev => ({ ...prev, bodyWeight: weight }))}
                  onStyleChange={(style) => setFormData(prev => ({ ...prev, bodyStyle: style }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botao Salvar */}
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={updatePersona.isPending} className="gap-2">
              {updatePersona.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Persona
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
