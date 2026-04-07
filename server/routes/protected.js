// 注意: 此文件已自动转换为ES模块格式
// 原始备份保存为: protected.js.bak

// server/routes/protected.js
import express from 'express';
const router = express.Router();
import {  authenticateToken  } from '../middleware/auth.js'; // 确保路径正确

/**
 * 获取用户个人信息
 * 路径: /api/protected/profile
 * 方法: GET
 * 认证: 需要JWT令牌
 * 返回: 用户基本信息
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // 从认证中间件解析的用户信息中提取安全字段
    const user = {
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role,
      createdAt: req.user.createdAt // 添加createdAt字段
    };
    
    // 返回格式化的用户信息
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error.message);
    
    // 统一错误处理
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

export default router;