/**
 * 获取 Neon 项目连接串并写入 .env
 * 复用浏览器中已有的项目 muddy-cell-12686688
 */
const fs = require('fs');
const path = require('path');

const log = (msg) => console.log(`[neon] ${msg}`);

async function main() {
  // 读取凭据
  const creds = JSON.parse(fs.readFileSync('.deploy-creds.json', 'utf8'));
  if (!creds.neonApiKey) {
    throw new Error('缺少 neonApiKey');
  }
  log(`Neon API Key: ${creds.neonApiKey.slice(0, 25)}...`);

  // 0. 获取组织 ID
  log('\n===== 获取 Neon 组织 =====');
  const orgRes = await fetch('https://console.neon.tech/api/v2/users/me/organizations', {
    headers: { 'Authorization': `Bearer ${creds.neonApiKey}` },
  });
  const orgData = await orgRes.json();
  log(`状态: ${orgRes.status}`);
  if (!orgRes.ok) {
    console.log(JSON.stringify(orgData, null, 2).slice(0, 500));
    throw new Error('获取组织失败');
  }
  const orgs = orgData.organizations || [];
  log(`共 ${orgs.length} 个组织:`);
  orgs.forEach(o => log(`  - ${o.id} | ${o.name} | plan=${o.plan || 'unknown'}`));
  if (orgs.length === 0) throw new Error('无可用组织');
  const orgId = orgs[0].id;
  log(`使用组织: ${orgId}`);

  // 1. 列出项目，找已有项目
  log('\n===== 列出 Neon 项目 =====');
  const listRes = await fetch(`https://console.neon.tech/api/v2/projects?limit=10&org_id=${orgId}`, {
    headers: { 'Authorization': `Bearer ${creds.neonApiKey}` },
  });
  const listData = await listRes.json();
  log(`状态: ${listRes.status}`);
  if (!listRes.ok) {
    console.log(JSON.stringify(listData, null, 2).slice(0, 500));
    throw new Error('列出项目失败');
  }

  const projects = listData.projects || [];
  log(`共 ${projects.length} 个项目:`);
  projects.forEach(p => {
    log(`  - ${p.id} | ${p.name} | ${p.region} | branch=${p.default_branch_id}`);
  });

  let targetProject = projects.find(p => p.name === 'textbook-ing') || projects[0];
  
  // 如果没有任何项目，则创建
  if (!targetProject) {
    log('\n无现有项目，创建新项目...');
    const createRes = await fetch('https://console.neon.tech/api/v2/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.neonApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: { name: 'textbook-ing', region_id: 'aws-ap-southeast-1' },
      }),
    });
    const createData = await createRes.json();
    log(`创建状态: ${createRes.status}`);
    if (!createRes.ok) {
      console.log(JSON.stringify(createData, null, 2));
      throw new Error('创建项目失败');
    }
    targetProject = createData.project;
    log(`✓ 新项目: ${targetProject.id} | ${targetProject.name}`);
    
    // 新项目会返回连接串
    const conn = createData.connection_uris && createData.connection_uris[0];
    if (conn) {
      log(`连接串: ${conn.connection_uri.slice(0, 50)}...`);
    }
  } else {
    log(`\n复用项目: ${targetProject.id} (${targetProject.name})`);
  }

  // 2. 通过 branches/endpoints/roles/databases 拼接连接串
  log('\n===== 获取连接串 =====');

  // 2.1 获取分支
  const branchesRes = await fetch(`https://console.neon.tech/api/v2/projects/${targetProject.id}/branches`, {
    headers: { 'Authorization': `Bearer ${creds.neonApiKey}` },
  });
  const branchesText = await branchesRes.text();
  let branchesData;
  try { branchesData = JSON.parse(branchesText); } catch { branchesData = { raw: branchesText.slice(0, 300) }; }
  log(`branches 状态: ${branchesRes.status}`);
  const branches = branchesData.branches || [];
  const defaultBranch = branches.find(b => b.primary) || branches[0];
  log(`分支数: ${branches.length}, 默认分支: ${defaultBranch ? defaultBranch.id + ' (' + defaultBranch.name + ')' : '无'}`);

  if (!defaultBranch) {
    log(`branches 响应: ${branchesText.slice(0, 500)}`);
    throw new Error('无分支');
  }

  // 2.2 获取 endpoints
  const endpointsRes = await fetch(`https://console.neon.tech/api/v2/projects/${targetProject.id}/endpoints`, {
    headers: { 'Authorization': `Bearer ${creds.neonApiKey}` },
  });
  const endpointsData = await endpointsRes.json();
  const endpoints = endpointsData.endpoints || [];
  // 选默认分支的 endpoint
  const ep = endpoints.find(e => e.branch_id === defaultBranch.id) || endpoints[0];
  log(`endpoints 数: ${endpoints.length}, 选中: ${ep ? ep.host : '无'}`);

  if (!ep) throw new Error('无 endpoint');

  // 2.3 获取角色
  const rolesRes = await fetch(`https://console.neon.tech/api/v2/projects/${targetProject.id}/branches/${defaultBranch.id}/roles`, {
    headers: { 'Authorization': `Bearer ${creds.neonApiKey}` },
  });
  const rolesData = await rolesRes.json();
  const roles = rolesData.roles || [];
  const role = roles.find(r => r.name === 'neondb_owner') || roles[0];
  log(`roles 数: ${roles.length}, 选中: ${role ? role.name : '无'}`);

  if (!role) throw new Error('无 role');

  // 2.4 获取角色密码
  const pwdRes = await fetch(`https://console.neon.tech/api/v2/projects/${targetProject.id}/branches/${defaultBranch.id}/roles/${role.name}/reveal_password`, {
    headers: { 'Authorization': `Bearer ${creds.neonApiKey}` },
  });
  const pwdData = await pwdRes.json();
  const password = pwdData.password;
  log(`password: ${password ? password.slice(0, 5) + '...' : '无'}`);
  if (!password) throw new Error('无 password');

  // 2.5 获取数据库
  const dbsRes = await fetch(`https://console.neon.tech/api/v2/projects/${targetProject.id}/branches/${defaultBranch.id}/databases`, {
    headers: { 'Authorization': `Bearer ${creds.neonApiKey}` },
  });
  const dbsData = await dbsRes.json();
  const dbs = dbsData.databases || [];
  const db = dbs.find(d => d.name === 'neondb') || dbs[0];
  log(`databases 数: ${dbs.length}, 选中: ${db ? db.name : '无'}`);
  if (!db) throw new Error('无 database');

  // 2.6 拼接连接串
  const connectionUri = `postgresql://${role.name}:${encodeURIComponent(password)}@${ep.host}/${db.name}?sslmode=require`;
  log(`\n✓ DATABASE_URL: ${connectionUri.slice(0, 60)}...`);
  
  // 3. 生成 JWT_SECRET
  const crypto = require('crypto');
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  log(`✓ JWT_SECRET: ${jwtSecret.slice(0, 16)}...`);
  
  // 4. 构造 pgbouncer 池化连接串（用于 serverless）
  const poolUri = connectionUri.replace('?', '?pgbouncer=true&connect_timeout=15&') 
    .replace('&&', '&')
    .replace('?&', '?');
  // 简化：直接构造
  const directUri = connectionUri;
  // 把 host 从 ep-xxx.neon.tech 改为 ep-xxx-pooler.neon.tech
  const poolerUri = connectionUri.replace(/\.neon\.tech/, '-pooler.neon.tech') +
    (connectionUri.includes('?') ? '&' : '?') + 'pgbouncer=true&connect_timeout=15';
  
  // 5. 写入 .env
  const envContent = `# 教材ING 部署环境变量（自动生成）
# 生成时间: ${new Date().toISOString()}

# Neon PostgreSQL 池化连接（Serverless 用）
DATABASE_URL="${poolerUri}"

# Neon PostgreSQL 直连（Prisma migrate 用）
DIRECT_URL="${directUri}"

# JWT 密钥
JWT_SECRET="${jwtSecret}"

# 前端 API 基础路径
VITE_API_BASE="/api"
`;
  fs.writeFileSync('.env', envContent, 'utf8');
  log('✓ .env 已写入');
  
  // 6. 更新 .deploy-creds.json，记录项目信息
  creds.neonProject = {
    id: targetProject.id,
    name: targetProject.name,
    region: targetProject.region,
  };
  creds.databaseUrl = poolerUri;
  creds.directUrl = directUri;
  creds.jwtSecret = jwtSecret;
  fs.writeFileSync('.deploy-creds.json', JSON.stringify(creds, null, 2), 'utf8');
  log('✓ .deploy-creds.json 已更新');
  
  console.log('\n========================================');
  console.log('Neon 数据库准备完成');
  console.log('========================================');
  console.log(`项目 ID: ${targetProject.id}`);
  console.log(`项目名: ${targetProject.name}`);
  console.log(`区域: ${targetProject.region}`);
  console.log(`连接串前缀: ${poolerUri.slice(0, 60)}...`);
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
