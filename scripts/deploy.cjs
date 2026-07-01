/**
 * 一站式部署脚本
 *
 * 执行流程：
 *   1. 创建 Neon 数据库（需要 NEON_API_KEY）
 *   2. 执行 Prisma 迁移和种子数据
 *   3. 部署到 Vercel（需要 VERCEL_TOKEN）
 *
 * 使用方式：
 *   set NEON_API_KEY=your-neon-key
 *   set VERCEL_TOKEN=your-vercel-token
 *   node scripts/deploy.cjs
 *
 * 凭据获取：
 *   - Neon API Key: https://console.neon.tech/app/settings/api-keys
 *   - Vercel Token: https://vercel.com/account/tokens
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const NEON_API_BASE = 'https://console.neon.tech/api/v2';
const VERCEL_API_BASE = 'https://api.vercel.com';
const PROJECT_NAME = 'textbook-ing';
const REPO = 'w020316/Textbook-ING-Smart-Textbook-Query-and-Management-Platform';

function log(msg) {
  console.log(`\n[Deploy] ${msg}`);
}

function error(msg) {
  console.error(`\n[Deploy ERROR] ${msg}`);
}

function runCommand(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    shell: true,
    ...options,
  });
  return {
    stdout: result.stdout?.trim() || '',
    stderr: result.stderr?.trim() || '',
    status: result.status,
  };
}

// ==================== Neon 数据库 ====================

async function neonRequest(method, path, body) {
  const apiKey = process.env.NEON_API_KEY;
  if (!apiKey) throw new Error('NEON_API_KEY 未设置');

  const res = await fetch(`${NEON_API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) {
    throw new Error(`Neon API ${method} ${path} 失败 (${res.status}): ${typeof data === 'object' ? JSON.stringify(data).slice(0, 300) : data}`);
  }
  return data;
}

async function createNeonDatabase() {
  log('========== 步骤 1: 创建 Neon 数据库 ==========');

  // 检查是否已有 .env 文件
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('DATABASE_URL=') && !envContent.includes('your-')) {
      log('.env 文件已存在且包含 DATABASE_URL，跳过数据库创建');
      const dbUrl = envContent.match(/DATABASE_URL="([^"]+)"/)?.[1];
      const directUrl = envContent.match(/DIRECT_URL="([^"]+)"/)?.[1];
      const jwtSecret = envContent.match(/JWT_SECRET="([^"]+)"/)?.[1];
      if (dbUrl && jwtSecret) {
        return { dbUrl, directUrl: directUrl || dbUrl, jwtSecret };
      }
    }
  }

  log(`创建 Neon 项目: ${PROJECT_NAME}`);
  let project;
  try {
    project = await neonRequest('POST', '/projects', {
      project: {
        name: PROJECT_NAME,
        region_id: 'aws-ap-southeast-1',
        pg_version: 16,
      },
    });
    log(`项目创建成功: ${project.project.id}`);
  } catch (err) {
    log(`创建项目失败: ${err.message}`);
    log('尝试查找现有项目...');
    const projects = await neonRequest('GET', `/projects?search=${PROJECT_NAME}`);
    const existing = projects.projects?.find(p => p.project.name === PROJECT_NAME);
    if (!existing) throw new Error('无法创建项目且找不到现有项目');
    project = existing;
    log(`找到现有项目: ${project.project.id}`);
  }

  const projectId = project.project.id;
  const branchId = project.branches?.[0]?.branch?.id || project.default_branch_id;
  const endpoint = project.endpoints?.[0]?.endpoint;

  if (!endpoint) throw new Error('无法获取数据库端点信息');

  let poolerUrl = project.connection_uris?.[0]?.connection_uri;
  let directUrl = project.connection_uris?.[0]?.connection_uri;

  if (!poolerUrl) {
    log('获取数据库角色信息...');
    const roles = await neonRequest('GET', `/projects/${projectId}/branches/${branchId}/roles`);
    const role = roles.roles?.[0]?.role;
    if (role) {
      poolerUrl = `postgresql://${role.name}:${role.password}@${endpoint.host}/neondb?sslmode=require`;
      directUrl = `postgresql://${role.name}:${role.password}@${endpoint.host}/neondb?sslmode=require`;
    }
  }

  if (!poolerUrl) throw new Error('无法获取数据库连接字符串');

  // 添加 pgbouncer 参数
  if (!poolerUrl.includes('pgbouncer')) {
    poolerUrl = poolerUrl.replace('?', '?pgbouncer=true&connect_timeout=15&');
    if (poolerUrl.endsWith('&')) poolerUrl = poolerUrl.slice(0, -1);
    poolerUrl = poolerUrl.replace('&&', '&');
  }

  const jwtSecret = crypto.randomBytes(32).toString('hex');

  const envContent = `# 自动生成的环境变量 - 请勿提交到 Git
DATABASE_URL="${poolerUrl}"
DIRECT_URL="${directUrl}"
JWT_SECRET="${jwtSecret}"
VITE_API_BASE="/api"
`;
  fs.writeFileSync(envPath, envContent, 'utf8');
  log(`环境变量已写入 .env`);
  log(`数据库 Host: ${endpoint.host}`);

  return { dbUrl: poolerUrl, directUrl, jwtSecret };
}

// ==================== Prisma 迁移 ====================

function runPrismaMigration() {
  log('========== 步骤 2: 执行 Prisma 迁移 ==========');

  // 生成 Prisma Client
  log('生成 Prisma Client...');
  let result = runCommand('npx', ['prisma', 'generate']);
  if (result.status !== 0) {
    error('Prisma generate 失败');
    error(result.stderr || result.stdout);
    throw new Error('Prisma generate 失败');
  }
  log('Prisma Client 生成完成 ✓');

  // 推送 schema 到数据库
  log('推送数据库 Schema...');
  result = runCommand('npx', ['prisma', 'db', 'push', '--accept-data-loss']);
  if (result.status !== 0) {
    error('Prisma db push 失败');
    error(result.stderr || result.stdout);
    throw new Error('Prisma db push 失败');
  }
  log('数据库 Schema 推送完成 ✓');

  // 执行种子数据
  log('写入种子数据...');
  result = runCommand('npx', ['tsx', 'prisma/seed.ts']);
  if (result.status !== 0) {
    error('种子数据写入失败');
    error(result.stderr || result.stdout);
    throw new Error('种子数据写入失败');
  }
  log('种子数据写入完成 ✓');
}

// ==================== Vercel 部署 ====================

async function vercelRequest(method, path, body, token) {
  const res = await fetch(`${VERCEL_API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) {
    throw new Error(`Vercel API ${method} ${path} 失败 (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

async function deployToVercel(envVars) {
  log('========== 步骤 3: 部署到 Vercel ==========');

  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    log('VERCEL_TOKEN 未设置，跳过 Vercel 部署');
    log('请在 https://vercel.com/account/tokens 获取 token 后运行:');
    log('  set VERCEL_TOKEN=your-token');
    log('  node scripts/deploy-vercel.cjs');
    return null;
  }

  // 获取 team
  let teamId = null;
  try {
    const teams = await vercelRequest('GET', '/v2/teams', null, token);
    if (teams.teams?.length > 0) {
      teamId = teams.teams[0].id;
    }
  } catch {}

  const query = teamId ? `?teamId=${teamId}` : '';

  // 创建或获取项目
  let project;
  try {
    project = await vercelRequest('GET', `/v9/projects/${PROJECT_NAME}${query}`, null, token);
    log(`项目已存在: ${project.id}`);
  } catch {
    log(`创建新项目: ${PROJECT_NAME}`);
    project = await vercelRequest('POST', `/v11/projects${query}`, {
      name: PROJECT_NAME,
      framework: 'vite',
    }, token);
    log(`项目创建成功: ${project.id}`);
  }

  const projectId = project.id;

  // 配置环境变量
  log('配置环境变量...');
  const envList = [
    { key: 'DATABASE_URL', value: envVars.dbUrl, type: 'encrypted' },
    { key: 'DIRECT_URL', value: envVars.directUrl, type: 'encrypted' },
    { key: 'JWT_SECRET', value: envVars.jwtSecret, type: 'encrypted' },
    { key: 'VITE_API_BASE', value: '/api', type: 'plain' },
  ];

  for (const env of envList) {
    if (!env.value) continue;
    try {
      const existing = await vercelRequest('GET', `/v9/projects/${projectId}/env${query}`, null, token);
      const found = existing.envs?.find(e => e.key === env.key);
      const body = { ...env, target: ['production', 'preview', 'development'] };
      if (found) {
        await vercelRequest('PATCH', `/v9/projects/${projectId}/env/${found.id}${query}`, body, token);
        log(`  更新 ${env.key} ✓`);
      } else {
        await vercelRequest('POST', `/v10/projects/${projectId}/env${query}`, body, token);
        log(`  创建 ${env.key} ✓`);
      }
    } catch (err) {
      log(`  配置 ${env.key} 失败: ${err.message}`);
    }
  }

  // 检查 Git 集成
  if (project.link?.repo) {
    log('项目已连接 GitHub 仓库，触发部署...');
    const deployment = await vercelRequest('POST', `/v13/deployments${query}`, {
      name: PROJECT_NAME,
      project: PROJECT_NAME,
      target: 'production',
      gitSource: {
        type: 'github',
        repoId: project.link.repoId,
        ref: 'main',
      },
    }, token);

    log(`部署已触发: ${deployment.id}`);
    log(`监控地址: https://vercel.com/dashboard/deployments/${deployment.id}`);

    // 等待部署完成
    log('等待部署完成（最长 5 分钟）...');
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const status = await vercelRequest('GET', `/v13/deployments/${deployment.id}${query}`, null, token);
        log(`  状态 (${i + 1}/60): ${status.readyState}`);
        if (status.readyState === 'READY') {
          log(`部署成功！访问地址: ${status.url}`);
          return status.url;
        }
        if (status.readyState === 'ERROR' || status.readyState === 'CANCELED') {
          error(`部署失败: ${status.readyState}`);
          return null;
        }
      } catch (err) {
        log(`  查询状态失败: ${err.message}`);
      }
    }
    log('部署超时，请稍后在 Vercel 控制台查看状态');
    return null;
  } else {
    log('项目未连接 GitHub 仓库');
    log('请在 Vercel 网站连接 GitHub 仓库:');
    log(`  https://vercel.com/${teamId ? 'teams/' + teamId : ''}/projects/${PROJECT_NAME}/settings/git`);
    log('连接后，push 到 main 分支将自动触发部署');
    return null;
  }
}

// ==================== 主流程 ====================

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  教材ING 一站式部署脚本                       ║');
  console.log('║  Neon PostgreSQL + Prisma + Vercel            ║');
  console.log('╚══════════════════════════════════════════════╝');

  const hasNeonKey = !!process.env.NEON_API_KEY;
  const hasVercelToken = !!process.env.VERCEL_TOKEN;
  const hasDbUrl = !!process.env.DATABASE_URL || fs.existsSync(path.join(process.cwd(), '.env'));

  log(`环境检查:`);
  log(`  NEON_API_KEY: ${hasNeonKey ? '✓' : '✗'}`);
  log(`  VERCEL_TOKEN: ${hasVercelToken ? '✓' : '✗'}`);
  log(`  DATABASE_URL: ${hasDbUrl ? '✓ (已有)' : '✗'}`);

  let envVars;

  // 步骤 1: 创建 Neon 数据库
  if (hasNeonKey || hasDbUrl) {
    envVars = await createNeonDatabase();
  } else {
    error('需要 NEON_API_KEY 或已配置的 .env 文件');
    log('请设置环境变量:');
    log('  set NEON_API_KEY=your-neon-api-key  (从 https://console.neon.tech/app/settings/api-keys 获取)');
    log('  set VERCEL_TOKEN=your-vercel-token  (从 https://vercel.com/account/tokens 获取)');
    process.exit(1);
  }

  // 步骤 2: Prisma 迁移
  try {
    runPrismaMigration();
  } catch (err) {
    error(`Prisma 迁移失败: ${err.message}`);
    process.exit(1);
  }

  // 步骤 3: Vercel 部署
  if (hasVercelToken) {
    const url = await deployToVercel(envVars);
    if (url) {
      console.log('\n╔══════════════════════════════════════════════╗');
      console.log('║  部署完成！                                   ║');
      console.log(`║  访问地址: ${url.padEnd(33)}║`);
      console.log('╚══════════════════════════════════════════════╝');
    }
  } else {
    log('VERCEL_TOKEN 未设置，跳过 Vercel 部署');
    log('数据库已就绪，请手动部署到 Vercel:');
    log('  1. 访问 https://vercel.com/new');
    log(`  2. 导入 GitHub 仓库: ${REPO}`);
    log('  3. 添加环境变量（见 .env 文件）');
    log('  4. 点击 Deploy');
  }

  console.log('\n[Deploy] 部署流程结束');
}

main().catch(err => {
  error(err.message);
  process.exit(1);
});
