// 平台无关的会话级状态。当前 SPA 用模块级 Map（每个浏览器 tab 一份，重新加载即失效），
// 行为等价于 sessionStorage，但不依赖 DOM；小程序 / Capacitor 也能直接复用。
// 注意：仅适合"一次会话内的临时标记"，不要存敏感数据，也不会跨 tab 同步。

const store = new Map<string, string>()

export function getSession(key: string): string | null {
  return store.has(key) ? (store.get(key) as string) : null
}

export function setSession(key: string, value: string): void {
  store.set(key, value)
}

export function removeSession(key: string): void {
  store.delete(key)
}

export function hasSession(key: string): boolean {
  return store.has(key)
}
