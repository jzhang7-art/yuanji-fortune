// 平台无关的滚动控制。当前实现走 window.scrollTo；
// 迁移到小程序 → wx.pageScrollTo；Capacitor → 仍可走 window。

export function scrollToTop(): void {
  if (typeof window === 'undefined') return
  window.scrollTo(0, 0)
}
