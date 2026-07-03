/**
 * 测试 news 表查询性能和数据情况
 */
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient({ log: ['query', 'error', 'warn'] })

  try {
    console.log('=== 1. News count ===')
    const start1 = Date.now()
    const total = await prisma.news.count()
    console.log(`Total news: ${total}, took: ${Date.now() - start1}ms`)

    console.log('\n=== 2. News findMany (select, no include) ===')
    const start2 = Date.now()
    const allNews = await prisma.news.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip: 0,
      take: 10,
      select: {
        id: true,
        title: true,
        summary: true,
        coverImage: true,
        isPinned: true,
        viewCount: true,
        createdAt: true,
        categoryId: true,
      },
    })
    console.log(`News list: ${allNews.length} items, took: ${Date.now() - start2}ms`)
    if (allNews[0]) {
      console.log('First item keys:', Object.keys(allNews[0]))
      console.log('First item title:', allNews[0].title)
      console.log('First item summary length:', allNews[0].summary?.length || 0)
    }

    console.log('\n=== 3. News categories ===')
    const start3 = Date.now()
    const cats = await prisma.newsCategory.findMany({
      orderBy: { sort: 'asc' },
      include: { _count: { select: { news: true } } },
    })
    console.log(`Categories: ${cats.length} items, took: ${Date.now() - start3}ms`)

    console.log('\n=== 4. News with content length check ===')
    const newsWithContent = await prisma.news.findMany({
      select: { id: true, title: true, content: true, summary: true },
      take: 5,
    })
    for (const n of newsWithContent) {
      console.log(`  ${n.title}: content=${n.content?.length || 0} chars, summary=${n.summary?.length || 0} chars`)
    }

    console.log('\n=== 5. Simulate handleNewsList response ===')
    const start5 = Date.now()
    const totalPages = Math.ceil(total / 10)
    const pinned = allNews.filter(n => n.isPinned)
    const list = allNews.filter(n => !n.isPinned)
    const response = { pinned, list, total, page: 1, pageSize: 10, totalPages }
    const jsonStr = JSON.stringify(response)
    console.log(`Response JSON length: ${jsonStr.length} chars, took: ${Date.now() - start5}ms`)

  } catch (err) {
    console.error('ERROR:', err.message)
    console.error(err.stack)
  } finally {
    await prisma.$disconnect()
  }
}

main()
