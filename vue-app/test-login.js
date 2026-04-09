// test-login.js (ES Module 版本)
import axios from 'axios';

const BASE_URL = 'http://localhost:3002/api';
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(prefix, data, color = colors.cyan) {
  console.log(color + prefix + colors.reset, data);
}

async function testLogin() {
  log('\n📡 测试登录接口', '='.repeat(50), colors.yellow);
  log('请求地址', `${BASE_URL}/auth/login`);
  log('请求参数', TEST_CREDENTIALS);

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS, {
      headers: { 'Content-Type': 'application/json' },
      transformResponse: [(data) => data],
    });

    const rawData = response.data;
    log('\n📄 原始响应 (字符串)', rawData, colors.cyan);

    let parsedData;
    try {
      parsedData = JSON.parse(rawData);
    } catch (e) {
      log('❌ JSON 解析失败', e.message, colors.red);
      return;
    }

    log('\n✅ 解析后响应对象', parsedData, colors.green);
    log('\n🔍 字段检查', '', colors.yellow);
    log('  success 字段', parsedData.success);
    log('  token 字段', parsedData.token ? `${parsedData.token.substring(0, 30)}...` : '不存在');
    log('  user 字段', parsedData.user);

    log('\n🧪 模拟前端拦截器', '直接返回 response.data', colors.cyan);
    const interceptedData = parsedData;
    log('拦截后数据', interceptedData);

    if (interceptedData.success) {
      log('\n🎉 登录成功！', `token: ${interceptedData.token.substring(0, 20)}...`, colors.green);
    } else {
      log('\n⚠️ 登录失败', `success 字段为 ${interceptedData.success}`, colors.red);
    }

    log('\n📊 响应状态码', response.status, response.statusText);
  } catch (error) {
    console.error(colors.red + '\n❌ 请求失败:' + colors.reset);
    if (error.response) {
      log('状态码', error.response.status);
      log('响应体', error.response.data);
    } else if (error.request) {
      log('错误', '无法连接到后端服务器，请确认后端已启动且端口为 3002');
    } else {
      log('错误消息', error.message);
    }
  }

  log('\n' + '='.repeat(50), '测试完成\n', colors.yellow);
}

testLogin();