import Head from 'next/head'
import { useState } from 'react'

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  async function handleSubmit() {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: document.getElementById('title').value,
          content: document.getElementById('content').value,
          grade: document.getElementById('grade').value,
          class: document.getElementById('class').value,
          number: document.getElementById('number').value,
          name: document.getElementById('name').value,
        }),
      });

      if (!response.ok) {
        throw new Error('분석 요청 실패');
      }

      const data = await response.json();
      // 기존 분석 결과 표시 로직
      displayAnalysis(data.choices[0].message.content, {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        grade: document.getElementById('grade').value,
        class: document.getElementById('class').value,
        number: document.getElementById('number').value,
        name: document.getElementById('name').value,
      });

    } catch (error) {
      console.error('분석 오류:', error);
      alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div>
      <Head>
        <title>글쓰기 나침반</title>
        <meta name="description" content="초등 글쓰기 능력 향상을 위한 맞춤형 분석 도우미" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>

      <main>
        {/* 여기에 기존 HTML 내용을 넣습니다 */}
      </main>
    </div>
  )
}
