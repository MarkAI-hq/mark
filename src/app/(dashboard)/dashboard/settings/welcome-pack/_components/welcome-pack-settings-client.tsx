'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Gift, Plus, Trash2, Save } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { updateOrganization } from '@/lib/actions/organizations'

interface WelcomePackConfig {
  is_enabled?:        boolean
  pack_name?:         string
  description?:       string
  cover_image_url?:   string
  contents?:          string[]
  pack_price_usd?:    number
  printful_store_id?: string
  id_card_variant_id?: string
  tshirt_variant_id?: string
}

interface Props {
  organizationId: string
  currentConfig:  WelcomePackConfig
}

export function WelcomePackSettingsClient({ organizationId, currentConfig }: Props) {
  const [saving,    setSaving]    = useState(false)
  const [enabled,   setEnabled]   = useState(currentConfig.is_enabled ?? false)
  const [packName,  setPackName]  = useState(currentConfig.pack_name ?? '')
  const [desc,      setDesc]      = useState(currentConfig.description ?? '')
  const [coverUrl,  setCoverUrl]  = useState(currentConfig.cover_image_url ?? '')
  const [price,     setPrice]     = useState(String(currentConfig.pack_price_usd ?? ''))
  const [contents,  setContents]  = useState<string[]>(currentConfig.contents ?? ['Student ID Card', 'Mirror Intelligence T-Shirt'])

  const addContent  = () => setContents((p) => [...p, ''])
  const removeItem  = (i: number) => setContents((p) => p.filter((_, idx) => idx !== i))
  const updateItem  = (i: number, val: string) => setContents((p) => p.map((v, idx) => idx === i ? val : v))

  async function handleSave() {
    setSaving(true)
    try {
      const config: WelcomePackConfig = {
        ...currentConfig,
        is_enabled:      enabled,
        pack_name:       packName.trim() || undefined,
        description:     desc.trim() || undefined,
        cover_image_url: coverUrl.trim() || undefined,
        pack_price_usd:  price ? parseFloat(price) : currentConfig.pack_price_usd,
        contents:        contents.filter(Boolean),
      }
      const { error } = await updateOrganization(organizationId, { welcome_pack_config: config } as any)
      if (error) throw new Error(error.message)
      toast.success('Welcome pack settings saved')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-gold" />
          <h2 className="text-xl font-semibold">Welcome Pack</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Customise what students see when they order their school welcome pack.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Visibility</CardTitle>
          <CardDescription className="text-xs">
            When disabled, the Welcome Pack option is hidden from students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} id="pack-enabled" />
            <Label htmlFor="pack-enabled" className="text-sm">
              {enabled ? 'Enabled — students can order' : 'Disabled — hidden from students'}
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Display Details</CardTitle>
          <CardDescription className="text-xs">
            These fields appear on the student-facing welcome pack page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pack-name" className="text-sm">Pack Name</Label>
            <Input
              id="pack-name"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="e.g. St. Mary's Student Welcome Pack"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pack-desc" className="text-sm">Description</Label>
            <Textarea
              id="pack-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="A short description shown to students before they order…"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pack-cover" className="text-sm">Cover Image URL</Label>
            <Input
              id="pack-cover"
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…/image.png"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pack-price" className="text-sm">Price (USD)</Label>
            <Input
              id="pack-price"
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="25.00"
              className="max-w-[140px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pack Contents</CardTitle>
          <CardDescription className="text-xs">
            List what&apos;s included — shown as a checklist to students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {contents.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                placeholder="e.g. Student ID Card"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs mt-1"
            onClick={addContent}
          >
            <Plus className="h-3.5 w-3.5" /> Add Item
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gold hover:bg-gold/90 text-gold-foreground">
        <Save className="h-4 w-4" />
        {saving ? 'Saving…' : 'Save Welcome Pack Settings'}
      </Button>
    </div>
  )
}
