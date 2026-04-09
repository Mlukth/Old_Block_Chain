<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">系统统计仪表盘</h1>
          <p class="text-white/80">全面监控图片哈希上链系统的性能与使用情况</p>
        </div>
        
        <div class="flex items-center space-x-2 mt-4 md:mt-0">
          <i class="fa fa-calendar text-white/60"></i>
          <select 
            v-model="timeRange"
            class="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
            <option value="all">全部时间</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center h-96">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>

      <template v-else>
        <!-- 核心系统指标 -->
        <div class="mb-10">
          <h2 class="text-xl font-bold text-white mb-6 flex items-center">
            <i class="fa fa-database mr-2 text-primary"></i> 核心系统指标
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard 
              title="总上链哈希数" :value="stats.totalHashes"
              description="系统累计处理的哈希总数"
              icon="fa-database" color="bg-blue-500"
              :trend="{ value: 5.2, period: '较上月' }"
            />
            <StatCard 
              title="日均上链数量" :value="stats.dailySubmissionRate"
              description="平均每日哈希上链数量"
              icon="fa-chart-line" color="bg-green-500"
              :trend="{ value: 8.7, period: '较上月' }"
            />
            <StatCard 
              title="上链成功率" :value="`${(stats.successRate * 100).toFixed(1)}%`"
              description="成功上链的哈希比例"
              icon="fa-check" color="bg-teal-500"
            />
            <StatCard 
              title="平均上链成本" :value="`${stats.averageCost} ETH`"
              description="每次上链操作的平均Gas费"
              icon="fa-chart-line" color="bg-purple-500"
              :trend="{ value: -12.3, period: '较上月' }"
            />
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 class="text-lg font-medium text-white/80 mb-4">上链数量趋势</h3>
              <div class="h-64">
                <canvas ref="submissionsChartRef"></canvas>
              </div>
            </div>
            
            <div class="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 class="text-lg font-medium text-white/80 mb-4">上链成本趋势</h3>
              <div class="h-64">
                <canvas ref="costChartRef"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 用户与增长指标 -->
        <div class="mb-10">
          <h2 class="text-xl font-bold text-white mb-6 flex items-center">
            <i class="fa fa-users mr-2 text-primary"></i> 用户与增长指标
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard title="日活跃用户" :value="stats.activeUsers.dau" description="每日执行操作的用户数" icon="fa-users" color="bg-indigo-500" :trend="{ value: 12.5, period: '较上周' }" />
            <StatCard title="周活跃用户" :value="stats.activeUsers.wau" description="每周执行操作的用户数" icon="fa-users" color="bg-pink-500" />
            <StatCard title="月活跃用户" :value="stats.activeUsers.mau" description="每月执行操作的用户数" icon="fa-users" color="bg-yellow-500" :trend="{ value: 18.3, period: '较上月' }" />
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 class="text-lg font-medium text-white/80 mb-4">用户类型分布</h3>
              <div class="h-64">
                <canvas ref="userTypeChartRef"></canvas>
              </div>
            </div>
            <div class="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 class="text-lg font-medium text-white/80 mb-4">新用户 vs 回头客</h3>
              <div class="h-64">
                <canvas ref="userRatioChartRef"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 图片与内容指标 -->
        <div class="mb-10">
          <h2 class="text-xl font-bold text-white mb-6 flex items-center">
            <i class="fa fa-chart-bar mr-2 text-primary"></i> 图片与内容指标
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <StatCard title="验证查询量" :value="stats.queryVolume" description="总验证请求次数" icon="fa-chart-line" color="bg-green-500" :trend="{ value: 22.1, period: '较上月' }" />
            <StatCard title="系统可用性" :value="`${stats.uptime}%`" description="API正常运行时间比例" icon="fa-check" color="bg-blue-500" />
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 class="text-lg font-medium text-white/80 mb-4">验证结果统计</h3>
              <div class="h-64">
                <canvas ref="verifyResultChartRef"></canvas>
              </div>
            </div>
            <div class="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 class="text-lg font-medium text-white/80 mb-4">高频验证图片</h3>
              <div class="h-64">
                <canvas ref="topHashesChartRef"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 安全与审计指标 -->
        <div class="mb-10">
          <h2 class="text-xl font-bold text-white mb-6 flex items-center">
            <i class="fa fa-shield-alt mr-2 text-primary"></i> 安全与审计指标
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <StatCard title="重复上链检测" :value="stats.duplicateSubmissions" description="检测到的重复上链次数" icon="fa-shield-alt" color="bg-orange-500" />
            <StatCard title="可疑活动" :value="stats.suspiciousActivities" description="检测到的可疑活动次数" icon="fa-shield-alt" color="bg-red-500" />
          </div>
        </div>
      </template>

      <!-- 操作卡片网格 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <ActionCard 
          icon="fa-cloud-upload-alt" title="图片上传"
          description="上传图片并计算哈希值"
          @click="navigate('/upload')"
          color="bg-purple-500"
        />
        <ActionCard 
          icon="fa-check" title="哈希验证"
          description="验证图片哈希是否在链上"
          @click="navigate('/verify')"
          color="bg-teal-500"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'

const router = useRouter()
const timeRange = ref('7d')
const loading = ref(true)
const stats = ref<any>({})

