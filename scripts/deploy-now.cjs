/**
 * Vercel 部署脚本 - 使用 API 直接触发生产部署
 * 从 .env 读取数据库配置，从 .vercel-token 读取 token
 */
const fs = require('fs');
const path = require('path');

const VERCEL_API = 'https://api.vercel.com';
const PROJECT_NAME = 'textbook-ing';
const TEAM_ID = 'team_pdaobxPxJ2Bm369qHJh0WWQc'; // 从 .vercel/project.json 的 orgId

function log(msg) { console.log(`[部署] ${msg}`); }
function err(msg) { console.error(`[部署错误] ${msg}`); }

async function vercelApi(method, apiPath, body) {
  const token = fs.readFileSync(path.join(__dirname, '.vercel-token'), 'utf8').trim();
  const url = `${VERCEL_API}${apiPath}${apiPath.includes('?') ? '&' : '?'}teamId=${TEAM_ID}`;

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  return { ok: res.ok, status: res.status, data };
}

function parseEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) {
      env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

async function main() {
  log('开始 Vercel 部署...');

  const env = parseEnv();
  log(`DATABASE_URL: ${env.DATABASE_URL ? '已配置' : '缺失'}`);
  log(`JWT_SECRET: ${env.JWT_SECRET ? '已配置' : '缺失'}`);

  // 1. 检查项目信息
  log('\n[1] 检查项目信息...');
  const projectResp = await vercelApi('GET', `/v9/projects/${PROJECT_NAME}`);
  if (!projectResp.ok) {
    err(`获取项目信息失败: ${projectResp.status} ${JSON.stringify(projectResp.data).substring(0, 200)}`);
    process.exit(1);
  }

  const project = projectResp.data;
  log(`项目ID: ${project.id}`);
  log(`项目名: ${project.name}`);
  log(`Git 集成: ${project.link ? `${project.link.type} - ${project.link.repo}` : '未连接'}`);
  if (project.link) {
    log(`  repoId: ${project.link.repoId}`);
    log(`  最后部署 commit: ${project.link?.productionBranch || 'N/A'}`);
  }

  // 2. 确保环境变量已配置
  log('\n[2] 检查/更新环境变量...');
  const envVars = [
    { key: 'DATABASE_URL', value: env.DATABASE_URL, target: ['production', 'preview', 'development'], type: 'encrypted' },
    { key: 'DIRECT_URL', value: env.DIRECT_URL || env.DATABASE_URL, target: ['production', 'preview', 'development'], type: 'encrypted' },
    { key: 'JWT_SECRET', value: env.JWT_SECRET, target: ['production', 'preview', 'development'], type: 'encrypted' },
    { key: 'VITE_API_BASE', value: '/api', target: ['production', 'preview', 'development'], type: 'plain' },
  ];

  // 获取现有环境变量
  const envListResp = await vercelApi('GET', `/v9/projects/${project.id}/env`);
  const existingEnvs = envListResp.ok ? (envListResp.data.envs || []) : [];

  for (const envVar of envVars) {
    if (!envVar.value && envVar.key !== 'VITE_API_BASE') {
      log(`  跳过 ${envVar.key}（值为空）`);
      continue;
    }

    const existing = existingEnvs.find(e => e.key === envVar.key);
    try {
      if (existing) {
        // 更新
        const updResp = await vercelApi('PATCH', `/v9/projects/${project.id}/env/${existing.id}`, envVar);
        if (updResp.ok) log(`  更新 ${envVar.key} ✓`);
        else log(`  更新 ${envVar.key} 失败: ${updResp.status}`);
      } else {
        // 创建
        const createResp = await vercelApi('POST', `/v10/projects/${project.id}/env`, envVar);
        if (createResp.ok) log(`  创建 ${envVar.key} ✓`);
        else log(`  创建 ${envVar.key} 失败: ${createResp.status}`);
      }
    } catch (e) {
      log(`  配置 ${envVar.key} 异常: ${e.message}`);
    }
  }

  // 3. 触发部署
  log('\n[3] 触发生产部署...');

  let deployment;
  if (project.link && project.link.repoId) {
    // 有 Git 集成，通过 gitSource 部署
    log('通过 GitHub 集成部署最新 main 分支...');
    const deployResp = await vercelApi('POST', '/v13/deployments', {
      name: PROJECT_NAME,
      project: PROJECT_NAME,
      target: 'production',
      gitSource: {
        type: 'github',
        repoId: project.link.repoId,
        ref: 'main',
      },
    });

    if (!deployResp.ok) {
      err(`触发部署失败: ${deployResp.status} ${JSON.stringify(deployResp.data).substring(0, 300)}`);
      process.exit(1);
    }
    deployment = deployResp.data;
  } else {
    err('项目未连接 GitHub 仓库，无法通过 Git 部署');
    log('请在 Vercel dashboard 连接 GitHub 仓库 w020316/Textbook-ING-Smart-Textbook-Query-and-Management-Platform');
    process.exit(1);
  }

  log(`部署已触发: ${deployment.id}`);
  log(`部署URL: https://vercel.com/${TEAM_ID}/${PROJECT_NAME}/${deployment.id}`);
  log(`Inspect: ${deployment.inspectorUrl}`);

  // 4. 等待部署完成
  log('\n[4] 等待部署完成...');
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 5000));
    attempts++;

    try {
      const statusResp = await vercelApi('GET', `/v13/deployments/${deployment.id}`);
      if (statusResp.ok) {
        const state = statusResp.data.readyState;
        log(`  状态 (${attempts}/${maxAttempts}): ${state}`);

        if (state === 'READY') {
          log('\n========================================');
          log('部署成功！');
          log(`访问地址: https://${PROJECT_NAME}.vercel.app`);
          log(`部署URL: ${statusResp.data.url}`);
          log('========================================\n');
          return;
        } else if (state === 'ERROR' || state === 'CANCELED') {
          err(`部署失败: ${state}`);
          err(`日志: ${statusResp.data.inspectorUrl}`);
          process.exit(1);
        }
      }
    } catch (e) {
      log(`  查询状态异常: ${e.message}`);
    }
  }

  err('部署超时');
  process.exit(1);
}

main().catch(e => {
  err(e.message);
  process.exit(1);
});
