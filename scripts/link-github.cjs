/**
 * 连接 GitHub 仓库到 Vercel 项目
 * 连接后，每次 push 到 main 分支将自动触发部署
 */
const fs = require('fs');
const path = require('path');

const VERCEL_API = 'https://api.vercel.com';
const PROJECT_NAME = 'textbook-ing';
const TEAM_ID = 'team_pdaobxPxJ2Bm369qHJh0WWQc';
const GITHUB_REPO = 'w020316/Textbook-ING-Smart-Textbook-Query-and-Management-Platform';

async function main() {
  const token = fs.readFileSync(path.join(__dirname, '.vercel-token'), 'utf8').trim();

  console.log('[1] 获取项目当前信息...');
  const projResp = await fetch(`${VERCEL_API}/v9/projects/${PROJECT_NAME}?teamId=${TEAM_ID}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const project = await projResp.json();

  if (project.link) {
    console.log(`    已连接: ${project.link.type} - ${project.link.repo}`);
    console.log('    无需重复连接');
    return;
  }

  console.log('[2] 查找 GitHub 集成...');
  // 查找 Vercel 的 GitHub 集成信息
  const integResp = await fetch(`${VERCEL_API}/v1/integrations?teamId=${TEAM_ID}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const integData = await integResp.json();

  const githubInteg = integData.integrations?.find(i => i.integrationId === 'github' || i.name === 'GitHub');

  if (!githubInteg) {
    console.log('    未找到 GitHub 集成');
    console.log('    请在 Vercel dashboard 安装 GitHub 集成: https://vercel.com/integrations/github');
    return;
  }

  console.log(`    GitHub 集成ID: ${githubInteg.id || githubInteg.integrationId}`);

  // 获取 GitHub 仓库列表，找到 repoId
  console.log('[3] 查找 GitHub 仓库...');
  const reposResp = await fetch(`${VERCEL_API}/v2/integrations/github/repos?teamId=${TEAM_ID}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!reposResp.ok) {
    console.log(`    获取仓库列表失败: ${reposResp.status}`);
    const errText = await reposResp.text();
    console.log(`    ${errText.substring(0, 300)}`);

    // 尝试直接连接
    console.log('\n[备用] 尝试直接连接 GitHub 仓库...');
    const linkResp = await fetch(`${VERCEL_API}/v9/projects/${PROJECT_NAME}?teamId=${TEAM_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        link: {
          type: 'github',
          repo: GITHUB_REPO,
        },
      }),
    });

    if (linkResp.ok) {
      const result = await linkResp.json();
      console.log('    GitHub 仓库连接成功！');
      console.log(`    repo: ${result.link?.repo}`);
      console.log('    以后 push 到 main 分支将自动触发部署');
    } else {
      const err = await linkResp.text();
      console.log(`    连接失败: ${linkResp.status}`);
      console.log(`    ${err.substring(0, 300)}`);
    }
    return;
  }

  const reposData = await reposResp.json();
  const repo = reposData.repos?.find(r => r.full_name === GITHUB_REPO || r.name === GITHUB_REPO.split('/')[1]);

  if (!repo) {
    console.log(`    未找到仓库 ${GITHUB_REPO}`);
    return;
  }

  console.log(`    仓库ID: ${repo.id}`);
  console.log(`    仓库名: ${repo.full_name}`);

  // 连接仓库
  console.log('[4] 连接 GitHub 仓库到 Vercel 项目...');
  const linkResp = await fetch(`${VERCEL_API}/v9/projects/${PROJECT_NAME}?teamId=${TEAM_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      link: {
        type: 'github',
        repo: GITHUB_REPO,
        repoId: repo.id,
      },
    }),
  });

  if (linkResp.ok) {
    console.log('    GitHub 仓库连接成功！');
    console.log('    以后 push 到 main 分支将自动触发部署');
  } else {
    const err = await linkResp.text();
    console.log(`    连接失败: ${linkResp.status}`);
    console.log(`    ${err.substring(0, 300)}`);
  }
}

main().catch(e => {
  console.error('执行失败:', e.message);
  process.exit(1);
});
