// 自动化 Vercel CLI 登录，处理交互式菜单
const { spawn } = require('child_process');

const env = {
  ...process.env,
  NODE_OPTIONS: '--require D:\\dev-tools\\hostname-patch.cjs',
  VERCEL_TELEMETRY_DISABLED: '1',
};

const child = spawn('npx', ['vercel', 'login', '--no-color'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env,
  shell: true,
});

let urlPrinted = false;
let menuSeen = false;

child.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);

  // 检测菜单出现，选择 GitHub (通常是选项 1)
  if (!menuSeen && (text.includes('GitHub') || text.includes('github'))) {
    menuSeen = true;
    setTimeout(() => {
      child.stdin.write('1\n');
    }, 500);
  }

  // 检测 URL 输出
  const urlMatch = text.match(/https:\/\/[^\s]+/);
  if (urlMatch && !urlPrinted) {
    urlPrinted = true;
    console.log('\n[Auto-Login] 检测到 URL，将在浏览器中打开...');
    const { execSync } = require('child_process');
    try {
      execSync(`start "" "${urlMatch[0]}"`, { shell: true });
      console.log('[Auto-Login] 浏览器已打开，请在浏览器中完成授权');
    } catch (e) {
      console.log('[Auto-Login] 请手动打开 URL:', urlMatch[0]);
    }
  }
});

child.stderr.on('data', (data) => {
  const text = data.toString();
  process.stderr.write(text);

  const urlMatch = text.match(/https:\/\/[^\s]+/);
  if (urlMatch && !urlPrinted) {
    urlPrinted = true;
    console.log('\n[Auto-Login] 检测到 URL，将在浏览器中打开...');
    const { execSync } = require('child_process');
    try {
      execSync(`start "" "${urlMatch[0]}"`, { shell: true });
      console.log('[Auto-Login] 浏览器已打开，请在浏览器中完成授权');
    } catch (e) {
      console.log('[Auto-Login] 请手动打开 URL:', urlMatch[0]);
    }
  }
});

child.on('close', (code) => {
  console.log(`\n[Auto-Login] 进程退出，代码: ${code}`);
  if (code === 0) {
    console.log('[Auto-Login] 登录成功！');
  } else {
    console.log('[Auto-Login] 登录未完成');
  }
});

setTimeout(() => {
  console.log('\n[Auto-Login] 超时（120秒），终止进程');
  child.kill();
  process.exit(1);
}, 120000);