// Chart refs
const submissionsChartRef = ref<HTMLCanvasElement | null>(null)
const costChartRef = ref<HTMLCanvasElement | null>(null)
const userTypeChartRef = ref<HTMLCanvasElement | null>(null)
const userRatioChartRef = ref<HTMLCanvasElement | null>(null)
const verifyResultChartRef = ref<HTMLCanvasElement | null>(null)
const topHashesChartRef = ref<HTMLCanvasElement | null>(null)

let chartInstances: Chart[] = []

const navigate = (path: string) => router.push(path)

// 生成模拟数据
const generateMockData = () => {
  return {
    totalHashes: 128,
    dailySubmissionRate: timeRange.value === '7d' ? 8 : timeRange.value === '30d' ? 7.2 : 6.5,
    successRate: 0.88,
    averageCost: 0.0024,
    averageConfirmationTime: 12.5,
    queryVolume: timeRange.value === '7d' ? 42 : timeRange.value === '30d' ? 185 : 520,
    uptime: 99.8,
    activeUsers: { dau: 24, wau: 68, mau: 142 },
    userRatio: { new: 35, returning: 65 },
    userBehavior: { uploaders: 45, verifiers: 30, hybrid: 25 },
    verificationResults: { successful: 86, failed: 22 },
    topVerifiedHashes: [
      { name: 'IMG_001', verifications: 12 },
      { name: 'ART_205', verifications: 9 },
      { name: 'DOC_043', verifications: 7 },
      { name: 'NEWS_178', verifications: 6 },
      { name: 'PROD_512', verifications: 5 }
    ],
    duplicateSubmissions: 8,
    suspiciousActivities: 2,
    hashSubmissions: timeRange.value === '7d' ? 
      [{ day: '周一', hashes: 7 }, { day: '周二', hashes: 12 }, { day: '周三', hashes: 9 }, { day: '周四', hashes: 11 }, { day: '周五', hashes: 14 }, { day: '周六', hashes: 6 }, { day: '周日', hashes: 8 }] : 
      [{ week: 'W1', hashes: 42 }, { week: 'W2', hashes: 38 }, { week: 'W3', hashes: 51 }, { week: 'W4', hashes: 47 }],
    costTrend: [
      { period: '1月', cost: 0.0032 }, { period: '2月', cost: 0.0028 }, { period: '3月', cost: 0.0025 }, { period: '4月', cost: 0.0024 }
    ]
  }
}

const fetchStats = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  stats.value = generateMockData()
  loading.value = false
  // 渲染图表
  setTimeout(() => renderCharts(), 100)
}

const renderCharts = () => {
  // 销毁旧图表
  chartInstances.forEach(chart => chart.destroy())
  chartInstances = []
  
  if (!stats.value) return
  
  // 上链数量趋势
  if (submissionsChartRef.value) {
    const ctx = submissionsChartRef.value.getContext('2d')
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: stats.value.hashSubmissions.map((d: any) => d.day || d.week),
          datasets: [{
            label: '哈希数量',
            data: stats.value.hashSubmissions.map((d: any) => d.hashes),
            borderColor: '#c87207',
            backgroundColor: 'rgba(200, 114, 7, 0.1)',
            fill: true
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      })
      chartInstances.push(chart)
    }
  }
  
  // 成本趋势
  if (costChartRef.value) {
    const ctx = costChartRef.value.getContext('2d')
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: stats.value.costTrend.map((d: any) => d.period),
          datasets: [{
            label: '成本 (ETH)',
            data: stats.value.costTrend.map((d: any) => d.cost),
            borderColor: '#883c1c',
            tension: 0.1
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      })
      chartInstances.push(chart)
    }
  }
  
  // 用户类型分布饼图
  if (userTypeChartRef.value) {
    const ctx = userTypeChartRef.value.getContext('2d')
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['纯上传者', '纯验证者', '混合用户'],
          datasets: [{
            data: [stats.value.userBehavior.uploaders, stats.value.userBehavior.verifiers, stats.value.userBehavior.hybrid],
            backgroundColor: ['#00C49F', '#FF8042', '#0088FE']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      })
      chartInstances.push(chart)
    }
  }
  
  // 新用户 vs 回头客 极地图（简化用饼图）
  if (userRatioChartRef.value) {
    const ctx = userRatioChartRef.value.getContext('2d')
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['新用户', '回头客'],
          datasets: [{
            data: [stats.value.userRatio.new, stats.value.userRatio.returning],
            backgroundColor: ['#c87207', '#883c1c']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      })
      chartInstances.push(chart)
    }
  }
  
  // 验证结果统计
  if (verifyResultChartRef.value) {
    const ctx = verifyResultChartRef.value.getContext('2d')
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['匹配成功', '匹配失败'],
          datasets: [{
            label: '次数',
            data: [stats.value.verificationResults.successful, stats.value.verificationResults.failed],
            backgroundColor: '#c87207'
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      })
      chartInstances.push(chart)
    }
  }
  
  // 高频验证图片
  if (topHashesChartRef.value) {
    const ctx = topHashesChartRef.value.getContext('2d')
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: stats.value.topVerifiedHashes.map((d: any) => d.name),
          datasets: [{
            label: '验证次数',
            data: stats.value.topVerifiedHashes.map((d: any) => d.verifications),
            backgroundColor: '#883c1c'
          }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
      })
      chartInstances.push(chart)
    }
  }
}

watch(timeRange, () => {
  fetchStats()
})

onMounted(() => {
  fetchStats()
})
</script>