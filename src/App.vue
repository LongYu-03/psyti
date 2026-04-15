<script setup>
import { ref, computed } from 'vue'
import { questions, resultDescriptions } from './questions'

// --- 1. 状态管理 ---
const gameState = ref('welcome') 
const currentIndex = ref(0)
const userAnswers = ref([])

// --- 2. 核心分数累加 (中间变量) ---
const totalScores = computed(() => {
  let scores = { DF: 0, KA: 0, EG: 0, SB: 0 }
  userAnswers.value.forEach((ans) => {
    if (scores.hasOwnProperty(ans.dim)) {
      scores[ans.dim] += ans.score
    }
  })
  return scores
})

// --- 3. 生成 4 位代号 (用于匹配文案) ---
const finalType = computed(() => {
  const s = totalScores.value
  // 根据分数的正负决定字母，顺序严格按照你的矩阵：DF-KA-EG-SB
  const res = [
    s.DF >= 0 ? 'D' : 'F',
    s.KA >= 0 ? 'K' : 'A',
    s.EG >= 0 ? 'E' : 'G',
    s.SB >= 0 ? 'S' : 'B'
  ]
  return res.join('')
})

// --- 4. 维度分析 (用于进度条显示) ---
const dimensionAnalysis = computed(() => {
  const s = totalScores.value
  
  const calculatePercent = (val) => {
    const maxScore = 16 
    let percent = ((val + maxScore) / (maxScore * 2)) * 100
    return Math.max(0, Math.min(100, Number(percent).toFixed(1))) 
  }

  return [
    { label: '决定论 vs 自由意志', percent: calculatePercent(s.DF), left: 'D', right: 'F' },
    { label: '可知论 vs 不可知论', percent: calculatePercent(s.KA), left: 'K', right: 'A' },
    { label: '元素论 vs 格式塔', percent: calculatePercent(s.EG), left: 'E', right: 'G' },
    { label: '灵魂 vs 肉体', percent: calculatePercent(s.SB), left: 'S', right: 'B' }
  ]
})

// --- 5. 动作函数 ---
const startQuiz = () => {
  gameState.value = 'quiz'
  currentIndex.value = 0
  userAnswers.value = []
}

const handleSelect = (score) => {
  userAnswers.value.push({
    dim: questions[currentIndex.value].dimension,
    score: score
  })

  if (currentIndex.value < questions.length - 1) {
    currentIndex.value++
  } else {
    gameState.value = 'result'
  }
}
</script>

<template>
  <div class="container">
    
    <div v-if="gameState === 'welcome'" class="welcome-box">
      <h1>心理学家倾向测试</h1>
      <p class="subtitle">探索你在哲学与心理学维度的深度定位</p>
      <div class="intro">
        本测试包含 32 道题目，将从决定论、可知论、元素论及灵魂肉体等四个维度分析你的思维模式。
      </div>
      <button class="start-btn" @click="startQuiz">开始测试</button>
    </div>

    <div v-else-if="gameState === 'quiz'" class="quiz-box">
      <div class="progress">题目：{{ currentIndex + 1 }} / {{ questions.length }}</div>
      <h2 class="question-text">{{ questions[currentIndex].text }}</h2>
      <div class="options">
        <button 
          v-for="(opt, index) in questions[currentIndex].options" 
          :key="index"
          @click="handleSelect(opt.score)"
        >
          {{ opt.text }}
        </button>
      </div>
    </div>

    <div v-else class="result-box">
  <p>你的心理倾向代号是：</p>
  <h1 class="type-code">{{ finalType }}</h1>

  <div class="analysis-container">
    <div v-for="item in dimensionAnalysis" :key="item.label" class="analysis-item">
      <div class="label-row">
        <span>{{ item.left }}</span>
        <span>{{ item.label }}</span>
        <span>{{ item.right }}</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" :style="{ width: item.percent + '%' }"></div>
      </div>
      <div class="percent-row">
        <span>{{ item.percent }}%</span>
        <span>{{ (100 - item.percent).toFixed(1) }}%</span>
      </div>
    </div>
  </div>

  <div class="result-container">
    <div class="main-result">
      <p class="type-tag">{{ currentResultData.dimension }}</p>
      <h1>{{ currentResultData.title }}</h1>
      <p class="main-desc">{{ currentResultData.desc }}</p>
    </div>

    <div class="mentor-box" v-if="currentResultData.mentorSection">
      <p class="mentor-intro">{{ currentResultData.mentorSection.intro }}</p>
      
      <div v-for="item in currentResultData.mentorSection.mentors" :key="item.name" class="mentor-card">
        <div class="card-header">
          <span class="mentor-name">{{ item.name }}</span>
          <span class="mentor-identity">{{ item.identity }}</span>
        </div>
        <p class="mentor-achieve"><strong>核心视角：</strong>{{ item.achievement }}</p>
        <div class="mentor-quote-box">
          <span class="quote-mark">"</span>
          <p class="quote-text">{{ item.quote }}</p>
          <span class="quote-mark" style="text-align: right">"</span>
        </div>
      </div>
    </div>

    <button class="retry-btn" @click="gameState = 'welcome'">返回主页</button>
  </div>
