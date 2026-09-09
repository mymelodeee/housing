import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocalityAxisList } from './LocalityAxisList'
import type { LocalityDisplayData } from '../types/locality'
import { calcHousingAge } from '../utils/housingAge'

describe('LocalityAxisList', () => {
  it('완전히 채워진 데이터의 모든 라벨과 값을 렌더링한다', () => {
    const data: LocalityDisplayData = {
      completionYear: 1998,
      remodelingStatus: '완료',
      reconstructionStatus: '조합설립인가',
      nearbyRedevelopmentInfo: 'OO구역 재개발',
      localityAttributes: {
        transportation: '지하철 2호선 도보 5분',
        commercialArea: '대형 쇼핑몰 인접',
        gangnamAccessibility: '강남까지 20분',
        entertainmentAndParks: '한강공원 인접',
        nearbyJobs: 'IT 밸리 인접',
      },
    }

    render(<LocalityAxisList data={data} />)

    expect(screen.getByText('연식')).toBeInTheDocument()
    expect(screen.getByText(/^1998년 \(\d+년차\)$/)).toBeInTheDocument()

    expect(screen.getByText('리모델링 이력')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()

    expect(screen.getByText('재건축 추진현황')).toBeInTheDocument()
    expect(screen.getByText('조합설립인가')).toBeInTheDocument()

    expect(screen.getByText('주변 재개발 정보')).toBeInTheDocument()
    expect(screen.getByText('OO구역 재개발')).toBeInTheDocument()

    expect(screen.getByText('교통')).toBeInTheDocument()
    expect(screen.getByText('지하철 2호선 도보 5분')).toBeInTheDocument()

    expect(screen.getByText('상권')).toBeInTheDocument()
    expect(screen.getByText('대형 쇼핑몰 인접')).toBeInTheDocument()

    expect(screen.getByText('강남 접근성')).toBeInTheDocument()
    expect(screen.getByText('강남까지 20분')).toBeInTheDocument()

    expect(screen.getByText('유흥·공원')).toBeInTheDocument()
    expect(screen.getByText('한강공원 인접')).toBeInTheDocument()

    expect(screen.getByText('주변일자리')).toBeInTheDocument()
    expect(screen.getByText('IT 밸리 인접')).toBeInTheDocument()

    expect(screen.queryByText('학군')).not.toBeInTheDocument()
    expect(screen.queryByText('개발호재')).not.toBeInTheDocument()
  })

  it('전부 정보 없음/해당없음 케이스를 오류 없이 렌더링한다', () => {
    const data: LocalityDisplayData = {
      completionYear: null,
      remodelingStatus: '해당없음',
      reconstructionStatus: '해당없음',
      nearbyRedevelopmentInfo: null,
      localityAttributes: {
        transportation: '정보 없음',
        commercialArea: '정보 없음',
        gangnamAccessibility: '정보 없음',
        entertainmentAndParks: '정보 없음',
        nearbyJobs: '정보 없음',
      },
    }

    expect(() => render(<LocalityAxisList data={data} />)).not.toThrow()

    expect(screen.getAllByText('해당없음')).toHaveLength(2)
    // completionYear/nearbyRedevelopmentInfo가 null이면 "확인 필요"(조사 미완료를 의미),
    // 나머지 5개 입지 속성만 "정보 없음"으로 표시된다.
    expect(screen.getAllByText('확인 필요')).toHaveLength(2)
    expect(screen.getAllByText('정보 없음')).toHaveLength(5)
  })

  it('부분 혼합 케이스에서 필드별로 올바르게 렌더링한다', () => {
    const data: LocalityDisplayData = {
      completionYear: 2005,
      remodelingStatus: '추진중',
      reconstructionStatus: '해당없음',
      nearbyRedevelopmentInfo: null,
      localityAttributes: {
        transportation: '지하철 3호선 인접',
        commercialArea: '정보 없음',
        gangnamAccessibility: '강남까지 30분',
        entertainmentAndParks: '정보 없음',
        nearbyJobs: '정보 없음',
      },
    }

    render(<LocalityAxisList data={data} />)

    expect(screen.getByText(/^2005년 \(\d+년차\)$/)).toBeInTheDocument()
    expect(screen.getByText('추진중')).toBeInTheDocument()
    expect(screen.getByText('교통')).toBeInTheDocument()
    expect(screen.getByText('지하철 3호선 인접')).toBeInTheDocument()
    expect(screen.getByText('강남 접근성')).toBeInTheDocument()
    expect(screen.getByText('강남까지 30분')).toBeInTheDocument()

    expect(screen.getByText('확인 필요')).toBeInTheDocument()
    expect(screen.getAllByText('정보 없음')).toHaveLength(3)
  })

  it('completionYear 값에 연식(년차) 표시를 붙여 렌더링한다(비교 화면과 동일한 calcHousingAge 정의 재사용)', () => {
    const data: LocalityDisplayData = {
      completionYear: 1998,
      remodelingStatus: '완료',
      reconstructionStatus: '조합설립인가',
      nearbyRedevelopmentInfo: 'OO구역 재개발',
      localityAttributes: {
        transportation: '정보 없음',
        commercialArea: '정보 없음',
        gangnamAccessibility: '정보 없음',
        entertainmentAndParks: '정보 없음',
        nearbyJobs: '정보 없음',
      },
    }

    render(<LocalityAxisList data={data} />)

    expect(screen.getByText(/^1998년 \(\d+년차\)$/)).toBeInTheDocument()
  })

  it.each([
    [1998, '신축'],
    [2016, '10년 이상'],
    [2006, '20년 이상'],
    [1996, '30년 이상'],
  ])(
    '연식(%i년, %s)이 비교 화면(calcHousingAge)과 동일한 경과년수로 표시된다',
    (completionYear) => {
      const data: LocalityDisplayData = {
        completionYear,
        remodelingStatus: '해당없음',
        reconstructionStatus: '해당없음',
        nearbyRedevelopmentInfo: null,
        localityAttributes: {
          transportation: '정보 없음',
          commercialArea: '정보 없음',
          gangnamAccessibility: '정보 없음',
          entertainmentAndParks: '정보 없음',
          nearbyJobs: '정보 없음',
        },
      }

      render(<LocalityAxisList data={data} />)

      expect(screen.getByText(`${completionYear}년 (${calcHousingAge(completionYear)}년차)`)).toBeInTheDocument()
    },
  )
})
