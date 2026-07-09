import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { UserProfileForm } from './UserProfileForm'
import { apiClient } from '../../../shared/api/client'
import type { UserProfile } from '../types'

vi.mock('../../../shared/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockedApiClient = vi.mocked(apiClient)

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<UserProfileForm />, { wrapper: Wrapper })
}

const emptyProfile: UserProfile = {
  id: 1,
  workplace: null,
  ownershipStructure: null,
  annualIncome: null,
  annualBonus: null,
  availableCapital: null,
  housingOwnershipTier: null,
  isFirstTimeBuyer: null,
}

const filledProfile: UserProfile = {
  id: 1,
  workplace: '화성',
  ownershipStructure: '부부합산',
  annualIncome: 7000,
  annualBonus: 1000,
  availableCapital: 20000,
  housingOwnershipTier: '1주택',
  isFirstTimeBuyer: false,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('UserProfileForm', () => {
  beforeEach(() => {
    mockedApiClient.mockReset()
  })

  it('로딩 중에는 로딩 텍스트만 보이고 폼 필드는 렌더링되지 않는다', () => {
    const { promise } = deferred<UserProfile>()
    mockedApiClient.mockReturnValueOnce(promise)

    renderForm()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
    expect(screen.queryByLabelText('연소득(만원)')).not.toBeInTheDocument()
  })

  it('미입력 프로필 조회 시 선택은 미입력, 숫자 입력은 비어있고 성과금은 0으로 표시되며 체크박스는 비활성/비체크 상태이다', async () => {
    mockedApiClient.mockResolvedValueOnce(emptyProfile)

    renderForm()

    await waitFor(() => expect(screen.getByLabelText('연소득(만원)')).toBeInTheDocument())

    expect(screen.getByLabelText('명의')).toHaveValue('')
    expect(screen.getByLabelText('연소득(만원)')).toHaveValue(null)
    expect(screen.getByLabelText('성과금(만원)')).toHaveValue(0)
    expect(screen.getByLabelText('자본금(만원)')).toHaveValue(null)
    expect(screen.getByLabelText('주택 소유 현황')).toHaveValue('')

    const checkbox = screen.getByLabelText('생애최초 구입') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    expect(checkbox.disabled).toBe(true)
  })

  it('필드 값을 변경하면 입력/선택 값이 갱신된다', async () => {
    mockedApiClient.mockResolvedValueOnce(emptyProfile)
    const user = userEvent.setup()

    renderForm()

    await waitFor(() => expect(screen.getByLabelText('연소득(만원)')).toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText('명의'), '단독')
    expect(screen.getByLabelText('명의')).toHaveValue('단독')

    await user.type(screen.getByLabelText('연소득(만원)'), '5000')
    expect(screen.getByLabelText('연소득(만원)')).toHaveValue(5000)

    await user.clear(screen.getByLabelText('성과금(만원)'))
    await user.type(screen.getByLabelText('성과금(만원)'), '300')
    expect(screen.getByLabelText('성과금(만원)')).toHaveValue(300)

    await user.type(screen.getByLabelText('자본금(만원)'), '8000')
    expect(screen.getByLabelText('자본금(만원)')).toHaveValue(8000)

    await user.selectOptions(screen.getByLabelText('주택 소유 현황'), '무주택')
    expect(screen.getByLabelText('주택 소유 현황')).toHaveValue('무주택')
  })

  it('무주택 선택 후 생애최초 구입 체크 시 저장하면 workplace 없이, 숫자는 숫자 타입으로, isFirstTimeBuyer는 true로 PUT 된다', async () => {
    mockedApiClient.mockResolvedValueOnce(emptyProfile)
    mockedApiClient.mockResolvedValueOnce({ ...emptyProfile, isFirstTimeBuyer: true })
    mockedApiClient.mockResolvedValue({ ...emptyProfile, isFirstTimeBuyer: true })
    const user = userEvent.setup()

    renderForm()

    await waitFor(() => expect(screen.getByLabelText('연소득(만원)')).toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText('명의'), '단독')
    await user.type(screen.getByLabelText('연소득(만원)'), '5000')
    await user.clear(screen.getByLabelText('성과금(만원)'))
    await user.type(screen.getByLabelText('성과금(만원)'), '300')
    await user.type(screen.getByLabelText('자본금(만원)'), '8000')
    await user.selectOptions(screen.getByLabelText('주택 소유 현황'), '무주택')

    const checkbox = screen.getByLabelText('생애최초 구입') as HTMLInputElement
    expect(checkbox.disabled).toBe(false)
    await user.click(checkbox)
    expect(checkbox.checked).toBe(true)

    await user.click(screen.getByRole('button', { name: /저장/ }))

    await waitFor(() => expect(mockedApiClient).toHaveBeenCalledTimes(3))

    const putCall = mockedApiClient.mock.calls.find((call) => call[1]?.method === 'PUT')
    expect(putCall).toBeDefined()
    const body = putCall?.[1]?.body as Record<string, unknown>

    expect(body).not.toHaveProperty('workplace')
    expect(body.annualIncome).toBe(5000)
    expect(typeof body.annualIncome).toBe('number')
    expect(body.annualBonus).toBe(300)
    expect(typeof body.annualBonus).toBe('number')
    expect(body.availableCapital).toBe(8000)
    expect(typeof body.availableCapital).toBe('number')
    expect(body.isFirstTimeBuyer).toBe(true)
  })

  it('생애최초 구입 체크 후 소유 현황을 1주택으로 변경하면 체크박스가 해제/비활성화되고 저장 시 isFirstTimeBuyer는 false로 전송된다', async () => {
    mockedApiClient.mockResolvedValueOnce(emptyProfile)
    mockedApiClient.mockResolvedValueOnce({ ...emptyProfile, isFirstTimeBuyer: false })
    mockedApiClient.mockResolvedValue({ ...emptyProfile, isFirstTimeBuyer: false })
    const user = userEvent.setup()

    renderForm()

    await waitFor(() => expect(screen.getByLabelText('연소득(만원)')).toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText('주택 소유 현황'), '무주택')
    const checkbox = screen.getByLabelText('생애최초 구입') as HTMLInputElement
    await user.click(checkbox)
    expect(checkbox.checked).toBe(true)

    await user.selectOptions(screen.getByLabelText('주택 소유 현황'), '1주택')

    expect(checkbox.checked).toBe(false)
    expect(checkbox.disabled).toBe(true)

    await user.click(screen.getByRole('button', { name: /저장/ }))

    await waitFor(() => expect(mockedApiClient).toHaveBeenCalledTimes(3))

    const putCall = mockedApiClient.mock.calls.find((call) => call[1]?.method === 'PUT')
    const body = putCall?.[1]?.body as Record<string, unknown>
    expect(body.isFirstTimeBuyer).toBe(false)
  })

  it('기존 값이 있는 프로필을 조회하면 모든 필드가 해당 값으로 채워진다', async () => {
    mockedApiClient.mockResolvedValueOnce(filledProfile)

    renderForm()

    await waitFor(() => expect(screen.getByLabelText('연소득(만원)')).toBeInTheDocument())

    expect(screen.getByLabelText('명의')).toHaveValue('부부합산')
    expect(screen.getByLabelText('연소득(만원)')).toHaveValue(7000)
    expect(screen.getByLabelText('성과금(만원)')).toHaveValue(1000)
    expect(screen.getByLabelText('자본금(만원)')).toHaveValue(20000)
    expect(screen.getByLabelText('주택 소유 현황')).toHaveValue('1주택')

    const checkbox = screen.getByLabelText('생애최초 구입') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    expect(checkbox.disabled).toBe(true)
  })

  it('저장 성공 시 저장되었습니다 문구가 표시된다', async () => {
    mockedApiClient.mockResolvedValueOnce(emptyProfile)
    mockedApiClient.mockResolvedValueOnce({ ...emptyProfile })
    mockedApiClient.mockResolvedValue({ ...emptyProfile })
    const user = userEvent.setup()

    renderForm()

    await waitFor(() => expect(screen.getByLabelText('연소득(만원)')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /저장/ }))

    await waitFor(() => expect(screen.getByText('저장되었습니다')).toBeInTheDocument())
    await waitFor(() => expect(mockedApiClient).toHaveBeenCalledTimes(3))
  })
})
