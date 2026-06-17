#!/usr/bin/env node
// 本地批量生成邀请码。
//
// 用法：
//   INVITE_SECRET=xxxxx node scripts/gen-invite.mjs        # 生成 5 个
//   INVITE_SECRET=xxxxx node scripts/gen-invite.mjs 10     # 生成 10 个
//   node scripts/gen-invite.mjs 10                          # 自动读 .env.local
//
// 生成的码由 HMAC-SHA256(INVITE_SECRET, prefix) 派生；不需要落库，
// /api/redeem 会用同一 secret 重新签名做常量时间比对。
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { generate } from '../api/_hmac.mjs'

// 简易 .env.local 解析（避免引入 dotenv 依赖）
function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    const [, k, v] = m
    if (process.env[k]) continue // 不覆盖外部传入
    process.env[k] = v.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
  }
}

loadEnvLocal()

const secret = process.env.INVITE_SECRET
if (!secret) {
  console.error('❌ 缺少 INVITE_SECRET。请在 .env.local 设置，或通过环境变量传入。')
  console.error('   生成方法：openssl rand -hex 32')
  process.exit(1)
}

const n = Math.max(1, Math.min(100, Number(process.argv[2]) || 5))
const codes = new Set()
while (codes.size < n) codes.add(generate(secret))

console.log(`\n生成 ${n} 枚邀请码：\n`)
for (const c of codes) console.log('  ' + c)
console.log(`\n复制到抖音评论区或私信发给用户。\n`)
