import { execSync } from 'child_process'
import { createReadStream } from 'fs'
import { promises as fs } from 'fs'
import path from 'path'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function downloadAudio(videoId: string, outputDir: string): Promise<string> {
  const outputPath = path.join(outputDir, `${videoId}.mp3`)
  execSync(
    `yt-dlp -x --audio-format mp3 -o "${outputPath}" "https://www.youtube.com/watch?v=${videoId}"`,
    { stdio: 'pipe' }
  )
  return outputPath
}

export async function transcribeWithWhisper(audioPath: string): Promise<string> {
  const response = await openai.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: 'whisper-1',
    language: 'ko',
    response_format: 'text',
  })
  return response
}

export async function cleanupAudio(audioPath: string): Promise<void> {
  try {
    await fs.unlink(audioPath)
  } catch {
    // ignore cleanup errors
  }
}
