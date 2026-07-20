'use client'

import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { LessonProse } from '@/components/lesson/lesson-prose'

interface Props {
  scene: any
  imageUrl?: string
}

export function SceneSlide({ scene, imageUrl }: Props) {
  const { title, content } = scene
  const { text, bullets } = content ?? {}
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [imgFailed, setImgFailed]       = useState(false)

  if (imageUrl) {
    const showImage = !imgFailed

    return (
      <div className="space-y-5">
        {/* Lightbox — outside the grid so it never becomes a grid item */}
        {lightboxOpen && showImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={imageUrl}
              alt={title ?? 'Scene image'}
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Two-column when image loaded; single-column fallback when image fails */}
        <div className={showImage ? 'grid grid-cols-2 gap-5 items-start' : ''}>
          {showImage && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="block w-full rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-gold/40 cursor-zoom-in"
              aria-label="Enlarge image"
            >
              <img
                src={imageUrl}
                alt={title ?? 'Scene image'}
                className="w-full object-contain max-h-64"
                loading="lazy"
                onError={() => setImgFailed(true)}
              />
            </button>
          )}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-gold shrink-0 mt-1" />
              <h2 className={`font-bold leading-tight ${showImage ? 'text-xl' : 'text-2xl'}`}>{title}</h2>
            </div>
            {text && (
              <p className={`leading-relaxed text-foreground ${showImage ? 'text-sm' : 'text-base'}`}><LessonProse text={text} /></p>
            )}
          </div>
        </div>

        {/* Full-width bottom: bullets */}
        {bullets && bullets.length > 0 && (
          <ul className="space-y-2.5 pt-1 border-t border-border">
            {bullets.map((b: string, i: number) => (
              <li key={i} className="flex gap-3 text-base pt-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                <span className="leading-relaxed"><LessonProse text={b} /></span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2">
        <BookOpen className="h-4 w-4 text-gold shrink-0 mt-1" />
        <h2 className="font-bold text-2xl leading-tight">{title}</h2>
      </div>

      {text && (
        <p className="text-base leading-relaxed text-foreground"><LessonProse text={text} /></p>
      )}

      {bullets && bullets.length > 0 && (
        <ul className="space-y-2.5">
          {bullets.map((b: string, i: number) => (
            <li key={i} className="flex gap-3 text-base">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
              <span className="leading-relaxed"><LessonProse text={b} /></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
