// 教材ING 数据库种子数据
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始种子数据初始化...')

  // ==================== 管理员 ====================
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@textbook-ing.com' },
    update: {},
    create: {
      email: 'admin@textbook-ing.com',
      password: adminPassword,
      name: '管理员',
      role: 'ADMIN',
      points: 9999,
      emailVerified: new Date(),
    },
  })
  console.log(`✅ 管理员账号: admin@textbook-ing.com / admin123`)

  // ==================== 学院 ====================
  const colleges = [
    { name: '计算机科学与技术学院', code: 'CS', sort: 1 },
    { name: '电子信息工程学院', code: 'EE', sort: 2 },
    { name: '机械工程学院', code: 'ME', sort: 3 },
    { name: '经济管理学院', code: 'EM', sort: 4 },
    { name: '外国语学院', code: 'FL', sort: 5 },
    { name: '数学与统计学院', code: 'MS', sort: 6 },
    { name: '化学与化工学院', code: 'CHE', sort: 7 },
    { name: '文学与新闻传播学院', code: 'LN', sort: 8 },
  ]

  for (const c of colleges) {
    await prisma.college.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    })
  }
  console.log(`✅ 学院: ${colleges.length} 个`)

  // ==================== 专业 ====================
  const majorsData = [
    { name: '计算机科学与技术', code: 'CS01', collegeCode: 'CS' },
    { name: '软件工程', code: 'CS02', collegeCode: 'CS' },
    { name: '人工智能', code: 'CS03', collegeCode: 'CS' },
    { name: '电子信息工程', code: 'EE01', collegeCode: 'EE' },
    { name: '通信工程', code: 'EE02', collegeCode: 'EE' },
    { name: '机械设计制造及其自动化', code: 'ME01', collegeCode: 'ME' },
    { name: '车辆工程', code: 'ME02', collegeCode: 'ME' },
    { name: '工商管理', code: 'EM01', collegeCode: 'EM' },
    { name: '会计学', code: 'EM02', collegeCode: 'EM' },
    { name: '金融学', code: 'EM03', collegeCode: 'EM' },
    { name: '英语', code: 'FL01', collegeCode: 'FL' },
    { name: '日语', code: 'FL02', collegeCode: 'FL' },
    { name: '数学与应用数学', code: 'MS01', collegeCode: 'MS' },
    { name: '信息与计算科学', code: 'MS02', collegeCode: 'MS' },
    { name: '化学工程', code: 'CHE01', collegeCode: 'CHE' },
    { name: '应用化学', code: 'CHE02', collegeCode: 'CHE' },
    { name: '汉语言文学', code: 'LN01', collegeCode: 'LN' },
    { name: '新闻学', code: 'LN02', collegeCode: 'LN' },
  ]

  const majorRecords = []
  for (const m of majorsData) {
    const college = await prisma.college.findUnique({ where: { code: m.collegeCode } })
    if (!college) continue
    const major = await prisma.major.upsert({
      where: { code: m.code },
      update: {},
      create: { name: m.name, code: m.code, collegeId: college.id },
    })
    majorRecords.push(major)
  }
  console.log(`✅ 专业: ${majorRecords.length} 个`)

  // ==================== 班级 ====================
  const grades = [2023, 2024, 2025]
  let classCount = 0
  for (const major of majorRecords) {
    for (const grade of grades) {
      for (let i = 1; i <= 2; i++) {
        await prisma.class.create({
          data: { name: `${major.name}${grade}级${i}班`, grade, majorId: major.id },
        })
        classCount++
      }
    }
  }
  console.log(`✅ 班级: ${classCount} 个`)

  // ==================== 学期 ====================
  const semesters = [
    { name: '2023-2024学年第一学期', start: '2023-09-04', end: '2024-01-14', weeks: 18 },
    { name: '2023-2024学年第二学期', start: '2024-02-26', end: '2024-07-07', weeks: 18 },
    { name: '2024-2025学年第一学期', start: '2024-09-02', end: '2025-01-12', weeks: 18 },
    { name: '2024-2025学年第二学期', start: '2025-02-24', end: '2025-07-06', weeks: 18 },
    { name: '2025-2026学年第一学期', start: '2025-09-01', end: '2026-01-11', weeks: 18 },
    { name: '2026-2027学年第一学期', start: '2026-08-31', end: '2027-01-10', weeks: 18, active: true },
  ]

  const semesterRecords = []
  for (const s of semesters) {
    const sem = await prisma.semester.create({
      data: {
        name: s.name,
        startDate: new Date(s.start),
        endDate: new Date(s.end),
        totalWeeks: s.weeks,
        isActive: s.active || false,
      },
    })
    semesterRecords.push(sem)
  }
  console.log(`✅ 学期: ${semesterRecords.length} 个`)

  // ==================== 教学周（当前学期）====================
  const activeSem = semesterRecords[semesterRecords.length - 1]
  const weekEvents = [
    { week: 1, event: '开学注册', type: 'START' },
    { week: 2, event: '正式上课', type: 'NORMAL' },
    { week: 9, event: '期中考试', type: 'EXAM' },
    { week: 10, event: '期中考试', type: 'EXAM' },
    { week: 18, event: '期末考试', type: 'EXAM' },
    { week: 19, event: '寒假开始', type: 'HOLIDAY' },
  ]

  for (let w = 1; w <= 18; w++) {
    const weekStart = new Date(activeSem.startDate)
    weekStart.setDate(weekStart.getDate() + (w - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const ev = weekEvents.find(e => e.week === w)
    await prisma.calendarWeek.create({
      data: {
        semesterId: activeSem.id,
        weekNumber: w,
        startDate: weekStart,
        endDate: weekEnd,
        event: ev?.event || null,
        eventType: ev?.type || 'NORMAL',
      },
    })
  }
  console.log(`✅ 教学周: 18 周`)

  // ==================== 课程和教材 ====================
  const courses = [
    { name: '数据结构', code: 'CS201', credits: 4, textbooks: [
      { title: '数据结构（C语言版）', author: '严蔚敏', publisher: '清华大学出版社', isbn: '9787302023614', price: 29.00 }
    ]},
    { name: '计算机网络', code: 'CS301', credits: 3, textbooks: [
      { title: '计算机网络（第8版）', author: '谢希仁', publisher: '电子工业出版社', isbn: '9787121364486', price: 49.00 }
    ]},
    { name: '操作系统', code: 'CS302', credits: 4, textbooks: [
      { title: '操作系统概念（第9版）', author: 'Abraham Silberschatz', publisher: '机械工业出版社', isbn: '9787111637355', price: 89.00 }
    ]},
    { name: '软件工程', code: 'CS303', credits: 3, textbooks: [
      { title: '软件工程（第4版）', author: '钱乐秋', publisher: '清华大学出版社', isbn: '9787302519148', price: 59.00 }
    ]},
    { name: '人工智能导论', code: 'CS401', credits: 3, textbooks: [
      { title: '人工智能：一种现代方法（第4版）', author: 'Stuart Russell', publisher: '人民邮电出版社', isbn: '9787115567868', price: 199.00 }
    ]},
    { name: '数据库系统概论', code: 'CS304', credits: 4, textbooks: [
      { title: '数据库系统概论（第6版）', author: '王珊', publisher: '高等教育出版社', isbn: '9787040514306', price: 49.80 }
    ]},
    { name: '高等数学', code: 'MS101', credits: 5, textbooks: [
      { title: '高等数学（第七版）上册', author: '同济大学数学系', publisher: '高等教育出版社', isbn: '9787040396638', price: 43.10 }
    ]},
    { name: '线性代数', code: 'MS102', credits: 3, textbooks: [
      { title: '线性代数（第6版）', author: '同济大学数学系', publisher: '高等教育出版社', isbn: '9787040516614', price: 26.40 }
    ]},
    { name: '模拟电子技术', code: 'EE201', credits: 4, textbooks: [
      { title: '模拟电子技术基础（第5版）', author: '童诗白', publisher: '高等教育出版社', isbn: '9787040396607', price: 46.80 }
    ]},
    { name: '信号与系统', code: 'EE301', credits: 4, textbooks: [
      { title: '信号与系统（第3版）', author: '郑君里', publisher: '高等教育出版社', isbn: '9787040317789', price: 56.30 }
    ]},
    { name: '机械原理', code: 'ME201', credits: 3, textbooks: [
      { title: '机械原理（第8版）', author: '孙桓', publisher: '高等教育出版社', isbn: '9787040454886', price: 49.50 }
    ]},
    { name: '西方经济学', code: 'EM201', credits: 3, textbooks: [
      { title: '西方经济学（微观部分·第8版）', author: '高鸿业', publisher: '中国人民大学出版社', isbn: '9787300267385', price: 48.00 }
    ]},
    { name: '综合英语', code: 'FL101', credits: 4, textbooks: [
      { title: '新编英语教程（第3版）第1册', author: '李观仪', publisher: '上海外语教育出版社', isbn: '9787544648921', price: 45.00 }
    ]},
    { name: '无机化学', code: 'CHE101', credits: 4, textbooks: [
      { title: '无机化学（第4版）上册', author: '宋天佑', publisher: '高等教育出版社', isbn: '9787040446812', price: 39.60 }
    ]},
    { name: '中国现代文学史', code: 'LN201', credits: 3, textbooks: [
      { title: '中国现代文学史（第4版）', author: '朱栋霖', publisher: '北京大学出版社', isbn: '9787301247088', price: 59.00 }
    ]},
  ]

  let courseCount = 0
  let textbookCount = 0
  for (const c of courses) {
    for (const sem of semesterRecords.slice(-3)) {
      const course = await prisma.course.create({
        data: { name: c.name, code: c.code, credits: c.credits, semesterId: sem.id },
      })
      courseCount++
      for (const tb of c.textbooks) {
        await prisma.textbook.create({
          data: {
            title: tb.title,
            author: tb.author,
            publisher: tb.publisher,
            isbn: tb.isbn,
            price: tb.price,
            courseId: course.id,
          },
        })
        textbookCount++
      }
    }
  }
  console.log(`✅ 课程: ${courseCount} 个, 教材: ${textbookCount} 个`)

  // ==================== 新闻分类 ====================
  const categories = [
    { name: '通知公告', slug: 'notice', sort: 1 },
    { name: '活动资讯', slug: 'activity', sort: 2 },
    { name: '系统更新', slug: 'system', sort: 3 },
    { name: '学习资源', slug: 'resource', sort: 4 },
    { name: '校园生活', slug: 'campus', sort: 5 },
  ]

  const catRecords = []
  for (const c of categories) {
    const cat = await prisma.newsCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    })
    catRecords.push(cat)
  }
  console.log(`✅ 新闻分类: ${catRecords.length} 个`)

  // ==================== 新闻文章 ====================
  const systemCat = catRecords.find(c => c.slug === 'system')!
  const noticeCat = catRecords.find(c => c.slug === 'notice')!

  const newsArticles = [
    {
      title: '教材ING V11.3.0 版本发布',
      content: '教材ING V11.3.0 版本发布！\n\n本次更新内容如下：\n\n### 新增功能\n\n登录页忘记密码功能\n\n### 问题修复\n\n修复了若干已知问题，提升系统稳定性\n\n感谢大家的支持与反馈，我们会持续优化产品体验！\n\n教材ING团队\n2026年7月1日',
      summary: '教材ING V11.3.0 版本发布！本次更新新增登录页忘记密码功能，修复若干已知问题。',
      categoryId: systemCat.id,
      isPinned: true,
      createdAt: new Date('2026-07-01T16:27:00'),
    },
    {
      title: '教材ING V11.2.1 版本发布',
      content: '教材ING V11.2.1 版本发布！\n\n### 新增功能\n\n未读消息自动滚动栏显示\n\n### 问题修复\n\n修复了若干已知问题，提升系统稳定性\n\n教材ING团队\n2026年6月29日',
      summary: '新增未读消息自动滚动栏显示，修复若干已知问题。',
      categoryId: systemCat.id,
      isPinned: true,
      createdAt: new Date('2026-06-29T18:36:00'),
    },
    {
      title: '教材ING V11.2.0 版本发布',
      content: '教材ING V11.2.0 版本发布！\n\n### 新增功能\n\n首页添加新闻资讯栏目\n\n### 功能优化\n\n优化教材查询页热门搜索显示\n\n### 问题修复\n\n修复了若干已知问题\n\n教材ING团队\n2026年6月29日',
      summary: '首页添加新闻资讯栏目，优化教材查询页热门搜索显示。',
      categoryId: systemCat.id,
      isPinned: true,
      createdAt: new Date('2026-06-29T16:29:00'),
    },
    {
      title: '2026年暑假放假通知',
      content: '各学院、各部门：\n\n现将2026年暑假放假安排通知如下：\n\n### 学生放假时间\n\n2026年7月9日（周四）至8月30日（周日）放假，8月30日返校报到，8月31日（周一）正式上课。\n\n### 校门开放调整\n\n7月13日早8:00起调整校门开放时间：\n- 东门、西门全天关闭\n- 北门正常通行\n\n8月28日早7:00起恢复正常。\n\n请各位同学注意安全，合理安排假期时间。\n\n教务处\n2026年6月29日',
      summary: '学生暑假时间：7月9日-8月30日放假，8月30日返校报到，8月31日正式上课。校门开放时间有调整。',
      categoryId: noticeCat.id,
      isPinned: true,
      createdAt: new Date('2026-06-29T10:00:00'),
    },
    {
      title: '教材ING V11.1.0 版本发布',
      content: '教材ING V11.1.0 版本发布！\n\n### 功能优化\n\n优化邮箱验证功能\n\n### 问题修复\n\n修复了若干已知问题\n\n教材ING团队\n6月25日',
      summary: '优化邮箱验证功能，修复若干已知问题。',
      categoryId: systemCat.id,
      isPinned: false,
      createdAt: new Date('2026-06-25T01:28:00'),
    },
    {
      title: '教材ING V11.0.0 重大版本发布',
      content: '教材ING V11.0.0 重大版本正式发布！\n\n这是教材ING平台的一次重大升级，全新的界面设计和功能体验。\n\n### 核心功能\n\n- 教材查询：支持多维度筛选\n- 校历查询：教学周安排一目了然\n- 新闻资讯：校园动态实时掌握\n- 用户系统：注册登录积分体系\n\n### 技术架构\n\n采用 Vue 3 + TypeScript + TailwindCSS 前端，Node.js Serverless 后端，PostgreSQL 数据库。\n\n感谢大家的支持！\n\n教材ING团队\n2026年6月24日',
      summary: '教材ING V11.0.0 重大版本发布！全新界面设计，核心功能包括教材查询、校历查询、新闻资讯、用户系统。',
      categoryId: systemCat.id,
      isPinned: false,
      createdAt: new Date('2026-06-24T02:38:00'),
    },
  ]

  for (const n of newsArticles) {
    await prisma.news.create({
      data: { ...n, authorId: admin.id, viewCount: Math.floor(Math.random() * 50) + 2 },
    })
  }
  console.log(`✅ 新闻文章: ${newsArticles.length} 篇`)

  // ==================== 热门搜索 ====================
  const hotSearches = [
    { keyword: '高等数学', count: 128 },
    { keyword: '数据结构', count: 95 },
    { keyword: '操作系统', count: 82 },
    { keyword: '计算机网络', count: 76 },
    { keyword: '线性代数', count: 65 },
    { keyword: '软件工程', count: 58 },
    { keyword: '数据库', count: 52 },
    { keyword: '英语', count: 41 },
  ]

  for (const h of hotSearches) {
    await prisma.hotSearch.create({ data: h })
  }
  console.log(`✅ 热门搜索: ${hotSearches.length} 条`)

  console.log('\n🎉 种子数据初始化完成！')
  console.log(`   管理员账号: admin@textbook-ing.com`)
  console.log(`   管理员密码: admin123`)
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
