import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadBaZiInput,
  saveBaZiInput,
  loadHistory,
  saveHistory,
  clearHistory,
} from './index'

const BAZI: Parameters<typeof saveBaZiInput>[0] = {
  year: 1990,
  month: 5,
  day: 15,
  shiChenIndex: 7,
  gender: '男',
}

beforeEach(() => {
  localStorage.clear()
})

describe('storage · BaZiInput', () => {
  it('save / load 往返一致', async () => {
    await saveBaZiInput(BAZI)
    const loaded = await loadBaZiInput()
    expect(loaded).toEqual(BAZI)
  })

  it('未保存时 load 返回 null', async () => {
    expect(await loadBaZiInput()).toBeNull()
  })

  it('坏数据（非 JSON）触发 try/catch，load 返回 null 而非抛错', async () => {
    localStorage.setItem('zmf:bazi', '{not-valid-json')
    expect(await loadBaZiInput()).toBeNull()
  })
})

describe('storage · History', () => {
  it('未保存时返回空数组', async () => {
    expect(await loadHistory()).toEqual([])
  })

  it('新记录插在最前面', async () => {
    await saveHistory({ id: 'a', createdAt: 1, baziInput: BAZI, publishInfo: stubPublishInfo(), overallScore: 60 })
    await saveHistory({ id: 'b', createdAt: 2, baziInput: BAZI, publishInfo: stubPublishInfo(), overallScore: 70 })
    const list = await loadHistory()
    expect(list.map((r) => r.id)).toEqual(['b', 'a'])
  })

  it('保留最多 HISTORY_MAX (=50) 条', async () => {
    for (let i = 0; i < 60; i++) {
      await saveHistory({
        id: `r${i}`,
        createdAt: i,
        baziInput: BAZI,
        publishInfo: stubPublishInfo(),
        overallScore: 50,
      })
    }
    const list = await loadHistory()
    expect(list.length).toBe(50)
    // 最近写入的 r59 应在最前
    expect(list[0].id).toBe('r59')
    expect(list[49].id).toBe('r10')
  })

  it('clearHistory 后列表为空', async () => {
    await saveHistory({ id: 'a', createdAt: 1, baziInput: BAZI, publishInfo: stubPublishInfo(), overallScore: 60 })
    await clearHistory()
    expect(await loadHistory()).toEqual([])
  })
})

function stubPublishInfo() {
  return {
    videoTypeId: 'lifestyle',
    title: '',
    platform: '抖音' as const,
    targetDate: '2026-01-01',
  }
}
