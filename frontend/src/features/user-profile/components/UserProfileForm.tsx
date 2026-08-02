import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserProfile } from '../hooks/useUserProfile'
import { useUpdateUserProfile } from '../hooks/useUpdateUserProfile'
import type {
  HousingOwnershipTier,
  OwnershipStructure,
  UserProfile,
  UserProfileUpdateRequest,
} from '../types'
import './UserProfileForm.css'

interface FormState {
  ownershipStructure: OwnershipStructure | ''
  annualIncome: string
  annualBonus: string
  availableCapital: string
  housingOwnershipTier: HousingOwnershipTier | ''
  isFirstTimeBuyer: boolean
}

const initialFormState: FormState = {
  ownershipStructure: '',
  annualIncome: '',
  annualBonus: '0',
  availableCapital: '',
  housingOwnershipTier: '',
  isFirstTimeBuyer: false,
}

function toNullableNumber(value: string): number | null {
  return value === '' ? null : Number(value)
}

function toFormState(data: UserProfile): FormState {
  return {
    ownershipStructure: data.ownershipStructure ?? '',
    annualIncome: data.annualIncome === null ? '' : String(data.annualIncome),
    annualBonus: data.annualBonus === null ? '0' : String(data.annualBonus),
    availableCapital: data.availableCapital === null ? '' : String(data.availableCapital),
    housingOwnershipTier: data.housingOwnershipTier ?? '',
    isFirstTimeBuyer: data.isFirstTimeBuyer ?? false,
  }
}

export function UserProfileForm() {
  const navigate = useNavigate()
  const { data, isLoading } = useUserProfile()
  const { mutate, isPending, isError, isSuccess, error } = useUpdateUserProfile()
  const [form, setForm] = useState<FormState>(initialFormState)
  const [syncedProfile, setSyncedProfile] = useState<UserProfile | null>(null)

  if (data && data !== syncedProfile) {
    setSyncedProfile(data)
    setForm(toFormState(data))
  }

  if (isLoading) {
    return <p>불러오는 중...</p>
  }

  function handleHousingOwnershipTierChange(value: HousingOwnershipTier | '') {
    setForm((prev) => ({
      ...prev,
      housingOwnershipTier: value,
      isFirstTimeBuyer: value === '무주택' ? prev.isFirstTimeBuyer : false,
    }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const patch: UserProfileUpdateRequest = {
      ownershipStructure: form.ownershipStructure === '' ? null : form.ownershipStructure,
      annualIncome: toNullableNumber(form.annualIncome),
      annualBonus: form.annualBonus === '' ? 0 : Number(form.annualBonus),
      availableCapital: toNullableNumber(form.availableCapital),
      housingOwnershipTier: form.housingOwnershipTier === '' ? null : form.housingOwnershipTier,
      isFirstTimeBuyer: form.housingOwnershipTier === '무주택' ? form.isFirstTimeBuyer : false,
    }

    mutate(patch, { onSuccess: () => navigate('/') })
  }

  return (
    <form className="user-profile-form" onSubmit={handleSubmit}>
      <div className="user-profile-form__field">
        <label htmlFor="ownershipStructure">명의</label>
        <select
          id="ownershipStructure"
          value={form.ownershipStructure}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              ownershipStructure: event.target.value as OwnershipStructure | '',
            }))
          }
        >
          <option value="">미입력</option>
          <option value="단독">단독</option>
          <option value="부부합산">부부합산</option>
        </select>
      </div>

      <div className="user-profile-form__field">
        <label htmlFor="annualIncome">연소득(만원)</label>
        <input
          id="annualIncome"
          type="number"
          min={0}
          value={form.annualIncome}
          onChange={(event) => setForm((prev) => ({ ...prev, annualIncome: event.target.value }))}
        />
      </div>

      <div className="user-profile-form__field">
        <label htmlFor="annualBonus">성과금(만원)</label>
        <input
          id="annualBonus"
          type="number"
          min={0}
          value={form.annualBonus}
          onChange={(event) => setForm((prev) => ({ ...prev, annualBonus: event.target.value }))}
        />
      </div>

      <div className="user-profile-form__field">
        <label htmlFor="availableCapital">자본금(만원)</label>
        <input
          id="availableCapital"
          type="number"
          min={0}
          value={form.availableCapital}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, availableCapital: event.target.value }))
          }
        />
      </div>

      <div className="user-profile-form__field">
        <label htmlFor="housingOwnershipTier">주택 소유 현황</label>
        <select
          id="housingOwnershipTier"
          value={form.housingOwnershipTier}
          onChange={(event) =>
            handleHousingOwnershipTierChange(event.target.value as HousingOwnershipTier | '')
          }
        >
          <option value="">미입력</option>
          <option value="무주택">무주택</option>
          <option value="1주택">1주택</option>
          <option value="다주택">다주택</option>
        </select>
      </div>

      <div className="user-profile-form__field user-profile-form__field--checkbox">
        <label htmlFor="isFirstTimeBuyer">
          <input
            id="isFirstTimeBuyer"
            type="checkbox"
            checked={form.isFirstTimeBuyer}
            disabled={form.housingOwnershipTier !== '무주택'}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isFirstTimeBuyer: event.target.checked }))
            }
          />
          생애최초 구입
        </label>
      </div>

      <div className="user-profile-form__actions">
        <button type="submit" disabled={isPending}>
          {isPending ? '저장 중...' : '저장'}
        </button>
        {isSuccess && <p className="user-profile-form__success">저장되었습니다</p>}
        {isError && (
          <p className="user-profile-form__error">
            {error instanceof Error ? error.message : '저장에 실패했습니다'}
          </p>
        )}
      </div>
    </form>
  )
}
