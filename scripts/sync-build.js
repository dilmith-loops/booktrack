import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const backendPublicDir = path.join(rootDir, 'backend', 'public');
const rootPublicDir = path.join(rootDir, 'public');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function syncBuild() {
  console.log('📦 Syncing compiled React assets to Laravel backend/public...');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ directory not found. Please run vite build first.');
    process.exit(1);
  }

  // 1. Clean and copy dist/assets to backend/public/assets and root public/assets
  if (fs.existsSync(path.join(backendPublicDir, 'assets'))) {
    fs.rmSync(path.join(backendPublicDir, 'assets'), { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(rootPublicDir, 'assets'))) {
    fs.rmSync(path.join(rootPublicDir, 'assets'), { recursive: true, force: true });
  }
  copyDirRecursive(path.join(distDir, 'assets'), path.join(backendPublicDir, 'assets'));
  copyDirRecursive(path.join(distDir, 'assets'), path.join(rootPublicDir, 'assets'));

  // 2. Copy all compiled dist files and subdirectories (index.html, manifest, sw, workbox, splash, etc.)
  const distFiles = fs.readdirSync(distDir);
  for (const file of distFiles) {
    if (file === 'index.php' || file === '.htaccess' || file === 'assets') continue;
    const srcFile = path.join(distDir, file);
    const destBackend = path.join(backendPublicDir, file);
    const destRoot = path.join(rootPublicDir, file);
    if (fs.statSync(srcFile).isDirectory()) {
      copyDirRecursive(srcFile, destBackend);
    } else {
      fs.copyFileSync(srcFile, destBackend);
      fs.copyFileSync(srcFile, destRoot);
    }
  }

  // 3. Ensure all static directories and files from public/ are present in backend/public/
  const publicFiles = fs.readdirSync(rootPublicDir);
  for (const file of publicFiles) {
    if (file === 'index.php' || file === '.htaccess' || file === 'assets') continue;
    const srcFile = path.join(rootPublicDir, file);
    const destFile = path.join(backendPublicDir, file);
    if (fs.statSync(srcFile).isDirectory()) {
      copyDirRecursive(srcFile, destFile);
    } else if (!fs.existsSync(destFile)) {
      fs.copyFileSync(srcFile, destFile);
    }
  }

  console.log('✅ React production build successfully packaged into Laravel backend/public!');
  console.log('🚀 Laravel is now 100% self-contained and ready for shared hosting deployment without Node.js.');
}

syncBuild();
