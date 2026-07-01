/**
 * 准备 Vercel 项目：创建项目 + 配置环境变量
 * 然后用 Vercel CLI 部署本地代码
 */
const fs = require('fs');

const log = (msg) => console.log(`[prep] ${msg}`);

const VERCEL_API_BASE = 'https://api.vercel.com';
const PROJECT_NAME = 'textbook-ing';

async function vercelRequest(token, method, path, body, extraHeaders = {}) {
  const url = `${VERCEL_API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`Vercel API ${method} ${path} 失败 (${res.status}): ${JSON.stringify(data).slice(0, 500)}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function main() {
  const creds = JSON.parse(fs.readFileSync('.deploy-creds.json', 'utf8'));
  const token = creds.vercelToken;
  if (!token) throw new Error('缺少 vercelToken');

  // 读取 .env
  const envContent = fs.readFileSync('.env', 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)="?(.+?)"?\s*$/);
    if (m) envVars[m[1]] = m[2];
  });
  log(`读取到环境变量: ${Object.keys(envVars).join(', ')}`);

  // 1. 获取用户信息
  log('\n===== 获取用户信息 =====');
  const user = await vercelRequest(token, 'GET', '/v2/user');
  log(`用户: ${user.user.username} (${user.user.email})`);

  // 2. 检查 team
  let teamId = null;
  try {
    const teams = await vercelRequest(token, 'GET', '/v2/teams');
    if (teams.teams && teams.teams.length > 0) {
      teamId = teams.teams[0].id;
      log(`Team: ${teams.teams[0].name} (${teamId})`);
    } else {
      log('个人账号（无 team）');
    }
  } catch (e) {
    log('无 team');
  }
  const query = teamId ? `?teamId=${teamId}` : '';

  // 3. 创建或获取项目
  log('\n===== 创建/获取项目 =====');
  let project;
  try {
    project = await vercelRequest(token, 'GET', `/v9/projects/${PROJECT_NAME}${query}`);
    log(`项目已存在: ${project.id} (${project.name})`);
  } catch (e) {
    if (e.status !== 404) throw e;
    log(`项目不存在，创建新项目: ${PROJECT_NAME}`);
    project = await vercelRequest(token, 'POST', `/v11/projects${query}`, {
      name: PROJECT_NAME,
      framework: 'vite',
    });
    log(`✓ 项目创建: ${project.id}`);
  }
  const projectId = project.id;

  // 4. 配置环境变量
  log('\n===== 配置环境变量 =====');
  // 先获取现有 env
  let existingEnvs = [];
  try {
    const envList = await vercelRequest(token, 'GET', `/v9/projects/${projectId}/env${query}`);
    existingEnvs = envList.envs || [];
  } catch (e) {}

  const envsToSet = [
    { key: 'DATABASE_URL', value: envVars.DATABASE_URL, type: 'encrypted' },
    { key: 'DIRECT_URL', value: envVars.DIRECT_URL, type: 'encrypted' },
    { key: 'JWT_SECRET', value: envVars.JWT_SECRET, type: 'encrypted' },
    { key: 'VITE_API_BASE', value: '/api', type: 'plain' },
  ];

  for (const env of envsToSet) {
    if (!env.value) {
      log(`  跳过 ${env.key}（值为空）`);
      continue;
    }
    const found = existingEnvs.find(e => e.key === env.key);
    const body = {
      key: env.key,
      value: env.value,
      target: ['production', 'preview', 'development'],
      type: env.type,
    };
    try {
      if (found) {
        await vercelRequest(token, 'PATCH', `/v9/projects/${projectId}/env/${found.id}${query}`, body);
        log(`  ✓ 更新 ${env.key}`);
      } else {
        await vercelRequest(token, 'POST', `/v10/projects/${projectId}/env${query}`, body);
        log(`  ✓ 创建 ${env.key}`);
      }
    } catch (err) {
      log(`  ✗ ${env.key} 失败: ${err.message.slice(0, 200)}`);
    }
  }

  // 5. 保存项目信息
  creds.vercelProject = {
    id: projectId,
    name: PROJECT_NAME,
    teamId,
  };
  fs.writeFileSync('.deploy-creds.json', JSON.stringify(creds, null, 2), 'utf8');
  log('\n✓ 项目准备完成');
  log(`项目 ID: ${projectId}`);
  log(`项目名: ${PROJECT_NAME}`);
  log(`Team ID: ${teamId || '个人'}`);
  log('\n下一步: 用 Vercel CLI 部署代码');
  log(`  vercel deploy --prod --yes --token=<token> --name=${PROJECT_NAME}`);
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
