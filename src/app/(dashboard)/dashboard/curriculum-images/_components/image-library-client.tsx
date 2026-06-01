'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import {
  Upload, Image as ImageIcon, CheckCircle2, Clock,
  Trash2, Loader2, Archive, Filter, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  CurriculumImage, CurriculumImageStatus,
  listCurriculumImages, activateCurriculumImage, deleteCurriculumImage,
} from '@/lib/actions/curriculum-images'
import { PageHeader } from '@/components/layout/sections/page-header'

const STATUS_CONFIG: Record<CurriculumImageStatus, { label: string; color: string; icon: any }> = {
  active:   { label: 'Active',   color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700',     icon: Clock        },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground',  icon: Archive      },
}

interface ImageLibraryClientProps {
  initialImages: CurriculumImage[]
}

function ImageCard({
  image,
  onActivate,
  onDelete,
  activating,
  deleting,
}: {
  image:      CurriculumImage
  onActivate: (id: string) => void
  onDelete:   (id: string) => void
  activating: boolean
  deleting:   boolean
}) {
  const cfg = STATUS_CONFIG[image.status]
  const Icon = cfg.icon

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden bg-card transition-shadow hover:shadow-md group',
      image.status === 'pending' && 'border-amber-200',
      image.status === 'active'  && 'border-[#e8d5a3]',
    )}>
      {/* Thumbnail */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {image.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/v1/curriculum-images/${image.id}/file`}
            alt={image.description}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          <Badge className={cn('text-[9px] border-none px-1.5 py-0 h-4', cfg.color)}>
            <Icon className="h-2.5 w-2.5 mr-0.5" />{cfg.label}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
          {image.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {image.image_type && (
            <Badge className="text-[9px] border-none bg-[#f5edda] text-[#7a6230] px-1.5 py-0 h-4">
              {image.image_type}
            </Badge>
          )}
          {image.subject && (
            <Badge className="text-[9px] border-none bg-muted text-muted-foreground px-1.5 py-0 h-4">
              {image.subject}
            </Badge>
          )}
        </div>
        {image.topic && (
          <p className="text-[10px] text-muted-foreground truncate">{image.topic}</p>
        )}
      </div>

      {/* Actions */}
      <div className={cn(
        'px-3 pb-3 flex gap-2',
        image.status === 'pending' && 'border-t border-amber-100 pt-2',
      )}>
        {image.status === 'pending' && (
          <Button
            size="sm"
            className="flex-1 gap-1.5 border-0 text-white text-xs h-7"
            style={{ background: '#c9a84c' }}
            disabled={activating}
            onClick={() => onActivate(image.id)}
          >
            {activating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Activate
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="gap-1 text-muted-foreground hover:text-red-600 text-xs h-7"
          disabled={deleting}
          onClick={() => onDelete(image.id)}
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  )
}

function UploadModal({
  open,
  onClose,
  onUploaded,
}: {
  open:       boolean
  onClose:    () => void
  onUploaded: (images: CurriculumImage[]) => void
}) {
  const [files,      setFiles]      = useState<File[]>([])
  const [uploading,  setUploading]  = useState(false)

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/svg+xml': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
  })

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      const res = await fetch('/api/v1/curriculum-images/upload', {
        method:      'POST',
        credentials: 'include',
        body:        formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message ?? 'Upload failed')
      const uploaded: CurriculumImage[] = json?.data ?? json ?? []
      toast.success(`${uploaded.length} image${uploaded.length !== 1 ? 's' : ''} uploaded — pending review`)
      onUploaded(uploaded)
      setFiles([])
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !uploading) { setFiles([]); onClose() } }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Curriculum Images</DialogTitle>
          <DialogDescription>
            Upload JPEG, PNG, SVG, or WebP images. Gemini will auto-tag each image — you can edit tags before activating.
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps({ className: cn(
            'border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors text-center',
            isDragActive ? 'border-[#c9a84c] bg-[#f5edda]/40' : 'border-muted hover:border-[#e8d5a3]',
          )})}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">{isDragActive ? 'Drop images here' : 'Click or drag & drop'}</p>
          <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, SVG, WebP — max 5MB each</p>
        </div>

        {files.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-muted">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { setFiles([]); onClose() }} disabled={uploading}>Cancel</Button>
          <Button
            className="gap-2 border-0 text-white"
            style={{ background: '#c9a84c' }}
            disabled={!files.length || uploading}
            onClick={handleUpload}
          >
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</> : <><Upload className="h-4 w-4" />Upload {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''}` : ''}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ImageLibraryClient({ initialImages }: ImageLibraryClientProps) {
  const [images,     setImages]     = useState<CurriculumImage[]>(initialImages)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [search,     setSearch]     = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)

  const filtered = images.filter(img => {
    const matchSearch = !search || img.description.toLowerCase().includes(search.toLowerCase()) || img.topic?.toLowerCase().includes(search.toLowerCase())
    const matchType   = filterType   === 'all' || img.image_type === filterType
    const matchStatus = filterStatus === 'all' || img.status     === filterStatus
    return matchSearch && matchType && matchStatus
  })

  const imageTypes = [...new Set(images.map(i => i.image_type).filter(Boolean))]

  const handleActivate = async (id: string) => {
    setActivatingId(id)
    const { data, error } = await activateCurriculumImage(id)
    setActivatingId(null)
    if (error) return toast.error(error.message)
    setImages(prev => prev.map(img => img.id === id ? { ...img, status: 'active' } : img))
    toast.success('Image activated — now searchable in redesign suggestions.')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this image? It will no longer appear in search results.')) return
    setDeletingId(id)
    const { error } = await deleteCurriculumImage(id)
    setDeletingId(null)
    if (error) return toast.error(error.message)
    setImages(prev => prev.map(img => img.id === id ? { ...img, status: 'archived' } : img))
    toast.success('Image archived.')
  }

  const handleUploaded = (newImages: CurriculumImage[]) => {
    setImages(prev => [...newImages, ...prev])
  }

  const pendingCount = images.filter(i => i.status === 'pending').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curriculum Image Library"
        description="Upload and manage images used in AI redesign suggestions. Activate images to make them searchable."
        actions={
          <Button
            className="gap-2 border-0 text-white"
            style={{ background: '#c9a84c' }}
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />Upload Images
          </Button>
        }
      />

      {pendingCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/60">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>{pendingCount}</strong> image{pendingCount !== 1 ? 's' : ''} pending review. Activate them to make them searchable.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by topic or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {imageTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: '#f5edda' }}>
            <ImageIcon className="h-8 w-8" style={{ color: '#c9a84c' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground mb-1">No images found</p>
            <p className="text-sm text-muted-foreground">
              {images.length === 0 ? 'Upload your first curriculum image to get started.' : 'Try adjusting your filters.'}
            </p>
          </div>
          {images.length === 0 && (
            <Button
              className="gap-2 border-0 text-white mt-2"
              style={{ background: '#c9a84c' }}
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />Upload Images
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(img => (
            <ImageCard
              key={img.id}
              image={img}
              onActivate={handleActivate}
              onDelete={handleDelete}
              activating={activatingId === img.id}
              deleting={deletingId === img.id}
            />
          ))}
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
    </div>
  )
}
