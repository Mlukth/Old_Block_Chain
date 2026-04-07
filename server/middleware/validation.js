// 注意: 此文件已自动转换为ES模块格式
// 原始备份保存为: validation.js.bak

// server/middleware/validation.js
import Joi from 'joi'; // 需要安装：npm install joi

// 登录验证 schema
const loginSchema = Joi.object({
  username: Joi.string().required().min(3).max(30),
  password: Joi.string().required().min(6)
});

// 验证登录请求
const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export { 
  validateLogin
 };