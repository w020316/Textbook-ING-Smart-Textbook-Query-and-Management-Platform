/**
 * Neon 数据库自动创建脚本
 * 通过 Neon API 创建项目和数据库
 *
 * 使用方式：
 *   set NEON_API_KEY=your-api-key
 *   node scripts/create-neon-db.cjs
 *
 * Neon API Key 获取：https://console.neon.tech/app/settings/api-keys
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const NEON_API_BASE = 'https://console.neon.tech/api/v2';
const PROJECT_NAME = 'textbook-ing';
const DB_NAME = 'textbook_ing';

function log(msg) {
  console.log(`[Neon] ${msg}`);
}

function error(msg) {
  console.error(`[Neon ERROR] ${msg}`);
}

async function neonRequest(method, path, body) {
  const apiKey = process.env.NEON_API_KEY;
  if (!apiKey) {
    throw new Error('NEON_API_KEY 环境变量未设置。请在 https://console.neon.tech/app/settings/api-keys 获取');
  }

  const url = `${NEON_API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`Neon API ${method} ${path} 失败 (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  log('开始创建 Neon 数据库...');

  // 1. 创建项目
  log(`创建项目: ${PROJECT_NAME}`);
  const projectBody = {
    project: {
      name: PROJECT_NAME,
      region_id: 'aws-ap-southeast-1', // 新加坡区域，国内访问较优
      pg_version: 16,
    },
  };

  let project;
  try {
    project = await neonRequest('POST', '/projects', projectBody);
    log(`项目创建成功: ${project.project.id}`);
  } catch (err) {
    // 项目可能已存在，尝试查找
    log(`创建项目失败（可能已存在）: ${err.message}`);
    log('尝试查找现有项目...');
    const projects = await neonRequest('GET', '/projects?search=' + PROJECT_NAME);
    const existing = projects.projects?.find(p => p.project.name === PROJECT_NAME);
    if (!existing) {
      throw new Error('无法创建项目且找不到现有项目');
    }
    project = existing;
    log(`找到现有项目: ${project.project.id}`);
  }

  const projectId = project.project.id;
  const branchId = project.branches?.[0]?.branch?.id || project.default_branch_id;
  const endpoint = project.endpoints?.[0]?.endpoint;

  if (!endpoint) {
    throw new Error('无法获取数据库端点信息');
  }

  const connectionString = `postgresql://${endpoint.host}:5432/${DB_NAME}?sslmode=require`;
  const directConnString = `postgresql://${endpoint.host}:5432/${DB_NAME}?sslmode=require`;

  log('数据库连接信息:');
  log(`  Project ID: ${projectId}`);
  log(`  Branch ID: ${branchId}`);
  log(`  Host: ${endpoint.host}`);

  // 2. 获取完整的连接字符串（包含用户名和密码）
  // Neon 在创建项目时会返回 connection URIs
  let poolerUrl = project.connection_uris?.[0]?.connection_uri;
  let directUrl = project.connection_uris?.[0]?.connection_uri;

  // 如果没有返回 connection_uri，需要通过角色获取
  if (!poolerUrl) {
    log('获取数据库角色信息...');
    const roles = await neonRequest('GET', `/projects/${projectId}/branches/${branchId}/roles`);
    const role = roles.roles?.[0]?.role;
    if (role) {
      const password = role.password || '';
      // 构建连接字符串
      const host = endpoint.host;
      poolerUrl = `postgresql://${role.name}:${password}@${host}/neondb?sslmode=require`;
      directUrl = `postgresql://${role.name}:${password}@${host}/neondb?sslmode=require`;
    }
  }

  if (!poolerUrl) {
    throw new Error('无法获取数据库连接字符串');
  }

  // 为 Serverless 添加 pgbouncer 参数
  if (!poolerUrl.includes('pgbouncer')) {
    poolerUrl = poolerUrl.replace('?', '?pgbouncer=true&connect_timeout=15&');
    poolerUrl = poolerUrl.replace('&&', '&');
    if (poolerUrl.endsWith('&')) {
      poolerUrl = poolerUrl.slice(0, -1);
    }
  }

  log(`连接字符串已获取（池化）: ${poolerUrl.replace(/:[^@]+@/, ':****@')}`);

  // 3. 写入 .env 文件
  const envPath = path.join(process.cwd(), '.env');
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  const envContent = `# 自动生成的环境变量 - 请勿提交到 Git
# Neon PostgreSQL 连接字符串（池化，用于 Serverless）
DATABASE_URL="${poolerUrl}"

# Neon PostgreSQL 直连字符串（用于 Prisma 迁移）
DIRECT_URL="${directUrl}"

# JWT 密钥
JWT_SECRET="${jwtSecret}"

# 前端 API 基础路径
VITE_API_BASE="/api"
`;

  fs.writeFileSync(envPath, envContent, 'utf8');
  log(`环境变量已写入: ${envPath}`);
  log(`JWT_SECRET 已自动生成 (${jwtSecret.length} 字符)`);

  // 4. 输出 Vercel 环境变量配置命令
  console.log('\n========================================');
  console.log('Vercel 环境变量配置（请记录）：');
  console.log('========================================');
  console.log(`DATABASE_URL=${poolerUrl}`);
  console.log(`DIRECT_URL=${directUrl}`);
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`VITE_API_BASE=/api`);
  console.log('========================================\n');

  log('Neon 数据库创建完成！');
  return { poolerUrl, directUrl, jwtSecret };
}

main().catch(err => {
  error(err.message);
  process.exit(1);
});
