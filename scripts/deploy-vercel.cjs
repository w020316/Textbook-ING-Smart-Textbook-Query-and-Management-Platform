/**
 * Vercel 自动部署脚本
 * 通过 Vercel REST API 创建项目、配置环境变量、触发部署
 *
 * 使用方式：
 *   set VERCEL_TOKEN=your-token
 *   set DATABASE_URL=postgresql://...
 *   set JWT_SECRET=your-secret
 *   node scripts/deploy-vercel.cjs
 *
 * Vercel Token 获取：https://vercel.com/account/tokens
 */

const fs = require('fs');
const path = require('path');

const VERCEL_API_BASE = 'https://api.vercel.com';
const PROJECT_NAME = 'textbook-ing';
const REPO = 'w020316/Textbook-ING-Smart-Textbook-Query-and-Management-Platform';

function log(msg) {
  console.log(`[Vercel] ${msg}`);
}

function error(msg) {
  console.error(`[Vercel ERROR] ${msg}`);
}

async function vercelRequest(method, path, body, extraHeaders = {}) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('VERCEL_TOKEN 环境变量未设置。请在 https://vercel.com/account/tokens 获取');
  }

  const url = `${VERCEL_API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
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
    throw new Error(`Vercel API ${method} ${path} 失败 (${res.status}): ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data;
}

async function getTeamId() {
  // 检查是否有 team
  try {
    const teams = await vercelRequest('GET', '/v2/teams');
    if (teams.teams && teams.teams.length > 0) {
      return teams.teams[0].id;
    }
  } catch {
    // 个人账号，无 team
  }
  return null;
}

async function main() {
  log('开始 Vercel 部署...');

  const teamId = await getTeamId();
  const query = teamId ? `?teamId=${teamId}` : '';
  log(`账号类型: ${teamId ? 'Team (' + teamId + ')' : '个人'}`);

  // 1. 检查项目是否已存在
  let project;
  try {
    project = await vercelRequest('GET', `/v9/projects/${PROJECT_NAME}${query}`);
    log(`项目已存在: ${project.id}`);
  } catch {
    // 项目不存在，创建新项目
    log(`创建新项目: ${PROJECT_NAME}`);

    // 获取 GitHub 集成信息
    let gitRepo = null;
    try {
      const integrations = await vercelRequest('GET', `/v1/integrations${query}`);
      const githubIntegration = integrations.integrations?.find(i => i.integrationId === 'github');
      if (githubIntegration) {
        gitRepo = {
          type: 'github',
          repo: REPO,
        };
      }
    } catch {
      log('未检测到 GitHub 集成，将使用无源部署');
    }

    const createBody = {
      name: PROJECT_NAME,
      framework: 'vite',
    };

    if (gitRepo) {
      createBody.gitRepository = gitRepo;
    }

    project = await vercelRequest('POST', `/v11/projects${query}`, createBody);
    log(`项目创建成功: ${project.id}`);
  }

  const projectId = project.id;

  // 2. 配置环境变量
  log('配置环境变量...');

  const envVars = [
    { key: 'DATABASE_URL', value: process.env.DATABASE_URL || '', target: ['production', 'preview', 'development'], type: 'encrypted' },
    { key: 'DIRECT_URL', value: process.env.DIRECT_URL || process.env.DATABASE_URL || '', target: ['production', 'preview', 'development'], type: 'encrypted' },
    { key: 'JWT_SECRET', value: process.env.JWT_SECRET || '', target: ['production', 'preview', 'development'], type: 'encrypted' },
    { key: 'VITE_API_BASE', value: '/api', target: ['production', 'preview', 'development'], type: 'plain' },
  ];

  for (const env of envVars) {
    if (!env.value) {
      log(`  跳过 ${env.key}（值为空）`);
      continue;
    }
    try {
      // 先检查是否已存在
      const existing = await vercelRequest('GET', `/v9/projects/${projectId}/env${query}`);
      const found = existing.envs?.find(e => e.key === env.key);
      if (found) {
        // 更新
        await vercelRequest('PATCH', `/v9/projects/${projectId}/env/${found.id}${query}`, env);
        log(`  更新 ${env.key} ✓`);
      } else {
        // 创建
        await vercelRequest('POST', `/v10/projects/${projectId}/env${query}`, env);
        log(`  创建 ${env.key} ✓`);
      }
    } catch (err) {
      log(`  配置 ${env.key} 失败: ${err.message}`);
    }
  }

  // 3. 触发部署
  log('触发部署...');

  let deployment;
  try {
    if (project.link?.repo) {
      // 有 Git 集成，通过 Git 触发部署
      log('通过 Git 集成触发部署...');
      deployment = await vercelRequest('POST', `/v13/deployments${query}`, {
        name: PROJECT_NAME,
        project: PROJECT_NAME,
        target: 'production',
        gitSource: {
          type: 'github',
          repoId: project.link.repoId,
          ref: 'main',
        },
      });
    } else {
      // 无 Git 集成，需要上传文件
      log('无 Git 集成，请手动在 Vercel 网站导入 GitHub 仓库');
      log(`项目地址: https://vercel.com/${teamId ? 'teams/' + teamId : ''}/projects`);
      log('或在 Vercel 网站连接 GitHub 仓库后，push 到 main 分支将自动触发部署');
      return;
    }
  } catch (err) {
    log(`触发部署失败: ${err.message}`);
    log('请手动在 Vercel 网站触发部署');
    return;
  }

  log(`部署已触发: ${deployment.id}`);
  log(`部署 URL: https://vercel.com/dashboard/deployments/${deployment.id}`);
  log(`预计域名: https://${PROJECT_NAME}.vercel.app`);

  // 4. 等待部署完成
  log('等待部署完成...');
  let attempts = 0;
  const maxAttempts = 60;
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
    try {
      const status = await vercelRequest('GET', `/v13/deployments/${deployment.id}${query}`);
      const state = status.readyState;
      log(`部署状态 (${attempts}/${maxAttempts}): ${state}`);

      if (state === 'READY') {
        log(`部署成功！`);
        log(`访问地址: ${status.url}`);
        break;
      } else if (state === 'ERROR' || state === 'CANCELED') {
        error(`部署失败: ${state}`);
        error(`日志: ${status.inspectorUrl}`);
        process.exit(1);
      }
    } catch (err) {
      log(`查询状态失败: ${err.message}`);
    }
  }

  log('Vercel 部署完成！');
}

main().catch(err => {
  error(err.message);
  process.exit(1);
});
