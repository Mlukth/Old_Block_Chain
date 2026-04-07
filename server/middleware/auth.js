// Modified by CodeBatchUpdater at 2025-07-20 20:22:32

// 注意: 此文件已自动转换为ES模块格式
// 原始备份保存为: auth.js.bak

// Modified by CodeBatchUpdater at 2025-07-18 20:41:53

import jwt from 'jsonwebtoken';

// 添加对OPTIONS请求的豁免
const authenticateToken = (req, res, next) => {
  // 允许CORS预检请求通过
  if (req.method === 'OPTIONS') return next();
  
  try {
    const authHeader = req.headers.authorization;
    
    // 增强空值检查
    if (!authHeader) {
      console.log('请求头缺少Authorization字段');
      return res.status(401).json({ 
        success: false, 
        error: '未提供认证令牌',
        code: 'MISSING_AUTH_HEADER'
      });
    }

    // 修改令牌提取逻辑
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : authHeader; // 处理无"Bearer "前缀的情况

    // 添加详细格式检查
    if (!token || token === "undefined" || token === "null" || token.length < 50) {
      console.error('无效的令牌格式:', token);
      return res.status(401).json({
        success: false,
        error: '令牌格式无效',
        code: 'INVALID_TOKEN_FORMAT',
        received: token // 返回接收到的值用于调试
      });
    }

    // 使用统一的JWT密钥
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);

    // 将解析后的用户信息附加到req对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    console.log('✅ 令牌验证通过:', req.user.username, '访问', req.originalUrl);
    next(); // 继续处理下一个中间件或路由
  } catch (error) {
    console.log('🚫 令牌验证失败:', req.originalUrl, '原因:', error.message);
    
    // 区分“令牌无效”和“令牌过期”
    const message = error.name === 'TokenExpiredError' 
      ? '令牌已过期，请重新登录' 
      : '令牌无效';
    const code = error.name === 'TokenExpiredError' 
      ? 'TOKEN_EXPIRED' 
      : 'INVALID_TOKEN';
    
    return res.status(401).json({ 
      success: false, 
      error: message,
      code: code
    });
  }
};

// 导出函数（名称必须与函数名一致）
export {  authenticateToken  };