</div>

  </div>
</template>

<style>
/* 基础容器 */
.container { 
  max-width: 600px; 
  margin: 50px auto; 
  padding: 20px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif; 
  text-align: center;
}

/* 欢迎页样式 */
.welcome-box h1 { font-size: 2.2rem; color: #333; }
.subtitle { color: #666; margin-bottom: 20px; }
.intro { background: #f0f2f5; padding: 20px; border-radius: 12px; line-height: 1.6; margin-bottom: 30px; }
.start-btn { background: #646cff; color: white; border: none; padding: 15px 40px; border-radius: 50px; font-size: 1.1rem; cursor: pointer; }

/* 题目样式 */
.progress { color: #888; font-size: 0.9rem; margin-bottom: 10px; }
.question-text { font-size: 1.4rem; min-height: 80px; display: flex; align-items: center; justify-content: center; }

/* 选项竖排核心样式 */
.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.options button {
  width: 100%;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: white;
  font-size: 1rem;
  transition: all 0.2s;
}

.options button:hover {
  background: #f5f7ff;
  border-color: #646cff;
  color: #646cff;
}

/* 结果页样式 */
.type-code { font-size: 4rem; color: #646cff; margin: 10px 0; }
.result-desc { text-align: left; background: #fafafa; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
.retry-btn { border: 1px solid #ccc; background: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }

.analysis-container {
  margin: 30px 0;
  text-align: left;
}

.analysis-item {
  margin-bottom: 20px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 5px;
  color: #444;
}

.progress-bar-bg {
  height: 12px;
  background: #eee;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #646cff, #8a91ff);
  transition: width 1s ease-out; /* 增加动画效果 */
}

.percent-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #888;
  margin-top: 4px;
}

/* 导师区域容器 */
.mentor-box {
  margin-top: 30px;
  padding: 20px;
  background-color: #fcfaf2; /* 类似旧纸张的象牙色 */
  border-radius: 12px;
  border: 1px solid #e0d8c3;
}

.mentor-intro {
  font-size: 0.9rem;
  color: #8c7e6a;
  margin-bottom: 15px;
  text-align: center;
  font-style: italic;
}

/* 导师卡片 */
.mentor-card {
  margin-bottom: 20px;
  border-bottom: 1px dashed #d1c7ad;
  padding-bottom: 15px;
}

.mentor-name {
  font-weight: bold;
  font-size: 1.1rem;
  color: #333;
}

.mentor-identity {
  font-size: 0.8rem;
  background: #eee;
  padding: 2px 6px;
  margin-left: 8px;
  border-radius: 4px;
}

.mentor-achieve {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #555;
  margin: 10px 0;
}

/* 名言样式 */
.mentor-quote-box {
  background: rgba(255, 255, 255, 0.5);
  padding: 10px;
  border-left: 3px solid #8c7e6a;
}

.quote-text {
  font-family: "KaiTi", "STKaiti", serif; /* 尽量使用衬线体，显得有底蕴 */
  font-style: italic;
  color: #444;
}

</style>