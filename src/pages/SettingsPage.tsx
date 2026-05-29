import { useEffect, useState } from 'react'
import { RefreshCw, Trash2, Bell, Tag } from 'lucide-react'
import { clearHistory, loadHistory } from '@/storage'
import { RowLink, RowGroup } from '@/components/RowLink'
import { FortuneScene } from '@/components/decor/FortuneScene'
import { StaggerList, StaggerItem } from '@/motion/Stagger'
import { alert, confirm } from '@/platform/dialog'

const ICON_SIZE = 18
const ICON_STROKE = 1.5

export function SettingsPage() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    loadHistory().then((r) => setCount(r.length))
  }, [])

  async function handleClear() {
    if (!confirm('确定清空全部测算记录？此操作不可撤销。')) return
    await clearHistory()
    setCount(0)
  }

  return (
    <FortuneScene tone="yunwen">
      <StaggerList className="flex flex-col gap-5">
        <StaggerItem>
          <div className="text-center">
            <p className="text-[13px] tracking-[0.32em] text-qingmo">设 置</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <RowGroup title="生 辰 信 息">
            <RowLink
              icon={<RefreshCw size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="重排生辰八字"
              to="/lotus"
            />
          </RowGroup>
        </StaggerItem>

        <StaggerItem>
          <RowGroup title="数 据 管 理">
            <RowLink
              icon={<Trash2 size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="清空测算历史"
              trailing={count !== null ? `${count} 条` : undefined}
              onClick={handleClear}
              tone="danger"
            />
          </RowGroup>
        </StaggerItem>

        <StaggerItem>
          <RowGroup title="通 知">
            <RowLink
              icon={<Bell size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="吉时提醒"
              trailing="即将上线"
              onClick={() => alert('吉时提醒功能将在微信小程序版本上线')}
              showChevron={false}
            />
          </RowGroup>
        </StaggerItem>

        <StaggerItem>
          <RowGroup title="关 于">
            <RowLink
              icon={<Tag size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="版本"
              trailing="v1.0.0"
              showChevron={false}
              onClick={() => {}}
            />
          </RowGroup>
        </StaggerItem>
      </StaggerList>
    </FortuneScene>
  )
}
