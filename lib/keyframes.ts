import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

export async function extractKeyframes(videoId: string): Promise<string[]> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'keyframes-'))

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    
    // Get direct stream URL using yt-dlp -g
    const { stdout: streamUrl } = await execAsync(`yt-dlp -g -f "bestvideo[ext=mp4]/best[ext=mp4]/best" "${videoUrl}"`)
    const cleanUrl = streamUrl.trim()

    // Extract frames every 30 seconds directly from stream
    const framesDir = path.join(tmpDir, 'frames')
    await fs.mkdir(framesDir)
    
    // We limit to 20 minutes (1200s) to avoid excessive resource usage
    await execAsync(
      `ffmpeg -i "${cleanUrl}" -t 1200 -vf "fps=1/30" "${path.join(framesDir, 'frame_%04d.jpg')}" -y`
    )

    // Read frames and convert to base64
    const frameFiles = (await fs.readdir(framesDir))
      .filter((f) => f.endsWith('.jpg'))
      .sort()

    const base64Frames = await Promise.all(
      frameFiles.map(async (f) => {
        const data = await fs.readFile(path.join(framesDir, f))
        return data.toString('base64')
      })
    )

    return base64Frames
  } catch (error) {
    console.error('Keyframe extraction failed:', error)
    return []
  } finally {
    // Cleanup temp directory
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}
