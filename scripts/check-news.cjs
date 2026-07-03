/**
 * 直接查询数据库验证 News 数据
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('[1] 查询 News 总数...');
    const count = await prisma.news.count();
    console.log('    总数:', count);

    console.log('\n[2] 查询 News 列表（前3条）...');
    const list = await prisma.news.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
    console.log('    查询到', list.length, '条');
    if (list.length > 0) {
      console.log('    第一条:', JSON.stringify({
        id: list[0].id,
        title: list[0].title,
        categoryId: list[0].categoryId,
        authorId: list[0].authorId,
        isPinned: list[0].isPinned,
        category: list[0].category?.name,
      }));
    }

    console.log('\n[3] 查询置顶 News...');
    const pinned = await prisma.news.findMany({
      where: { isPinned: true },
      include: { category: true },
    });
    console.log('    置顶数:', pinned.length);

    console.log('\n[4] 查询非置顶 News...');
    const nonPinned = await prisma.news.findMany({
      where: { isPinned: false },
      include: { category: true },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
    console.log('    非置顶数:', nonPinned.length);

  } catch (err) {
    console.error('查询失败:', err.message);
    console.error('完整错误:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
