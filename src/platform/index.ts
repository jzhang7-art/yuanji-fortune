// platform/ 适配层入口：所有平台相关 API（弹窗 / 分享 / 滚动 / 会话）都从这里导出。
// 迁移到小程序 / Capacitor 时只改各文件内部实现，调用方无感。
export * as dialog from './dialog'
export * as share from './share'
export * as scroll from './scroll'
export * as session from './session'
