import { Card } from '@/components/ui'
import { WeChatCard } from '@/components/WeChatContact'
import { FortuneScene } from '@/components/decor/FortuneScene'
import { StaggerList, StaggerItem } from '@/motion/Stagger'

export function AboutPage() {
  return (
    <FortuneScene tone="yunwen">
      <StaggerList className="flex flex-col gap-4">
        <StaggerItem>
          <div className="text-center">
            <p className="text-sm tracking-[0.28em] text-qingmo">关 于 玄 机</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <Card title="产品介绍" accent="jin">
            <p className="text-sm leading-relaxed text-mibai">
              玄机·发布择时，是一款帮内容创作者择时发布的术数 Web 应用。
            </p>
            <p className="mt-2 text-sm leading-relaxed text-qingmo">
              结合八字命理、黄历宜忌与自研的奇门遁甲排盘，给到「爆火概率」评估与吉日吉时推荐，助你为每条内容选对档期。
            </p>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card title="致谢" accent="shilv">
            <ul className="flex flex-col gap-1.5 text-sm text-qingmo">
              <li>· lunar-typescript — 农历与八字基础库</li>
              <li>· 《神奇之门 · 张志春》 — 奇门遁甲典籍校验</li>
              <li>· Noto Serif SC — 中文宋体显示</li>
            </ul>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <WeChatCard source="about" />
        </StaggerItem>

        <StaggerItem>
          <Card title="娱乐免责声明" accent="zhusha">
            <p className="text-xs leading-relaxed text-qingmo">
              本应用基于八字、黄历、奇门遁甲等传统术数文化推演得出结果，仅供娱乐参考，不构成任何决策建议。内容能否传播取决于选题、质量与平台机制，请理性看待评分结果。本应用所有数据均存储于您本机，不上传至服务器。
            </p>
          </Card>
        </StaggerItem>
      </StaggerList>
    </FortuneScene>
  )
}
