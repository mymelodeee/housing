import { describe, it, expect } from 'vitest'
import { groupLiveListingsByComplex } from './groupLiveListingsByComplex'
import type { RegionalListing } from '../types'

function makeEntry(overrides: Partial<RegionalListing> = {}): RegionalListing {
  return {
    id: 1,
    lawdCd: '11740',
    kaptCode: null,
    complexName: '단지A',
    address: '서울 강동구 상일동 1',
    exclusiveArea: 84.5,
    salePrice: 100000,
    transactionDate: '2026-07-15',
    householdCount: 1000,
    latitude: 37.5,
    longitude: 127.1,
    collectedAt: '2026-08-17T00:00:00Z',
    ...overrides,
  }
}

describe('groupLiveListingsByComplex', () => {
  it('같은 lawdCd+단지명의 항목을 하나의 그룹으로 묶는다', () => {
    const entries = [
      makeEntry({ id: 1, salePrice: 90000 }),
      makeEntry({ id: 2, salePrice: 110000 }),
      makeEntry({ id: 3, complexName: '단지B', salePrice: 80000 }),
    ]

    const groups = groupLiveListingsByComplex(entries)

    expect(groups).toHaveLength(2)
    expect(groups[0].complexName).toBe('단지A')
    expect(groups[0].entries).toHaveLength(2)
    expect(groups[1].complexName).toBe('단지B')
    expect(groups[1].entries).toHaveLength(1)
  })

  it('같은 단지명이라도 lawdCd가 다르면 별도 그룹으로 취급한다', () => {
    const entries = [makeEntry({ id: 1, lawdCd: '11740' }), makeEntry({ id: 2, lawdCd: '41465' })]

    const groups = groupLiveListingsByComplex(entries)

    expect(groups).toHaveLength(2)
  })

  it('그룹의 최소/최대 매매가를 계산한다', () => {
    const entries = [makeEntry({ id: 1, salePrice: 90000 }), makeEntry({ id: 2, salePrice: 110000 })]

    const [group] = groupLiveListingsByComplex(entries)

    expect(group.minSalePrice).toBe(90000)
    expect(group.maxSalePrice).toBe(110000)
  })

  it('address/householdCount가 null인 첫 항목이 있어도 이후 항목에서 값을 채운다', () => {
    const entries = [
      makeEntry({ id: 1, address: null, householdCount: null }),
      makeEntry({ id: 2, address: '서울 강동구 상일동 2', householdCount: 500 }),
    ]

    const [group] = groupLiveListingsByComplex(entries)

    expect(group.address).toBe('서울 강동구 상일동 2')
    expect(group.householdCount).toBe(500)
  })

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(groupLiveListingsByComplex([])).toEqual([])
  })
})
