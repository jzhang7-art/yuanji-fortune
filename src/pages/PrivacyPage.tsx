import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui'
import { FortuneScene } from '@/components/decor/FortuneScene'
import { StaggerList, StaggerItem } from '@/motion/Stagger'

type Tab = 'privacy' | 'terms'

// NOTE: 占位协议文本，上线前请由法务复核。
const PRIVACY_BODY = [
  ['信息收集范围', '本应用仅收集您主动输入的生辰八字（出生年月日时辰、性别）以及视频元信息（类型、标题、平台、计划发布日期），用于本地推演计算。'],
  ['存储方式', '所有信息以 localStorage 形式存储在您的设备浏览器中，不会上传至服务器，亦不会与第三方共享。'],
  ['使用范围', '收集到的信息仅用于推演评分、生成历史记录，不用于广告、画像或任何商业用途。'],
  ['撤销与删除', '您可随时在「我的 → 设置 → 清空测算历史」清除全部数据，或通过浏览器设置清除站点存储。'],
  ['未成年人保护', '本应用不面向 14 岁以下未成年人，未成年人请在监护人指导下使用。'],
  ['更新与联系', '本政策可能随产品迭代更新，重大变更将在应用内公告。如有疑问请发送邮件至 feedback@xuanji.app。'],
]

const TERMS_BODY = [
  ['服务性质', '玄机·发布择时是一款基于传统术数文化的内容发布参考工具，所有结果仅供娱乐参考，不构成任何决策建议。'],
  ['使用约定', '您应理性看待评分结果。内容能否传播取决于选题、质量与平台机制，本应用不对实际发布效果作任何承诺。'],
  ['知识产权', '本应用的界面设计、文案、算法实现著作权归原作者所有，未经许可不得用于商业转售。'],
  ['免责条款', '因您依据本应用结果作出的任何决策，由此产生的后果由您自行承担，本应用不承担责任。'],
  ['服务变更', '我们可能随时调整、暂停或终止本服务的全部或部分功能，无需事先通知。'],
  ['争议解决', '如就本协议产生争议，应友好协商；协商不成的，提交开发者所在地有管辖权的法院解决。'],
]

export function PrivacyPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'terms' ? 'terms' : 'privacy'
  const body = tab === 'terms' ? TERMS_BODY : PRIVACY_BODY
  const title = tab === 'terms' ? '用 户 协 议' : '隐 私 政 策'

  function switchTab(next: Tab) {
    params.set('tab', next)
    setParams(params, { replace: true })
  }

  const tabBase = 'flex-1 cursor-pointer rounded-xl px-3 py-2 text-center text-sm transition'
  const tabActive = 'bg-jin/20 text-jin-bright border border-jin/40'
  const tabIdle = 'border border-shiqing/15 text-qingmo hover:text-mibai'

  return (
    <FortuneScene tone="yunwen">
      <StaggerList className="flex flex-col gap-4">
        <StaggerItem>
          <div className="text-center">
            <p className="text-sm tracking-[0.28em] text-qingmo">{title}</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="flex gap-2">
            <button type="button" onClick={() => switchTab('privacy')} className={`${tabBase} ${tab === 'privacy' ? tabActive : tabIdle}`}>
              隐私政策
            </button>
            <button type="button" onClick={() => switchTab('terms')} className={`${tabBase} ${tab === 'terms' ? tabActive : tabIdle}`}>
              用户协议
            </button>
          </div>
        </StaggerItem>

        {body.map(([heading, text], i) => (
          <StaggerItem key={`${tab}-${i}`}>
            <Card title={`${i + 1}. ${heading}`} accent="shiqing">
              <p className="text-sm leading-relaxed text-qingmo">{text}</p>
            </Card>
          </StaggerItem>
        ))}

        <StaggerItem>
          <p className="px-2 text-xs text-qingmo-mute">
            最后更新：2026-05-27
          </p>
        </StaggerItem>
      </StaggerList>
    </FortuneScene>
  )
}
