'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (e: { target: any }) => void
            onStateChange?: (e: { data: number; target: any }) => void
          }
        }
      ) => any
      PlayerState: { PLAYING: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

export interface VideoPlayerHandle {
  seekTo(seconds: number): void
}

interface Props {
  videoId: string
  onTimeUpdate?: (currentTime: number) => void
}

const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(
  function VideoPlayer({ videoId, onTimeUpdate }, ref) {
    const playerRef = useRef<any>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useImperativeHandle(ref, () => ({
      seekTo(seconds: number) {
        playerRef.current?.seekTo(seconds, true)
      }
    }))

    useEffect(() => {
      function createPlayer() {
        if (!window.YT) return

        playerRef.current = new window.YT.Player('yt-player', {
          videoId,
          playerVars: { 
            rel: 0, 
            modestbranding: 1,
            autoplay: 0
          },
          events: {
            onReady: () => {
              if (onTimeUpdate) {
                intervalRef.current = setInterval(() => {
                  const time = playerRef.current?.getCurrentTime() ?? 0
                  onTimeUpdate(Math.floor(time))
                }, 1000)
              }
            },
          },
        })
      }

      if (window.YT && window.YT.Player) {
        createPlayer()
      } else {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
        window.onYouTubeIframeAPIReady = createPlayer
      }

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        playerRef.current?.destroy()
      }
    }, [videoId, onTimeUpdate])

    return (
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-[#1a1a1a]">
        <div id="yt-player" className="w-full h-full" />
      </div>
    )
  }
)

export default VideoPlayer
