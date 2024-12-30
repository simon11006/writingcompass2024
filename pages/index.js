import { useState, useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css'; 

// 상수 정의
const CATEGORIES = {
  '논리성': '주장과 근거의 타당성, 논리적 흐름',
  '구조성': '글의 구조와 문단 간 연결성',
  '표현성': '어휘와 문장의 표현, 맞춤법',
  '완성도': '전체적인 글의 완성도와 통일성'
};

const GRADE_STYLES = {
  'A+': 'bg-blue-100 text-blue-800 border-2 border-blue-300',
  'A': 'bg-blue-100 text-blue-800 border-2 border-blue-300',
  'B+': 'bg-green-100 text-green-800 border-2 border-green-300',
  'B': 'bg-green-100 text-green-800 border-2 border-green-300',
  'C+': 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300',
  'C': 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300',
  'D+': 'bg-orange-100 text-orange-800 border-2 border-orange-300',
  'D': 'bg-orange-100 text-orange-800 border-2 border-orange-300',
  'F': 'bg-red-100 text-red-800 border-2 border-red-300'
};

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 유틸리티 함수들
  const countCharacters = (text) => {
    if (!text) return 0;
    return text.replace(/\n/g, '').length;
  };

  const getGradeStyle = (grade) => {
    return GRADE_STYLES[grade] || 'bg-gray-100 text-gray-800 border-2 border-gray-300';
  };

  const countSentences = (text) => {
    if (!text) return 0;
    const matches = text.match(/[^.!?]+[.!?](?:[\s"']|$)/g) || [];
    return matches.filter(sentence => 
      sentence.trim().replace(/[.!?]/g, '').trim().length > 0
    ).length;
  };
  // 문단 분석 업데이트 함수
  const updateParagraphAnalysis = (paragraphs) => {
    const paragraphAnalysis = document.querySelector('.paragraph-analysis');
    if (!paragraphAnalysis) return;

    const count = paragraphs.length;
    let message = '';

    switch(count) {
      case 0:
        message = '글을 작성해주세요';
        break;
      case 1:
        message = '첫 문단을 작성했네요. 새로운 내용이 시작되면 엔터키를 눌러주세요.';
        break;
      case 2:
        message = '좋아요! 두 개의 문단으로 내용을 나누었어요. 더 나눌수도 있나요?';
        break;
      case 3:
        message = '문단을 적절히 나누고 있어요. 각 문단의 내용이 서로 달라야 해요.';
        break;
      case 4:
      case 5:
        message = '문단 구분이 잘 되어있어요. 각 문단이 자연스럽게 이어지나요?';
        break;
      default:
        message = '문단이 너무 많아요. 비슷한 내용은 한 문단으로 모아보세요.';
    }

    paragraphAnalysis.innerHTML = `<span>${message}</span>`;
  };

  // 점수 계산 함수
  const calculateTotalScore = (scores, titleData) => {
    const gradePoints = {
      'A+': 100, 'A': 90,
      'B+': 80, 'B': 70,
      'C+': 60, 'C': 50,
      'D+': 40, 'D': 35,
      'F': 30
    };

    const weights = {
      '논리성': 0.30,
      '구조성': 0.25,
      '표현성': 0.20,
      '완성도': 0.15,
      '제목': 0.10
    };

    let totalScore = 0;
    
    Object.entries(scores).forEach(([category, data]) => {
      const gradePoint = gradePoints[data.grade] || 50;
      totalScore += gradePoint * weights[category];
    });

    if (titleData?.grade) {
      totalScore += (gradePoints[titleData.grade] || 50) * weights['제목'];
    }

    return Math.ceil(totalScore);
  };

  // 분석 데이터 추출 함수
  const extractCategoryData = (analysis, category) => {
    try {
      const categoryRegex = new RegExp(`\\[${category}\\]([^]*?)(?=\\[|#|$)`);
      const categoryText = analysis.match(categoryRegex)?.[1] || '';

      return {
        grade: categoryText.match(/등급:\s*([A-F][+]?)/)?.[1] || 'F',
        evaluation: categoryText.match(/평가:([^]*?)(?=잘된 점:|$)/)?.[1]?.trim() || '',
        goodPoints: categoryText.match(/잘된 점:\s*([\s\S]*?)(?=개선점:|$)/)?.[1]?.trim() || '',
        improvements: categoryText.match(/개선점:\s*([\s\S]*?)(?=(?:\[|\n#|$))/)?.[1]?.trim() || ''
      };
    } catch (error) {
      console.error(`Error extracting data for ${category}:`, error);
      return {
        grade: 'F',
        evaluation: '',
        goodPoints: '',
        improvements: ''
      };
    }
  };

  // 레이더 차트 생성 함수
  const createRadarChart = (categories) => {
    const size = 550;
    const center = size / 2;
    const radius = size * 0.35;
    const pointCount = categories.length;
    const angleStep = (Math.PI * 2) / pointCount;

    const convertGradeToValue = (grade) => {
      const gradeValues = {
        'A+': 1.0, 'A': 0.9,
        'B+': 0.8, 'B': 0.7,
        'C+': 0.6, 'C': 0.5,
        'D+': 0.4, 'D': 0.3,
        'F': 0.2
      };
      return gradeValues[grade] || 0.2;
    };

    const points = categories.map((cat, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const value = convertGradeToValue(cat.grade);
      return {
        x: center + radius * value * Math.cos(angle),
        y: center + radius * value * Math.sin(angle)
      };
    });

    const pathData = points.map((p, i) => 
      (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`
    ).join(' ') + 'Z';

    return `
      <svg viewBox="0 0 ${size} ${size}" class="radar-chart" style="overflow: visible;">
        ${[0.2, 0.4, 0.6, 0.8, 1].map(r => `
          <circle 
            cx="${center}" 
            cy="${center}" 
            r="${radius * r}" 
            fill="none" 
            stroke="#e5e7eb" 
            stroke-width="2"
          />
        `).join('')}

        ${categories.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return `
            <line 
              x1="${center}" 
              y1="${center}" 
              x2="${center + radius * Math.cos(angle)}" 
              y2="${center + radius * Math.sin(angle)}" 
              stroke="#e5e7eb" 
              stroke-width="2"
            />
          `;
        }).join('')}

        <path 
          d="${pathData}" 
          fill="rgba(147, 197, 253, 0.3)" 
          stroke="#3b82f6" 
          stroke-width="3"
        />

        ${categories.map((cat, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + (radius + 50) * Math.cos(angle);
          const y = center + (radius + 50) * Math.sin(angle);
          return `
            <text 
              x="${x}" 
              y="${y}" 
              text-anchor="middle" 
              dominant-baseline="middle"
              class="text-lg font-medium"
              style="font-size: 22px; font-weight: 600;"
            >${cat.name}</text>
          `;
        }).join('')}
      </svg>
    `;
  };
  // 문단 분석 함수들
  const extractParagraphs = (analysis) => {
    const paragraphs = [];
    const paragraphRegex = /\[(\d+)문단\]([\s\S]+?)(?=\[\d+문단\]|#|$)/g;
    const matches = Array.from(analysis.matchAll(paragraphRegex));

    for (const match of matches) {
      try {
        const paragraphNum = match[1];
        const content = match[2];

        const originalMatch = content.match(/원문:\s*([\s\S]*?)(?=\s*분석:)/);
        const analysisMatch = content.match(/분석:\s*([\s\S]*?)(?=\s*잘된 점:)/);
        const goodPointsMatch = content.match(/잘된 점:\s*([\s\S]*?)(?=\s*개선점:)/);
        const improvementsMatch = content.match(/개선점:\s*([\s\S]*?)(?=\s*표현 개선 제안:|맞춤법 교정:|$)/);
        const suggestionsMatch = content.match(/표현 개선 제안:\s*([\s\S]*?)(?=맞춤법 교정:|$)/);
        const spellingMatch = content.match(/맞춤법 교정:\s*([\s\S]*?)$/);

        let originalContent = '';
        if (originalMatch) {
          originalContent = originalMatch[1]
            .replace(/^[\s"]+|[\s"]+$/g, '')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .join('\n');
        }

        const suggestions = suggestionsMatch
          ? suggestionsMatch[1]
            .split(/\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.match(/^[\s*•-]*$/))
            .map(line => line.replace(/^[*•-]\s*/, ''))
          : [];

        const spellingCorrections = spellingMatch
          ? spellingMatch[1]
            .split(/\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
              const [original, fixed, ...rest] = line.split(/\s*->\s*|\s*,\s*/);
              return {
                original: original?.replace(/^["']|["']$/g, ''),
                fixed: fixed?.replace(/^["']|["']$/g, ''),
                reason: rest.join(', ').trim()
              };
            })
            .filter(correction => correction.original && correction.fixed)
          : [];

        paragraphs.push({
          index: paragraphNum,
          content: originalContent,
          analysis: analysisMatch?.[1]?.trim() || '',
          goodPoints: goodPointsMatch?.[1]?.trim() || '',
          improvements: improvementsMatch?.[1]?.trim() || '',
          suggestions: suggestions,
          spellingCorrections: spellingCorrections
        });
      } catch (error) {
        console.error(`문단 ${match[1]} 처리 중 오류:`, error);
      }
    }

    return paragraphs.sort((a, b) => parseInt(a.index) - parseInt(b.index));
  };

  const formatStructureContent = (content, type = 'default') => {
    if (!content || content === 'undefined') {
      return `
        <div class="content-section">
          <p class="text-gray-500">아직 분석되지 않았습니다.</p>
        </div>
      `;
    }

    try {
      switch (type) {
        case 'current':
          return `
            <div class="content-section">
              ${content.split('\n')
                .filter(line => line.trim())
                .map(line => `<p class="content-line">${line}</p>`)
                .join('')}
            </div>
          `;

        case 'improved':
          return `
            <div class="content-section">
              ${content.split('\n')
                .filter(line => line.trim())
                .map(line => `<p class="content-line">${line}</p>`)
                .join('')}
            </div>
          `;

        case 'suggestions':
          return `
            <div class="content-section">
              ${content.split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^[*•-]\s*/, ''))
                .map(line => `<p class="content-line">• ${line}</p>`)
                .join('')}
            </div>
          `;

        default:
          return `
            <div class="content-section">
              <p class="content-line">${content}</p>
            </div>
          `;
      }
    } catch (error) {
      console.error('문단 구조화 오류:', error);
      return '<div class="text-red-500">문단 구조를 표시하는 중 오류가 발생했습니다.</div>';
    }
  };

  // Tip Modal 관련 함수들
  const showTipModal = () => {
    const modal = document.getElementById('tipModal');
    const overlay = document.getElementById('modalOverlay');
    if (modal && overlay) {
      modal.classList.remove('hidden');
      overlay.classList.remove('hidden');
    }
  };

  const closeTipModal = () => {
    const modal = document.getElementById('tipModal');
    const overlay = document.getElementById('modalOverlay');
    if (modal && overlay) {
      modal.classList.add('hidden');
      overlay.classList.add('hidden');
    }
  };
  // 분석 실행 함수
  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    const formData = {
      title: document.getElementById('title').value.trim(),
      content: document.getElementById('content').value.trim(),
      grade: document.getElementById('grade').value.trim(),
      class: document.getElementById('class').value.trim(),
      number: document.getElementById('number').value.trim(),
      name: document.getElementById('name').value.trim()
    };

    // 필수 입력값 검증
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 모두 입력해주세요.');
      setIsAnalyzing(false);
      return;
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('분석 요청 실패');
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        displayAnalysis(data.choices[0].message.content, formData);
      } else {
        throw new Error('응답 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('분석 오류:', error);
      alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 문단 제안 기능
  const getParagraphSuggestions = async () => {
    const content = document.getElementById('content').value.trim();
    if (!content) {
      alert('글을 작성한 후에 문단 제안을 받아보세요.');
      return;
    }

    const suggestionButton = document.querySelector('.suggestion-button');
    suggestionButton.disabled = true;
    suggestionButton.innerHTML = '<span>제안받는 중...</span>';

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          requestType: 'paragraphSuggestion'
        })
      });

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const suggestionsContent = data.choices[0].message.content;
        try {
          const suggestionData = JSON.parse(suggestionsContent);
          displayParagraphSplits(suggestionData.paragraphs);
        } catch (parseError) {
          console.error('JSON 파싱 오류:', parseError);
          alert('응답을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      }
    } catch (error) {
      console.error('문단 제안 오류:', error);
      alert('문단 제안 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      suggestionButton.disabled = false;
      suggestionButton.innerHTML = '<span>문단 제안하기</span><span class="button-icon">💡</span>';
    }
  };

  // 문단 분할 표시 함수
  const displayParagraphSplits = (paragraphs) => {
    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = '';

    paragraphs.forEach((para, index) => {
      const paraElement = document.createElement('div');
      paraElement.className = 'paragraph-split';
      paraElement.innerHTML = `
        <div class="paragraph-text"><strong>${index + 1}번째 문단:</strong> ${para.text}</div>
        <div class="paragraph-reason"><em>이렇게 나눈 이유:</em> ${para.reason}</div>
      `;
      previewContent.appendChild(paraElement);
    });

    previewContent.classList.remove('hidden');
    document.querySelector('.preview-button').innerHTML = 
      '<span>문단 미리보기 닫기</span><span class="button-icon">👁️</span>';
  };

  // 문단 미리보기 토글
  const toggleParagraphPreview = () => {
    const previewContent = document.getElementById('previewContent');
    const previewButton = document.querySelector('.preview-button');

    if (previewContent.classList.contains('hidden')) {
      const content = document.getElementById('content').value;
      if (!content.trim()) {
        alert('미리보기할 내용을 먼저 작성해주세요.');
        return;
      }

      const paragraphs = content.split('\n').filter(p => p.trim());
      let previewHTML = '<div class="preview-paragraphs">';
      paragraphs.forEach((paragraph, index) => {
        previewHTML += `
          <div class="preview-paragraph">
            <div class="preview-paragraph-header">
              ${index + 1}번째 문단
            </div>
            <div class="preview-paragraph-content">
              ${paragraph}
            </div>
          </div>
        `;
      });
      previewHTML += '</div>';

      previewContent.innerHTML = previewHTML;
      previewContent.classList.remove('hidden');
      previewButton.innerHTML = '<span>미리보기 닫기</span><span class="button-icon">✕</span>';
    } else {
      previewContent.classList.add('hidden');
      previewButton.innerHTML = '<span>문단 미리보기</span><span class="button-icon">👁️</span>';
    }
  };
  // 분석 결과 표시 함수
  const displayAnalysis = (analysisContent, essayData) => {
    const result = document.getElementById('result');
    result.innerHTML = '';

    try {
      // 제목 분석 데이터 추출
      const titleSection = analysisContent.match(/# 제목 분석\n([\s\S]+?)(?=\n#|$)/)?.[1] || '';
      const titleData = {
        current: essayData.title || '',
        grade: titleSection.match(/등급:\s*([A-F][+]?)/)?.[1] || 'C',
        analysis: titleSection.match(/분석:([\s\S]*?)(?=\n제안:|$)/)?.[1]?.trim() || '',
        suggestions: titleSection.match(/제안:([\s\S]*?)$/)?.[1]?.split(/\d+\.\s*/)
          .filter(s => s.trim())
          .map(s => s.trim()) || []
      };

      // 원문 텍스트 가져오기
      const originalText = essayData.content;
      const hasVisibleBreaks = originalText.includes('\n');

      // 문단 분석 데이터 추출
      const extractedParagraphs = extractParagraphs(analysisContent);
      const paragraphCount = hasVisibleBreaks ? extractedParagraphs.length : 1;

      // scores 객체 생성
      const scores = {};
      Object.keys(CATEGORIES).forEach(category => {
        scores[category] = extractCategoryData(analysisContent, category);
      });

      // 점수 검증 및 계산
      const validatedScores = validateScores(scores, paragraphCount);
      const score = calculateTotalScore(validatedScores, titleData);
      const totalEvaluation = analysisContent.match(/총평:\s*([^\n]+)/)?.[1] || '';

      // 문단 구성 제안 데이터 추출
      const structureSection = analysisContent.match(/# 문단 구성 제안\n([\s\S]+?)(?=\n#|$)/)?.[1] || '';
      const currentStructure = structureSection.match(/현재 문단 구조:([\s\S]+?)(?=문단 구성 개선안:|$)/i)?.[1]?.trim() || '';
      const improvedStructure = structureSection.match(/문단 구성 개선안:([\s\S]+?)(?=구체적 실행 방안:|$)/i)?.[1]?.trim() || '';
      const structureSuggestions = structureSection.match(/구체적 실행 방안:([\s\S]*?)$/i)?.[1]?.trim() || '';

      // 통계 데이터 계산
      const statistics = {
        charCount: countCharacters(essayData.content),
        sentenceCount: countSentences(essayData.content),
        paragraphCount: paragraphCount,
        avgSentenceLength: Math.round(countCharacters(essayData.content) / countSentences(essayData.content)) || 0
      };

      // 분석 결과 HTML 렌더링
      result.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-6 print-section">
          ${!hasVisibleBreaks && originalText.length > 200 ? `
            <div class="paragraph-alert mb-6">
              <div class="alert-title">
                <span class="alert-icon">💡</span>
                문단 나누기가 필요해요!
              </div>
              <div class="alert-content">
                <p style="text-indent: 1.5em;">긴 글을 한 번에 쭉 쓰면 읽기가 어려워요. 다음과 같이 문단을 나누면 더 좋은 글이 될 거예요:</p>
                <ul class="mt-2">
                  <li>✍️ 비슷한 내용끼리 모아서 한 문단으로 만들기</li>
                  <li>✍️ 한 문단은 3~5개의 문장으로 구성하기</li>
                  <li>✍️ 새로운 내용이 시작되면 한 줄 띄우기</li>
                </ul>
              </div>
            </div>
          ` : ''}

          <!-- 분석 결과 헤더 -->
          <div class="result-title-container">
            <div class="result-title">글쓰기 평가 결과</div>
            <div class="result-date">${new Date().toLocaleDateString('ko-KR')} 분석</div>
          </div>

          <!-- 학생 정보 -->
          <div class="student-info-grid">
            <div class="student-info-item">학년: ${essayData.grade}</div>
            <div class="student-info-item">반: ${essayData.class}</div>
            <div class="student-info-item">번호: ${essayData.number}</div>
            <div class="student-info-item">이름: ${essayData.name}</div>
          </div>

          <!-- 점수와 총평 섹션 -->
          <div class="flex flex-col gap-8 p-6">
            <div class="flex items-center gap-6">
              <div class="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center">
                <span class="text-blue-600 text-4xl font-bold">${score}점</span>
              </div>
              <div class="h-20 w-px bg-gray-200 mx-4"></div>
              <p class="text-gray-700 text-lg flex-1">${totalEvaluation}</p>
            </div>

            <!-- 레이더 차트와 평가 영역 -->
            <div class="flex gap-12">
              <div class="w-[400px] flex-shrink-0">
                ${createRadarChart(Object.entries(scores).map(([name, data]) => ({
                  name,
                  grade: data.grade
                })))}
              </div>

              <div class="flex flex-col flex-1 gap-6">
                <!-- 평가 항목 그리드 -->
                <div class="grid grid-cols-2 gap-4">
                  ${Object.entries(CATEGORIES).map(([category, description]) => {
                    const data = scores[category];
                    return `
                      <div class="bg-gray-50 p-4 rounded-lg flex items-center justify-between gap-4">
                        <div>
                          <div class="text-lg font-medium text-gray-900">${category}</div>
                          <div class="text-sm text-gray-500">${description}</div>
                        </div>
                        <div class="grade-badge ${getGradeStyle(data.grade)}">
                          ${data.grade}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>

                <!-- 통계 정보 -->
                <div class="grid grid-cols-4 gap-3">
                  <div class="bg-gray-50 p-6 rounded-lg text-center h-28 flex flex-col justify-center">
                    <div class="text-base text-gray-500">총 글자 수</div>
                    <div class="text-2xl font-bold text-blue-600">${statistics.charCount}자</div>
                  </div>
                  <div class="bg-gray-50 p-6 rounded-lg text-center h-28 flex flex-col justify-center">
                    <div class="text-base text-gray-500">총 문장 수</div>
                    <div class="text-2xl font-bold text-blue-600">${statistics.sentenceCount}개</div>
                  </div>
                  <div class="bg-gray-50 p-6 rounded-lg text-center h-28 flex flex-col justify-center">
                    <div class="text-base text-gray-500">총 문단 수</div>
                    <div class="text-2xl font-bold text-blue-600">${statistics.paragraphCount}개</div>
                  </div>
                  <div class="bg-gray-50 p-6 rounded-lg text-center h-28 flex flex-col justify-center">
                    <div class="text-base text-gray-500">평균 문장 길이</div>
                    <div class="text-2xl font-bold text-blue-600">${statistics.avgSentenceLength}자</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
<!-- 영역별 분석 -->
          <h2 class="section-title">영역별 분석</h2>
          <div class="category-grid">
            ${Object.entries(scores).map(([category, data]) => `
              <div class="analysis-category-section">
                <div class="category-header">
                  <div class="category-title-wrap">
                    <div class="category-name">${category}</div>
                    <div class="category-subtitle">${CATEGORIES[category]}</div>
                  </div>
                  <div class="category-grade ${getGradeStyle(data.grade)}">
                    ${data.grade}
                  </div>
                </div>
                <div class="feedback-grid">
                  <div class="feedback-box analysis">
                    <div class="feedback-title analysis">평가</div>
                    <div class="feedback-content">${data.evaluation}</div>
                  </div>
                  <div class="feedback-box good-points">
                    <div class="feedback-title good-points">잘된 점</div>
                    <div class="feedback-content">${data.goodPoints}</div>
                  </div>
                  <div class="feedback-box improvements">
                    <div class="feedback-title improvements">개선점</div>
                    <div class="feedback-content">${data.improvements}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- 제목 분석 섹션 -->
          <div class="title-analysis">
            <div class="section-header flex justify-between items-center">
              <div style="display: flex; align-items: center; gap: 2rem;">
                <h2 class="section-title">제목 분석</h2>
                <div class="category-grade ${getGradeStyle(titleData.grade)}">
                  ${titleData.grade}
                </div>
              </div>
            </div>
            <div class="title-analysis-content">
              <div class="title-analysis-item">
                <div class="title-analysis-label">현재 제목</div>
                <div class="text-gray-700">${titleData.current}</div>
              </div>
              <div class="title-analysis-item">
                <div class="title-analysis-label">분석</div>
                <div class="text-gray-700 whitespace-pre-line">${titleData.analysis}</div>
              </div>
              <div class="title-analysis-item">
                <div class="title-analysis-label">제안</div>
                <div class="text-gray-700">${titleData.suggestions.join('\n')}</div>
              </div>
            </div>
          </div>

          <!-- 문단별 상세 분석 -->
          <h2 class="section-title">문단별 상세 분석</h2>
          <div class="paragraphs-container">
            ${extractedParagraphs.map(paragraph => `
              <div class="paragraph-section mt-8">
                <div class="paragraph-header">
                  <h4 class="paragraph-title">${paragraph.index}번째 문단</h4>
                  <button class="tip-button" type="button" onclick="showTipModal()">문단 구분 팁</button>
                </div>
                <div class="original-text">${paragraph.content}</div>
                <div class="paragraph-analysis-section">
                  <div class="analysis-box analysis">
                    <div class="analysis-box-header">분석</div>
                    <div class="analysis-box-content">${paragraph.analysis}</div>
                  </div>
                  <div class="analysis-box good-points">
                    <div class="analysis-box-header">잘된 점</div>
                    <div class="analysis-box-content">${paragraph.goodPoints}</div>
                  </div>
                  <div class="analysis-box improvements">
                    <div class="analysis-box-header">개선점</div>
                    <div class="analysis-box-content">${paragraph.improvements}</div>
                  </div>
                </div>
                ${paragraph.suggestions.length > 0 ? `
                  <div class="suggestion-box">
                    <div class="suggestion-title">표현 개선 제안</div>
                    <ul class="suggestion-list">
                      ${paragraph.suggestions.map(suggestion => `
                        <li class="suggestion-item">${suggestion}</li>
                      `).join('')}
                    </ul>
                  </div>
                  <div class="suggestion-box spelling">
                    <div class="suggestion-title">맞춤법 교정</div>
                    <ul class="suggestion-list">
                      ${paragraph.spellingCorrections?.map(correction => `
                        <li class="suggestion-item">
                          <span class="correction-original">${correction.original}</span> →
                          <span class="correction-fixed">${correction.fixed}</span>
                          <div class="correction-reason">${correction.reason}</div>
                        </li>
                      `).join('') || '맞춤법 교정이 필요하지 않습니다.'}
                    </ul>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <!-- 문단 구성 제안 -->
          <h2 class="section-title">문단 구성 제안</h2>
          <div class="structure-container">
            <div class="structure-section">
              <h3 class="structure-section-title">현재 문단 구조</h3>
              ${formatStructureContent(currentStructure, 'current')}
            </div>
            <div class="structure-section">
              <h3 class="structure-section-title">문단 구성 개선안</h3>
              ${formatStructureContent(improvedStructure, 'improved')}
            </div>
            <div class="structure-section">
              <h3 class="structure-section-title">구체적 실행 방안</h3>
              ${formatStructureContent(structureSuggestions, 'suggestions')}
            </div>
          </div>

          <!-- 프린트 버튼 -->
          <div class="print-button-container no-print">
            <button onclick="window.print()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              프린트하기
            </button>
          </div>
        </div>
      `;

      // 결과 표시
      result.classList.remove('hidden');
    } catch (error) {
      console.error('분석 결과 표시 중 오류:', error);
      result.innerHTML = `
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          분석 결과를 표시하는 중 오류가 발생했습니다. 다시 시도해 주세요.
        </div>
      `;
    }
  };
  // useEffect 훅 추가
  useEffect(() => {
    // 텍스트 입력 시 이벤트 리스너
    const content = document.getElementById('content');
    const charCount = document.querySelector('.char-count');
    const paragraphCount = document.querySelector('.paragraph-count');

    if (content) {
      content.addEventListener('input', function() {
        const totalCount = countCharacters(this.value);
        charCount.textContent = `글자수: ${totalCount}자`;

        const paragraphs = this.value.split('\n').filter(p => p.trim());
        paragraphCount.textContent = `문단수: ${paragraphs.length}개`;

        updateParagraphAnalysis(paragraphs);
      });
    }
  }, []);

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
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 no-print">
            <div className="title-container">
              <h1 className="main-title">글쓰기 나침반</h1>
              <p className="subtitle">초등 글쓰기 능력 향상을 위한 맞춤형 분석 도우미</p>
            </div>
            
            <div className="input-grid mb-4">
              <input type="text" id="grade" placeholder="학년" className="border p-2 sm:p-3 rounded text-lg w-full" />
              <input type="text" id="class" placeholder="반" className="border p-2 sm:p-3 rounded text-lg w-full" />
              <input type="text" id="number" placeholder="번호" className="border p-2 sm:p-3 rounded text-lg w-full" />
              <input type="text" id="name" placeholder="이름" className="border p-2 sm:p-3 rounded text-lg w-full" />
            </div>

            <input type="text" id="title" placeholder="제목" className="border p-2 sm:p-3 rounded w-full mb-4 text-lg" />

            <div className="guide-container">
              <div className="writing-guide">
                <div className="guide-title">
                  <span className="guide-icon">✍️</span>
                  좋은 글쓰기 도움말
                </div>
                <ul className="guide-tips">
                  <li>• 한 문단은 3~5개의 문장으로 구성해요</li>
                  <li>• 새로운 내용이 시작되면 문단을 나눠요</li>
                  <li>• 문단의 첫 문장에 중심 내용을 담아요</li>
                </ul>
              </div>
              <div className="writing-guide">
                <div className="guide-title">
                  <span className="guide-icon">📝</span>
                  글쓰기 나침반 사용방법
                </div>
                <ul className="guide-tips">
                  <li>• 글을 작성한 후 문단 제안하기를 눌러 문단 나누기 도움을 받아요</li>
                  <li>• 도움말을 참고하여 문단을 나눈 뒤 분석하기 버튼을 눌러요</li>
                  <li>• 자세한 분석 결과와 제안을 확인하고 글을 수정해보세요</li>
                </ul>
              </div>
            </div>

            <div className="paragraph-controls">
              <button className="paragraph-button suggestion-button" onClick={getParagraphSuggestions}>
                <span>문단 제안하기</span>
                <span className="button-icon">💡</span>
              </button>
              <button className="paragraph-button preview-button" onClick={toggleParagraphPreview}>
                <span>문단 미리보기</span>
                <span className="button-icon">👁️</span>
              </button>
            </div>

            <div id="previewContent" className="preview-content hidden"></div>
            <div id="analysisResult" className="analysis-container hidden"></div>

            <div className="text-area-wrapper">
              <textarea 
                id="content" 
                placeholder="이곳에 글을 작성하세요. 
문단을 나누고 싶을 때는 Enter키를 한 번 눌러주세요." 
                className="border p-2 sm:p-3 rounded w-full h-64 text-lg"
              ></textarea>
              <div className="paragraph-suggestions"></div>
            </div>

            <div className="writing-feedback">
              <div className="char-count">
                <span>글자수: 0자</span>
              </div>
              <div className="paragraph-count">
                <span>문단수: 0개</span>
              </div>
              <div className="paragraph-analysis">
                <span>문단 분석: 적절한 문단 구분이 필요해요</span>
              </div>
            </div>
          </div>

          <div className="button-and-credits">
            <button 
              id="submitBtn" 
              className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded text-lg font-medium hover:bg-blue-600 w-full sm:w-auto"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? '분석중...' : '분석하기'}
            </button>
            <div className="credits text-gray-500 text-sm flex items-center">
              Created by B.S.Park. Powered by GPT 4o-mini.
            </div>
          </div>
        </div>

        <div id="result" className="container mx-auto px-4 hidden"></div>

        {/* Tip Modal */}
        <div className="tip-modal hidden" id="tipModal">
          <h3 className="text-xl font-bold mb-4">문단 나누기 Tips!</h3>
          <ul className="space-y-2">
            <li>✍️ 하나의 문단에는 하나의 중심 생각만 담아요.</li>
            <li>✍️ 새로운 내용이 시작되면 새로운 문단으로 나눠요.</li>
            <li>✍️ 문단의 첫 문장에 중심 내용을 담아요.</li>
            <li>✍️ 보통 3~5문장이 한 문단이 되어요.</li>
            <li>✍️ 들여쓰기로 문단의 시작을 표시해요.</li>
          </ul>
          <button 
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" 
            onClick={closeTipModal}
          >
            알겠어요!
          </button>
        </div>
        <div 
          className="modal-overlay hidden" 
          id="modalOverlay" 
          onClick={closeTipModal}
        ></div>
      </main>
    </div>
  );
}
