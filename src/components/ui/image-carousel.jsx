"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowLeft, ArrowRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

export function ImageCarousel({ images, className }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => emblaApi.off('select', onSelect)
  }, [emblaApi, onSelect])

  if (!images || images.length === 0) return null

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image Carousel */}
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden rounded-lg">
          <div className="flex">
            {images.map((image, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <div 
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <img
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-64 object-contain bg-white rounded-lg hover:opacity-90 transition-opacity border"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <TransformWrapper
                        initialScale={1}
                        minScale={0.3}
                        maxScale={5}
                        centerOnInit={true}
                        limitToBounds={false}
                      >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                          <>
                            <TransformComponent>
                              <img
                                src={image}
                                alt={`Product image ${index + 1} - Full size`}
                                className="max-h-[90vh] max-w-[90vw] object-contain"
                                style={{ maxHeight: '90vh', maxWidth: '90vw' }}
                              />
                            </TransformComponent>
                            
                            {/* Zoom Controls */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 rounded-full p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  zoomOut()
                                }}
                                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                              >
                                <ZoomOut className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  resetTransform()
                                }}
                                className="text-white hover:bg-white/20 h-8 px-3"
                              >
                                Reset
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  zoomIn()
                                }}
                                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                              >
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Close Button */}
                            <DialogClose asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 text-white hover:bg-white/20 h-10 w-10"
                              >
                                <X className="h-6 w-6" />
                              </Button>
                            </DialogClose>
                          </>
                        )}
                      </TransformWrapper>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                scrollPrev()
              }}
              disabled={!canScrollPrev}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                scrollNext()
              }}
              disabled={!canScrollNext}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                emblaApi?.scrollTo(index)
              }}
              className={cn(
                "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                selectedIndex === index 
                  ? "border-primary shadow-md" 
                  : "border-transparent hover:border-gray-300"
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
