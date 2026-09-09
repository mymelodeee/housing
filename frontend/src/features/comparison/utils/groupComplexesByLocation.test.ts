import { describe, it, expect } from 'vitest'
import { groupComplexesByLocation } from './groupComplexesByLocation'

describe('groupComplexesByLocation', () => {
  it('시/군/구 > 동 > 단지명 3단계로 그룹핑한다', () => {
    const tree = groupComplexesByLocation([
      { id: 1, complexName: '동분당더퍼스트', address: '성남시 중원구 도촌동 704' },
      { id: 2, complexName: '성남자이', address: '성남시 중원구 하대원동 539' },
      { id: 3, complexName: '강동헤리티지자이', address: '서울 강동구 길동 483' },
    ])

    expect([...tree.keys()]).toEqual(['성남시 중원구', '서울 강동구'])
    expect([...tree.get('성남시 중원구')!.keys()]).toEqual(['도촌동', '하대원동'])
    expect(tree.get('성남시 중원구')!.get('도촌동')).toEqual([{ id: 1, complexName: '동분당더퍼스트' }])
    expect(tree.get('서울 강동구')!.get('길동')).toEqual([{ id: 3, complexName: '강동헤리티지자이' }])
  })

  it('동을 추출할 수 없는 주소는 "(동 정보 없음)" 그룹으로 묶는다', () => {
    const tree = groupComplexesByLocation([
      { id: 1, complexName: '동탄역시범우남퍼스트빌', address: '경기도 화성시 동탄대로시범길 276' },
    ])

    expect(tree.get('경기도 화성시')!.get('(동 정보 없음)')).toEqual([
      { id: 1, complexName: '동탄역시범우남퍼스트빌' },
    ])
  })

  it('같은 동에 여러 단지가 있으면 모두 같은 배열에 담긴다', () => {
    const tree = groupComplexesByLocation([
      { id: 1, complexName: '센트럴하이츠', address: '수원시 영통구 망포동 718' },
      { id: 2, complexName: '동수원자이1차', address: '수원시 영통구 망포동 686' },
    ])

    expect(tree.get('수원시 영통구')!.get('망포동')).toHaveLength(2)
  })

  it('입력이 빈 배열이면 빈 Map을 반환한다', () => {
    expect(groupComplexesByLocation([]).size).toBe(0)
  })
})
