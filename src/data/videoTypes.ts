// 视频内容类型 → 五行映射
//
// 归类方法：以「行业五行归类法」为主、内容气质为辅。按视频「题材本体」
// 归入其行业五行；elements 主元素在前、次元素在后；纯粹者只给 1 个。
//   木：文教、纺织布匹服装、草木、筋骨生命力
//   火：影视娱乐表演、美丽光彩、电、热加工烹饪、欢乐
//   土：饮食食材、畜牧、母性养育、田地房产、稳定日常
//   金：金属机械电子、金融财货、珠宝、竞技、决断
//   水：智慧知识、旅游运输、传媒资讯、贸易流通、情感深邃
import type { WuXing } from '@/domain/wuxing'

export interface VideoType {
  id: string
  name: string
  icon: string
  elements: WuXing[]
  desc: string
}

export const VIDEO_TYPES: VideoType[] = [
  // 烹饪/餐饮属火，食材饮食属土
  { id: 'food', name: '美食探店', icon: '🍜', elements: ['火', '土'], desc: '烹饪、探店、美食测评' },
  // 服装布匹属木，时尚造型/美感属火
  { id: 'fashion', name: '穿搭时尚', icon: '👗', elements: ['木', '火'], desc: '穿搭、时尚、造型分享' },
  // 知识智慧属水，文教讲解属木
  { id: 'knowledge', name: '知识科普', icon: '📚', elements: ['水', '木'], desc: '干货、科普、教学讲解' },
  // 娱乐欢笑属火（纯火）
  { id: 'comedy', name: '搞笑娱乐', icon: '😂', elements: ['火'], desc: '段子、整活、搞笑短剧' },
  // 影视表演属火，情感剧情内涵属水
  { id: 'drama', name: '剧情短片', icon: '🎬', elements: ['火', '水'], desc: '故事、短剧、情感剧情' },
  // 筋骨生发属木，运动激情属火
  { id: 'fitness', name: '健身运动', icon: '💪', elements: ['木', '火'], desc: '健身、运动、塑形教程' },
  // 旅游流动属水，自然风光属木
  { id: 'travel', name: '旅行风光', icon: '✈️', elements: ['水', '木'], desc: '旅拍、风光、城市漫游' },
  // 美妆/美丽光彩属火，护肤补水滋润属水
  { id: 'beauty', name: '美妆护肤', icon: '💄', elements: ['火', '水'], desc: '化妆、护肤、好物测评' },
  // 数码硬件机械属金，科技资讯/信息属水
  { id: 'tech', name: '科技数码', icon: '📱', elements: ['金', '水'], desc: '数码、测评、科技资讯' },
  // 养育母性属土（坤为母），孩子成长/亲子属木
  { id: 'parenting', name: '母婴亲子', icon: '🍼', elements: ['土', '木'], desc: '育儿、亲子、母婴好物' },
  // 畜养属土，动物生命属木
  { id: 'pet', name: '萌宠日常', icon: '🐾', elements: ['土', '木'], desc: '宠物、萌宠、动物日常' },
  // 才艺表演属火，特殊表演/艺术流动属水
  { id: 'music', name: '音乐才艺', icon: '🎵', elements: ['火', '水'], desc: '唱歌、乐器、才艺展示' },
  // 日常生活属土，记录流水属水
  { id: 'vlog', name: '生活 Vlog', icon: '🎞️', elements: ['土', '水'], desc: '日常、记录、生活方式' },
  // 金融财货属金，财库积累/职场属土
  { id: 'finance', name: '财经职场', icon: '💼', elements: ['金', '土'], desc: '理财、职场、商业观察' },
  // 游戏娱乐属火，电子竞技属金
  { id: 'game', name: '游戏电竞', icon: '🎮', elements: ['火', '金'], desc: '游戏、电竞、实况解说' },
]

export function getVideoType(id: string): VideoType | undefined {
  return VIDEO_TYPES.find((v) => v.id === id)
}
