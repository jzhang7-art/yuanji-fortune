import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom 不提供 ResizeObserver；react-bits ClickSpark 在 useEffect 里 new ResizeObserver()
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverPolyfill as unknown as typeof ResizeObserver
}

// Node 25 实验性 --localstorage-file 标志会预填一个空对象 globalThis.localStorage，
// 屏蔽 jsdom 的 Storage 接口；测试里如果直接调用 localStorage.clear() 会爆。
// 在这里强行装一份内存 polyfill，行为对齐 Web Storage。
function ensureStorage() {
  const proto = globalThis.localStorage && Object.getPrototypeOf(globalThis.localStorage)
  const looksBroken =
    !globalThis.localStorage || typeof globalThis.localStorage.clear !== 'function' || proto === null
  if (!looksBroken) return
  const store = new Map<string, string>()
  const polyfill = {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) as string) : null
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
    removeItem(key: string) {
      store.delete(key)
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: polyfill, configurable: true, writable: true })
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: polyfill, configurable: true, writable: true })
  }
}

ensureStorage()

afterEach(() => {
  cleanup()
  localStorage.clear()
})
