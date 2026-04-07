import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, '../logs/reset_history.log');

export const logResetOperation = (request, result) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: request.ip,
      user: request.user ? request.user.username : 'anonymous',
      result: result
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // 确保日志目录存在
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // 追加日志
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (error) {
    console.error('重置操作日志记录失败:', error);
  }
};