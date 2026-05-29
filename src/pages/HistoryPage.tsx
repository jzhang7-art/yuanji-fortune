import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { clearHistory, loadHistory } from '@/storage'
import type { HistoryRecord } from '@/types'
import { getVideoType } from '@/data/videoTypes'
import { scoreGrade } from '@/domain/scoring'
import { Pill } from '@/components/ui'
import { FortuneScene } from '@/components/decor/FortuneScene'
import { StaggerList, StaggerItem } from '@/motion/Stagger'
import { Reveal } from '@/motion/Reveal'
import { confirm } from '@/platform/dialog'

export function HistoryPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<HistoryRecord[] | null>(null)

  useEffect(() => {
    loadHistory().then(setRecords)
  }, [])

  async function handleClear() {
    if (!confirm('确定清空全部测算记录？此操作不可撤销。')) return
    await clearHistory()
    setRecords([])
  }

  return (
    <FortuneScene tone="yunwen">
      <StaggerList className="flex flex-col gap-4">
        {/* 顶部：返回键 + 标题 */}
        <StaggerItem>
          <div className="relative flex items-center justify-center">
            <motion.button
              type="button"
              onClick={() => navigate(-1)}
              whileTap={{ scale: 0.92 }}
              className="absolute left-0 flex cursor-pointer items-center gap-0.5 text-[13px] text-qingmo transition hover:text-mibai"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
              <span>返回</span>
            </motion.button>
            <p className="text-sm tracking-[0.28em] text-qingmo">测 算 历 史</p>
          </div>
        </StaggerItem>

        {/* 操作栏 */}
        {records && records.length > 0 && (
          <StaggerItem>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-qingmo-mute">共 {records.length} 条记录</span>
              <button
                type="button"
                onClick={handleClear}
                className="cursor-pointer text-xs text-zhusha-bright transition hover:text-zhusha-bright/70"
              >
                清空记录
              </button>
            </div>
          </StaggerItem>
        )}

        {/* 列表 */}
        {records === null ? (
          <p className="py-10 text-center text-sm text-qingmo">载入中…</p>
        ) : records.length === 0 ? (
          <StaggerItem>
            <div className="rounded-2xl border border-shiqing/10 bg-ru-soft/50 px-4 py-8 text-center text-sm text-qingmo">
              还没有测算记录，去「测算」做一次吧
            </div>
          </StaggerItem>
        ) : (
          <div className="flex flex-col gap-2">
            {records.map((r) => {
              const vt = getVideoType(r.publishInfo.videoTypeId)
              const grade = scoreGrade(r.overallScore)
              return (
                <Reveal key={r.id}>
                  <div className="flex items-center gap-3 rounded-2xl border border-shiqing/15 bg-ru-soft/70 px-4 py-3 backdrop-blur">
                    <div className="flex w-12 shrink-0 flex-col items-center">
                      <span className="text-2xl font-bold tabular-nums text-jin-bright leading-none">
                        {r.overallScore}
                      </span>
                      <span className="mt-0.5 text-[10px] text-qingmo">%</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm text-mibai">
                          {vt?.icon} {vt?.name ?? '未知类型'}
                        </span>
                        <Pill tone="soft">{r.publishInfo.platform}</Pill>
                      </div>
                      {r.publishInfo.title && (
                        <p className="mt-0.5 truncate text-xs text-qingmo">
                          {r.publishInfo.title}
                        </p>
                      )}
                      <p className="mt-0.5 truncate text-[11px] text-qingmo-mute">
                        计划 {r.publishInfo.targetDate} · 测于{' '}
                        {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <span className="text-xs text-jin/80">{grade.label.split(' ')[0]}</span>
                  </div>
                </Reveal>
              )
            })}
          </div>
        )}
      </StaggerList>
    </FortuneScene>
  )
}
