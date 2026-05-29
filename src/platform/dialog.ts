// 平台无关的模态/提示接口。当前实现走浏览器 window.alert / confirm；
// 迁移到小程序 → 切到 wx.showModal / wx.showToast；Capacitor → @capacitor/dialog。

export function alert(message: string): void {
  if (typeof window === 'undefined') return
  window.alert(message)
}

export function confirm(message: string): boolean {
  if (typeof window === 'undefined') return false
  return window.confirm(message)
}
