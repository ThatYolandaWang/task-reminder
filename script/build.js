import process from 'node:process';
import { sync } from "cross-spawn";
import fs from "fs-extra";
import { globSync } from "glob";
import path from "path";
import os from "os";
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// 配置
const BUILD_PATH = "src-tauri/target/release/bundle";
const PACKAGE_DIR = "package";
const LATEST_JSON = path.join(process.cwd(), "portal", "task-reminder", "public", "latest.json");
const TAURI_CONFIG = path.join(process.cwd(), "src-tauri", "tauri.conf.json");

// 工具方法
function run(cmd, args, env) {
  console.log(`→ Running: ${cmd} ${args.join(' ')}`);
  const result = sync(cmd, args, { stdio: "inherit", shell: true, env: { ...process.env, ...env } });
  if (result.status !== 0) {
    console.error(`❌ Command failed: ${cmd} ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
  console.log(`✅ Completed: ${cmd}`);
}

async function copyGlob(pattern, destDir) {
  const files = globSync(pattern);
  console.log(`→ Copying files matching ${pattern}: found ${files.length}`);
  for (const file of files) {
    const filename = path.basename(file);
    await fs.ensureDir(destDir);
    await fs.copy(file, path.join(destDir, filename), { overwrite: true });
    console.log(`   • ${filename}`);
  }
}

function bumpVersion(version) {
  const parts = version.split('.').map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  parts[2]++;
  return parts.join('.');
}

async function promptVersionBump() {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question('是否自动生成新版本号并更新 latest.json? (y/N): ');
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}

async function build() {
  console.log('🔧 Build process started');

  // 版本 bump
  if (await promptVersionBump()) {
    console.log('→ 读取当前 version...');
    const data = JSON.parse(await fs.readFile(LATEST_JSON, 'utf8'));
    const oldVer = data.version;
    const newVer = bumpVersion(oldVer);
    if (!newVer) {
      console.error(`无法解析版本号: ${oldVer}`);
      process.exit(1);
    }
    data.version = newVer;
    await fs.writeFile(LATEST_JSON, JSON.stringify(data, null, 2));
    const tauriConfig = JSON.parse(await fs.readFile(TAURI_CONFIG, 'utf8'));
    tauriConfig.version = newVer;
    await fs.writeFile(TAURI_CONFIG, JSON.stringify(tauriConfig, null, 2));
    console.log(`✅ Version updated: ${oldVer} → ${newVer}`);
  }

  // 读取私钥
  let privateKey;
  try {
    privateKey = fs.readFileSync("key/myapp.key", "utf8").replace(/\n/g, "");
  } catch (err) {
    console.error("❌ 密钥文件不存在，请先运行 generatekey", err);
    process.exit(1);
  }

  // 执行 tauri build
  const isWindows = os.platform().startsWith("win");
  const buildArgs = ["tauri", "build"];
  if (!isWindows) buildArgs.push("--bundles", "dmg");
  run("yarn", buildArgs, {
    TAURI_SIGNING_PRIVATE_KEY: privateKey,
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: "Mxy123820",
  });

  console.log(`→ Ensuring package dir ${PACKAGE_DIR}`);
  await fs.ensureDir(PACKAGE_DIR);

  // 拷贝包文件
  await copyGlob(`${BUILD_PATH}/**/*.dmg`, PACKAGE_DIR);
  await copyGlob(`${BUILD_PATH}/**/*.msi`, PACKAGE_DIR);
  await copyGlob(`${BUILD_PATH}/**/*.tar.gz`, PACKAGE_DIR);
  await copyGlob(`${BUILD_PATH}/**/*.sig`, PACKAGE_DIR);

  // 更新 signature & url
  console.log('→ 更新 latest.json 中的 signature 和 url');
  const latestJsonContent = await fs.readFile(LATEST_JSON, "utf8");
  const latestJsonData = JSON.parse(latestJsonContent);
  const sigFiles = globSync(`${BUILD_PATH}/**/*.tar.gz.sig`);
  if (sigFiles.length === 0) {
    console.error("❌ 找不到 .tar.gz.sig 文件");
    process.exit(1);
  }
  const signature = fs.readFileSync(sigFiles[0], "utf8").replace(/\n/g, "");
  const platformKey = isWindows ? "windows-x86_64" : "darwin-aarch64";
  latestJsonData.platforms[platformKey] = latestJsonData.platforms[platformKey] || {};
  latestJsonData.platforms[platformKey].signature = signature;
  latestJsonData.platforms[platformKey].url =
    `https://github.com/ThatYolandaWang/task-reminder/releases/download/${latestJsonData.version}/task-reminder.app.tar.gz`;
  latestJsonData.pub_date = new Date().toISOString();
  await fs.writeFile(LATEST_JSON, JSON.stringify(latestJsonData, null, 2));
  console.log('✅ latest.json 更新完成');

  console.log('🎉 Build 完成');
}

function generateKey() {
  console.log('🔑 Generating new key');
  run("yarn", ["tauri", "signer", "generate", "-w", "key/myapp.key"]);
}

function dev() {
  console.log('🚀 Starting dev mode');
  run("yarn", ["tauri", "dev"]);
}

// 主入口
(async () => {
  const cmd = process.argv[2];
  if (cmd === "generatekey") {
    generateKey();
  } else if (cmd === "build") {
    await build();
  } else if (cmd === "dev") {
    dev();
  } else {
    console.log("Usage: node build.js [generatekey|build|dev]");
  }
})();