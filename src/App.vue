<script setup>
import { ref, computed } from 'vue'
// 核心修复 1：确保导入的名称和 questions.js 中导出的一致
import { questions, resultDescriptions } from './questions'

const gameState = ref('welcome') 
const currentIndex = ref(0)
const userAnswers = ref([])

const totalScores = computed(() => {
  let scores = { DF: 0, KA: 0, EG: 0, SB: 0 }
  userAnswers.value.forEach((ans) => {
    if (scores.hasOwnProperty(ans.dim)) {
      scores[ans.dim] += ans.score
    }
  })
  return scores
})

// 核心修复 2：调整字母拼接顺序，使其严格匹配 questions.js 里的 Key (D/F -> E/G -> K/A -> S/B)
const finalType = computed(() => {
  const s = totalScores.value
  const res = [
    s.DF >= 0 ? 'D' : 'F',
    s.EG >= 0 ? 'E' : 'G', // 你的数据文件里第二位是元素/格式塔
    s.KA >= 0 ? 'K' : 'A', // 第三位是可知/不可知
    s.SB >= 0 ? 'S' : 'B'
  ]
  return res.join('')
})

// 核心修复 3：补全 currentResultData 计算属性，让模板能抓到文案
const currentResultData = computed(() => {
  const code = finalType.value
  // 从导入的 resultDescriptions 中查找，如果没找到则返回默认值防止报错
  return resultDescriptions[code] || { 
    title: "探索中...", 
    dimension: "未知维度", 
    desc: "描述信息加载中，请检查代号匹配。",
    mentorSection: null 
  }
})

// --- 其余逻辑保持不变 ---
const dimensionAnalysis = computed(() => {
  const s = totalScores.value
  const calculatePercent = (val) => {
    const maxScore = 16 
    let percent = ((val + maxScore) / (maxScore * 2)) * 100
    return Math.max(0, Math.min(100, Number(percent).toFixed(1))) 
  }
  return [
    { label: '决定论 vs 自由意志', percent: calculatePercent(s.DF), left: 'D', right: 'F' },
    { label: '元素论 vs 格式塔', percent: calculatePercent(s.EG), left: 'E', right: 'G' },
    { label: '可知论 vs 不可知论', percent: calculatePercent(s.KA), left: 'K', right: 'A' },
    { label: '灵魂 vs 肉体', percent: calculatePercent(s.SB), left: 'S', right: 'B' }
  ]
})

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
      <button 
        v-if="currentIndex > 0" 
        class="prev-btn" 
        @click="currentIndex--"
      >
        ← 返回上一题
      </button>
    </div>

    <div v-else class="result-box">
      
      <div class="main-result">
        <p class="type-tag">{{ currentResultData.dimension }}</p>
        <h1 class="result-title">{{ currentResultData.title }}</h1>
        <p class="main-desc">{{ currentResultData.desc }}</p>
      </div>

      <div class="data-evidence">
        <p class="code-intro">你的心理倾向代号是：</p>
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

      <div class="result-actions">
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


/* --- 结果页核心布局 --- */
.result-box {
  text-align: center;
  padding: 10px;
}

/* 顶部标题与描述 */
.type-tag {
  color: #646cff;
  font-weight: bold;
  letter-spacing: 2px;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.result-title {
  font-size: 2.2rem;
  color: #333;
  margin: 10px 0 20px 0;
  line-height: 1.2;
}

.main-desc {
  text-align: left;
  background: #fdfdfd;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  line-height: 1.8;
  color: #444;
  margin-bottom: 40px;
  font-size: 1.05rem;
}

/* 中部数据与代号 */
.data-evidence {
  margin-bottom: 40px;
  padding: 20px;
  background: #fff;
}

.code-intro {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 5px;
}

.type-code { 
  font-size: 3rem; /* 稍微调小，配合新布局 */
  color: #646cff; 
  margin: 0 0 30px 0; 
  letter-spacing: 4px;
}

.analysis-container {
  margin: 20px 0;
  text-align: left;
}

.analysis-item {
  margin-bottom: 25px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: #444;
}

.progress-bar-bg {
  height: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #646cff, #8a91ff);
  transition: width 1s ease-out;
}

.percent-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 6px;
}

/* 底部智者区域 */
.mentor-box {
  margin-top: 40px;
  padding: 25px 20px;
  background-color: #fcfaf2; /* 纸张质感 */
  border-radius: 16px;
  border: 1px solid #e0d8c3;
  text-align: left;
}

.mentor-intro {
  font-size: 0.95rem;
  color: #8c7e6a;
  margin-bottom: 25px;
  text-align: center;
  font-style: italic;
  font-weight: bold;
}

.mentor-card {
  margin-bottom: 30px;
  border-bottom: 1px dashed #d1c7ad;
  padding-bottom: 20px;
}

.mentor-card:last-child {
  border-bottom: none;
}

.mentor-name {
  font-weight: bold;
  font-size: 1.15rem;
  color: #222;
}

.mentor-identity {
  font-size: 0.8rem;
  background: #e9e5d7;
  color: #7a6e5a;
  padding: 2px 8px;
  margin-left: 10px;
  border-radius: 4px;
}

.mentor-achieve {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #5d5446;
  margin: 12px 0;
}

.mentor-quote-box {
  background: rgba(255, 255, 255, 0.6);
  padding: 15px;
  border-left: 4px solid #8c7e6a;
  border-radius: 0 8px 8px 0;
}

.quote-text {
  font-family: "STKaiti", "KaiTi", serif;
  font-style: italic;
  font-size: 1rem;
  color: #3e3830;
  margin: 0;
  line-height: 1.5;
}

/* 操作按钮 */
.result-actions {
  margin-top: 40px;
  padding-bottom: 40px;
}

.retry-btn { 
  border: 1px solid #646cff; 
  background: white; 
  color: #646cff;
  padding: 12px 30px; 
  border-radius: 25px; 
  cursor: pointer; 
  font-size: 1rem;
  transition: all 0.3s;
}

.retry-btn:hover {
  background: #646cff;
  color: white;
}


</style>