export function validateEnv() {
  const required = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'GOOGLE_MAPS_API_KEY',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'DATABASE_URL',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `실행에 필요한 환경변수가 누락되었습니다: ${missing.join(', ')}. .env 파일을 확인해주세요.`
    )
  }
}
