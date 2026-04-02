import { execSync } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

export async function extractKeyframes(videoId: string): Promise<string[]> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'keyframes-'))

  try {
    // Download video segments via yt-dlp and extract frames every 30s using ffmpeg
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    const videoPath = path.join(tmpDir, 'video.mp4')

    // Download video (max quality that has video stream)
    execSync(
      `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${videoPath}" "${videoUrl}"`,
      { stdio: 'pipe' }
    )

    // Extract frames every 30 seconds
    const framesDir = path.join(tmpDir, 'frames')
    await fs.mkdir(framesDir)
    execSync(
      `ffmpeg -i "${videoPath}" -vf "fps=1/30" "${path.join(framesDir, 'frame_%04d.jpg')}" -y`,
      { stdio: 'pipe' }
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
  } finally {
    // Cleanup temp directory
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}
