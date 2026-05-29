// 应用全局常量。集中放在这里方便修改与跨平台同步。

// 八字录入年份范围：下界看 lunar-typescript 1900+ 都支持，上界跟随当前年。
export const BAZI_YEAR_MIN = 1960
export const BAZI_YEAR_MAX = new Date().getFullYear()

// 测算历史保留条数（超过则截断旧的）。
export const HISTORY_MAX = 50
