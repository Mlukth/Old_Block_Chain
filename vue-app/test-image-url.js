import axios from 'axios';

// 配置
const BASE_URL = 'http://localhost:3002';
const TEST_HASHES = [
  '0xe020c327c6f48064b05993729e879a3f0da5d66ad6718b89e163e41b1071d71d', // 带0x
  'e020c327c6f48064b05993729e879a3f0da5d66ad6718b89e163e41b1071d71d',  // 不带0x
];

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

async function testImageUrl(hash) {
  const urls = [
    `${BASE_URL}/images/${hash}.jpg`,
    `${BASE_URL}/images/${hash.replace(/^0x/, '')}.jpg`,
  ];

  for (const url of urls) {
    try {
      const response = await axios.head(url, { timeout: 3000 });
      log(`✅ 存在`, url, colors.green);
      return { url, exists: true, status: response.status };
    } catch (error) {
      if (error.response) {
        log(`❌ 不存在 (${error.response.status})`, url, colors.red);
      } else {
        log(`❌ 请求失败`, `${url} - ${error.message}`, colors.red);
      }
    }
  }
  return { exists: false };
}

async function main() {
  log('\n🖼️ 图片 URL 测试', '='.repeat(50), colors.yellow);

  for (const hash of TEST_HASHES) {
    log('\n📌 测试哈希', hash);
    await testImageUrl(hash);
  }

  // 额外：尝试访问后端图片服务根路径
  log('\n🔧 检查后端静态服务', '', colors.yellow);
  try {
    const res = await axios.get(`${BASE_URL}/images/`, { timeout: 3000 });
    log('✅ /images/ 可访问', res.status, colors.green);
  } catch (e) {
    log('❌ /images/ 无法访问', e.message, colors.red);
  }

  log('\n' + '='.repeat(50), '测试完成\n', colors.yellow);
}

main();