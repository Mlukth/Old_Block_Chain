const { execSync } = require('child_process');
const axios = require('axios');

const SERVER_URL = "http://localhost:3002";

function runDiagnostics() {
  console.log('🔧 网络诊断工具');
  console.log('='.repeat(60));
  
  try {
    // 1. 检查端口监听
    console.log('检查端口监听...');
    const portCheck = execSync(`netstat -ano | findstr :3002`, { encoding: 'utf-8' });
    console.log(portCheck ? '✅ 端口3002有监听' : '❌ 端口3002无监听');
    
    // 2. 检查本地连接
    console.log('\n检查本地连接...');
    try {
      const localRes = axios.get('http://127.0.0.1:3002', { timeout: 3000 });
      console.log('✅ 127.0.0.1连接成功');
    } catch (e) {
      console.log('❌ 127.0.0.1连接失败');
    }
    
    // 3. 检查外部连接
    console.log('\n检查外部连接...');
    try {
      const publicRes = axios.get(SERVER_URL, { timeout: 3000 });
      console.log('✅ 外部连接成功');
    } catch (e) {
      console.log('❌ 外部连接失败');
    }
    
    // 4. 检查防火墙
    console.log('\n检查防火墙设置...');
    try {
      const firewallCheck = execSync(`netsh advfirewall firewall show rule name="Node.js Server"`, { encoding: 'utf-8' });
      if (firewallCheck.includes('3002')) {
        console.log('✅ 防火墙规则已配置');
      } else {
        console.log('⚠️ 防火墙规则未配置，建议添加:');
        console.log(`netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3002`);
      }
    } catch (e) {
      console.log('❌ 防火墙检查失败');
    }
    
  } catch (error) {
    console.error('诊断失败:', error.message);
  }
  
  console.log('='.repeat(60));
}

runDiagnostics();