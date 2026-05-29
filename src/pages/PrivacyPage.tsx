import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui'
import { FortuneScene } from '@/components/decor/FortuneScene'
import { StaggerList, StaggerItem } from '@/motion/Stagger'

type Tab = 'privacy' | 'terms'

// NOTE: 本文本基于《个人信息保护法》《App 收集个人信息基本规范》编写，
// 仍建议上线前由法务做最终复核，确认主体名称、联系方式与适用司法管辖区。
const PRIVACY_BODY = [
  ['信息收集范围', '本应用仅在您主动操作时收集以下信息：(1) 您输入的生辰八字（公历出生年月日时辰、性别），用于命盘推演；(2) 您输入的视频元信息（类型、标题、计划平台、计划发布日期），用于择时评分。我们不收集您的手机号、身份证、位置、通讯录、相册、麦克风、摄像头数据。'],
  ['存储方式与本地化', '所有信息以 localStorage 形式存储在您的设备浏览器内，不会上传至我们的服务器，也不会与任何第三方共享。我们不具备读取这些数据的技术能力。'],
  ['使用范围', '收集到的信息仅用于本地推演评分与历史记录。我们不将其用于广告、用户画像、商业转售或任何其他用途。'],
  ['Cookie 与同类技术', '本应用不使用第三方追踪 Cookie。仅在您显式同意后启用匿名使用分析（PostHog），用于改进产品；如需撤回同意，请在「我的 → 设置 → 重置所有本地数据」中一键清除（该操作同时撤销分析授权）。'],
  ['撤销与删除权', '您可通过「我的 → 设置 → 清空测算历史」清除推演记录，或通过「重置所有本地数据」彻底清除全部信息（含生辰、同意状态、分析痕迹）；也可在浏览器设置中清除本站点存储。删除操作即时生效且不可恢复。'],
  ['未成年人保护', '本应用不面向 14 周岁以下未成年人。如您是未成年人，请在监护人指导下使用，未成年人输入的任何数据由监护人承担监护责任。'],
  ['您的权利', '依据《个人信息保护法》第四十四条至四十九条，您享有知情权、决定权、查阅复制权、可携权、更正补充权、删除权、解释说明权。如需行使上述权利，请联系 feedback@xuanji.app。'],
  ['更新与联系', '本政策可能随产品迭代更新，重大变更将在应用内显著位置公告。生效日期：2026-05-29。开发者联系邮箱：feedback@xuanji.app。'],
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
