import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LotusOnboarding } from './LotusOnboarding'
import { AppStateProvider } from '@/state/AppState'
import { BAZI_YEAR_MIN } from '@/data/constants'

function renderOnboarding(prefillBazi?: object) {
  if (prefillBazi) {
    localStorage.setItem('zmf:bazi', JSON.stringify(prefillBazi))
  }
  return render(
    <MemoryRouter>
      <AppStateProvider>
        <LotusOnboarding />
      </AppStateProvider>
    </MemoryRouter>,
  )
}

describe('LotusOnboarding · 日期合法性', () => {
  it('1990 年应该在年份范围内', () => {
    // YEAR_MIN=1960, 默认 yIdx=35 → 1995。Onboarding 用户拨到 1990 (yIdx=30) 也合法。
    expect(BAZI_YEAR_MIN).toBeLessThanOrEqual(1990)
  })

  it('展示「莲启 · 入此一局」标题（onboarding 模式）', () => {
    renderOnboarding()
    expect(screen.getByText(/莲\s*启/)).toBeInTheDocument()
  })

  it('入局按钮可见且未禁用（默认值合法）', () => {
    renderOnboarding()
    const btn = screen.getByRole('button', { name: /入\s*局/ })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })
})

describe('LotusOnboarding · 闰年 2 月 29 日校验', () => {
  // 默认 mIdx=7 月（8 月），dIdx=14（15 日），所以默认合法。
  // 这里只做最小用例：闰/平年 2 月长度的纯函数逻辑。
  it('2020 年 2 月有 29 天', () => {
    expect(new Date(2020, 2, 0).getDate()).toBe(29)
  })

  it('2021 年 2 月只有 28 天', () => {
    expect(new Date(2021, 2, 0).getDate()).toBe(28)
  })
})

describe('LotusOnboarding · edit 模式 prefill', () => {
  it('已存八字时（edit 模式），渲染重排标题', async () => {
    localStorage.setItem(
      'zmf:bazi',
      JSON.stringify({ year: 1990, month: 5, day: 15, shiChenIndex: 7, gender: '男' }),
    )
    render(
      <MemoryRouter>
        <AppStateProvider>
          <LotusOnboarding mode="edit" />
        </AppStateProvider>
      </MemoryRouter>,
    )
    // edit 模式标题是「重 排 此 生 · 改 易 生 辰」
    expect(await screen.findByText(/重\s*排\s*此\s*生/)).toBeInTheDocument()
  })

  it('edit 模式右上角有关闭按钮', () => {
    render(
      <MemoryRouter>
        <AppStateProvider>
          <LotusOnboarding mode="edit" />
        </AppStateProvider>
      </MemoryRouter>,
    )
    const closeBtn = screen.getByRole('button', { name: '返回' })
    expect(closeBtn).toBeInTheDocument()
    fireEvent.click(closeBtn)
  })
})
