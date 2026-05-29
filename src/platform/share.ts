// 平台无关的分享接口。当前走 H5 navigator.share / clipboard，失败时弹提示；
// 迁移到小程序 → wx.shareAppMessage；Capacitor → @capacitor/share。
import { alert } from './dialog'

export interface SharePayload {
  title: string
  text: string
  url: string
}

export interface ShareOptions {
  // 不支持原生分享时的回退提示文案
  fallbackMessage?: string
  // 完全失败（如非 https + 无 clipboard）时的提示文案
  failureMessage?: string
}

export async function sharePayload(
  payload: SharePayload,
  options: ShareOptions = {},
): Promise<void> {
  if (typeof window === 'undefined') return

  const nav = window.navigator
  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share(payload)
      return
    } catch {
      // 用户取消或失败时落到剪贴板
    }
  }

  if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
    try {
      await nav.clipboard.writeText(payload.url)
      alert(options.fallbackMessage ?? '链接已复制\n请在微信中粘贴分享给好友')
      return
    } catch {
      // ignore
    }
  }

  alert(options.failureMessage ?? '请在微信中打开后分享')
}

// 站点基础 URL（用于构造分享链接）
export function getOriginUrl(): string {
  if (typeof window === 'undefined' || !window.location) return ''
  return window.location.origin
}
