/**
 * 数据库教材去重脚本
 * 清理种子数据中因课程多学期开设导致的重复教材记录
 * 保留每个 (title, author, publisher, isbn) 组合的第一条记录，删除其余重复项
 *
 * 用法：node scripts/dedup-textbooks.cjs
 * 环境变量：DATABASE_URL（从 prisma/.env 或 .env 读取）
 */
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('[dedup] 开始教材去重...')

    // 查询所有教材，按 (title, author, publisher, isbn) 分组
    // 按 id 排序（cuid 按创建时间递增，保留最早创建的）
    const allTextbooks = await prisma.textbook.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, title: true, author: true, publisher: true, isbn: true },
    })
    console.log(`[dedup] 总教材数: ${allTextbooks.length}`)

    const seen = new Map() // key -> firstId
    const toDelete = []

    for (const tb of allTextbooks) {
      const key = `${tb.title}||${tb.author}||${tb.publisher}||${tb.isbn}`
      if (seen.has(key)) {
        toDelete.push({ id: tb.id, key, title: tb.title })
      } else {
        seen.set(key, tb.id)
      }
    }

    console.log(`[dedup] 重复教材数: ${toDelete.length}`)
    if (toDelete.length === 0) {
      console.log('[dedup] 无重复数据，无需处理')
      return
    }

    // 删除重复项
    console.log('[dedup] 删除重复教材:')
    for (const d of toDelete) {
      console.log(`  - ${d.id} (${d.title})`)
      await prisma.textbook.delete({ where: { id: d.id } })
    }

    const remaining = await prisma.textbook.count()
    console.log(`[dedup] 去重完成，剩余教材: ${remaining}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('[dedup] 失败:', e.message)
  process.exit(1)
})
