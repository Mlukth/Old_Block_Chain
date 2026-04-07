// 新建 server/utils/pathResolver.js
import { fileURLToPath } from 'url';
import path from 'path';

export function resolveProjectRoot(importMetaUrl) {
  const __filename = fileURLToPath(importMetaUrl);
  const serverDir = path.dirname(__filename);
  return path.join(serverDir, '..'); // 返回项目根目录
}

export function resolveScriptsConfig(importMetaUrl) {
  const projectRoot = resolveProjectRoot(importMetaUrl);
  return path.join(projectRoot, 'scripts', 'config.js');
}