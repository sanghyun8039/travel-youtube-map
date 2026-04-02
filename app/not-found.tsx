import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <p className="text-gray-400 mb-8 text-sm">요청하신 페이지를 찾을 수 없거나 분석 데이터가 만료되었습니다.</p>
        <Link 
          href="/" 
          className="bg-[#ef4444] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#dc2626] transition-all inline-block"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  )
}
