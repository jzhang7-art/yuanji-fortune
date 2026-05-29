import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Compass,
  History,
  Share2,
  Mail,
  Info,
  Settings,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { useAppState } from '@/state/AppState'
import { useBaZiChart } from '@/hooks/useBaZiChart'
import { SHI_CHEN } from '@/data/ganzhi'
import { WU_XING_COLOR } from '@/domain/wuxing'
import { RowLink, RowGroup } from '@/components/RowLink'
import { FortuneScene } from '@/components/decor/FortuneScene'
import { StaggerList, StaggerItem } from '@/motion/Stagger'
import { sharePayload, getOriginUrl } from '@/platform/share'

const ICON_SIZE = 18
const ICON_STROKE = 1.5

export function MePage() {
  const { baziInput, ready } = useAppState()
  const chart = useBaZiChart()

  function handleShare() {
    void sharePayload({
      title: '玄机·发布择时',
      text: '帮内容创作者找最佳发布时机',
      url: getOriginUrl(),
    })
  }

  function handleFeedback() {
    if (typeof window === 'undefined') return
    window.location.href = 'mailto:feedback@xuanji.app?subject=玄机反馈'
  }

  if (!ready) return <p className="py-20 text-center text-qingmo">载入中…</p>

  const shichen = baziInput ? SHI_CHEN[baziInput.shiChenIndex] : null

  return (
    <FortuneScene tone="yunwen">
      <StaggerList className="flex flex-col gap-5">

        {/* 页面标题 */}
        <StaggerItem>
          <div className="text-center">
            <p className="text-[13px] tracking-[0.32em] text-qingmo">我 的</p>
          </div>
        </StaggerItem>

        {/* 命主卡 */}
        <StaggerItem>
          {chart && baziInput && shichen ? (
            <motion.div whileTap={{ scale: 0.99 }}>
              <Link
                to="/bazi"
                className="yu-card flex items-center gap-4 rounded-2xl border border-shiqing/15 bg-ru-soft p-4"
              >
                {/* 占位头像圆（预留微信头像位） */}
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-jin/35 bg-gradient-to-br from-jin/20 to-shiqing/15 font-serif-cn text-[26px] leading-none"
                  style={{ color: WU_XING_COLOR[chart.dayMasterWuXing] }}
                >
                  {chart.dayMaster}
                </div>

                {/* 右侧信息 */}
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  <p className="text-[15px] font-medium leading-snug tracking-wide text-mibai">
                    {baziInput.year}&thinsp;年&thinsp;{baziInput.month}&thinsp;月&thinsp;{baziInput.day}&thinsp;日
                  </p>
                  <p className="text-[13px] leading-relaxed text-qingmo">
                    {baziInput.gender}&ensp;·&ensp;{shichen.name}&ensp;·&ensp;日主&thinsp;{chart.dayMaster}·{chart.dayMasterWuXing}
                  </p>
                </div>

                <span className="text-qingmo-mute">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </Link>
            </motion.div>
          ) : (
            <RowLink
              icon={<Compass size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="录入生辰，开启命盘速览"
              to="/lotus"
            />
          )}
        </StaggerItem>

        {/* 我的内容 */}
        <StaggerItem>
          <RowGroup title="我 的 内 容">
            <RowLink
              icon={<Compass size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="我的命盘"
              to="/bazi"
            />
            <RowLink
              icon={<History size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="历史测算"
              to="/history"
            />
          </RowGroup>
        </StaggerItem>

        {/* 帮助与设置 */}
        <StaggerItem>
          <RowGroup title="帮 助 与 设 置">
            <RowLink
              icon={<Share2 size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="分享给好友"
              onClick={handleShare}
            />
            <RowLink
              icon={<Mail size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="意见反馈"
              onClick={handleFeedback}
            />
            <RowLink
              icon={<Info size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="关于玄机"
              to="/about"
            />
            <RowLink
              icon={<Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="设置"
              to="/settings"
            />
          </RowGroup>
        </StaggerItem>

        {/* 协议 */}
        <StaggerItem>
          <RowGroup title="协 议">
            <RowLink
              icon={<FileText size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="用户协议"
              to="/privacy?tab=terms"
            />
            <RowLink
              icon={<ShieldCheck size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
              label="隐私政策"
              to="/privacy?tab=privacy"
            />
          </RowGroup>
        </StaggerItem>

      </StaggerList>
    </FortuneScene>
  )
}
