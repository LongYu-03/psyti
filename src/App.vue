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


const starChainPoints = computed(() => {
  const s = totalScores.value; // 假设你的得分对象是 {DF: 2, EG: -1, KA: 1, SB: -2}
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;

  // 1. 定义四个轴的角度和对应的维度 Key
  // 注意：每个维度有两端，我们定义 0°方向为 D，180°方向为 F，以此类推
  const axes = [
    { angle: 0,   dim: 'DF', labelPos: 'right', labelNeg: 'left' },
    { angle: 45,  dim: 'EG', labelPos: 'bottom-right', labelNeg: 'top-left' },
    { angle: 90,  dim: 'KA', labelPos: 'bottom', labelNeg: 'top' },
    { angle: 135, dim: 'SB', labelPos: 'bottom-left', labelNeg: 'top-right' }
  ];

  return axes.map(axis => {
    // 假设得分范围是 -6 到 6
    const score = s[axis.dim] || 0;
    const distance = (score / 6) * maxRadius; // 距离中心点的位移
    const angleRad = (axis.angle * Math.PI) / 180;

    return {
      x: centerX + distance * Math.cos(angleRad),
      y: centerY + distance * Math.sin(angleRad)
    };
  });
});

// 生成“北斗七星”样的折线路径
const chainPath = computed(() => {
  const p = starChainPoints.value;
  return `M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y} L ${p[2].x} ${p[2].y} L ${p[3].x} ${p[3].y}`;
});

// --- 其余逻辑保持不变 ---
// 在 App.vue 的 <script setup> 找到 dimensionAnalysis 部分并修改
const dimensionAnalysis = computed(() => {
  const s = totalScores.value
  const calculatePercent = (val) => {
    const maxScore = 16 
    let percent = ((val + maxScore) / (maxScore * 2)) * 100
    return Math.max(0, Math.min(100, Number(percent).toFixed(1))) 
  }

  return [
    { 
      label: '决定论 vs 自由意志', 
      percent: calculatePercent(s.DF), 
      left: 'Determinism', right: 'Free Will',
      intro: '你相信人生是因果注定的必然，还是个体选择的创造？' 
    },
    { 
      label: '元素论 vs 格式塔', 
      percent: calculatePercent(s.EG), 
      left: 'Elementalism', right: 'Gestalt',
      intro: '你倾向于将心灵拆解为零件观察，还是将其视为不可分割的整体？'
    },
    { 
      label: '可知论 vs 不可知论', 
      percent: calculatePercent(s.KA), 
      left: 'Knowable', right: 'Agnosticism',
      intro: '你认为真理是可以被理性逻辑触及的，还是永远存在不可言说的深邃？'
    },
    { 
      label: '灵魂 vs 肉体', 
      percent: calculatePercent(s.SB), 
      left: 'Soul', right: 'Body',
      intro: '你认为人的本质是超越物质的精神实在，还是生物性的生理存在？'
    }
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

// 计算 4 个顶点的坐标
const starMapPoints = computed(() => {
  // 假设 dimensionAnalysis 是一个包含 4 个维度对象的数组
  // 每个对象有 percent (0-100) 属性
  const dims = dimensionAnalysis.value; 
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120; // 轴线最大半径

  // 定义 4 个维度的角度（交叉穿过圆心）
  const angles = [0, 90, 180, 270]; 

  return dims.map((d, i) => {
    // 将百分比(0-100) 转换为从中心出发的距离
    // 50% 处在圆心，>50% 向一端延伸，<50% 向另一端延伸
    const distance = ((d.percent - 50) / 50) * maxRadius;
    const angleRad = (angles[i] * Math.PI) / 180;
    
    return {
      x: centerX + distance * Math.cos(angleRad),
      y: centerY + distance * Math.sin(angleRad),
      label: d.label
    };
  });
});

// 生成多边形路径
const polygonPath = computed(() => {
  if (starMapPoints.value.length < 4) return "";
  const p = starMapPoints.value;
  return `M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y} L ${p[2].x} ${p[2].y} L ${p[3].x} ${p[3].y} Z`;
});

// 星星效果
const stars = ref([])
const quizProgress = computed(() => {
  return (currentIndex.value / questions.length) * 100
})

// 答题时加一颗星星
function handleSelect(score) {
  userAnswers.value.push({
    dim: questions[currentIndex.value].dimension,
    score: score
  })

  // ✨ 新加星星
  stars.value.push({
    id: Date.now() + Math.random(),
    bright: false
  })

  if (currentIndex.value < questions.length - 1) {
    currentIndex.value++
  } else {
    // 全部答完 → 所有星星变亮
    stars.value.forEach(s => (s.bright = true))
    gameState.value = 'result'
  }
}

// 重新开始时清空星星
function startQuiz() {
  gameState.value = 'quiz'
  currentIndex.value = 0
  userAnswers.value = []
  stars.value = [] // 清空星星
}


</script>


<template>
  <div class="container">
    
    <!-- 欢迎页 -->
    <div v-if="gameState === 'welcome'" class="welcome-box">
      <h1>你是哪位心理学家？</h1>
      <p style="font-size: 0.6rem; letter-spacing: 4px; color: #aaa; margin-top: -10px;">PSYCHOLOGIST TENDENCY TEST</p>
      <p class="subtitle">探索你在哲学与心理学维度的深度定位</p>
      <div class="intro">
        夫心理学者，格物致知之学也。本测试由 32 道思维命题组成，将引领你穿梭于因果注定与自由意志、元素拆解与整体感知之间，最终在思想的长河中寻得与你灵魂共鸣的先哲。
      </div>
      <button class="start-btn" @click="startQuiz">开始测试</button>
    </div>

    <!-- 测试页 -->
    <div v-else-if="gameState === 'quiz'" class="quiz-box">
      <div class="quiz-progress-bar">
        <div class="quiz-progress-fill" :style="{ width: quizProgress + '%' }"></div>
      </div>

      <h2 class="question-text" :class="{ 'text-small': questions[currentIndex].text.length > 50 }">
        {{ questions[currentIndex].text }}
      </h2>

      <div class="options">
        <button 
          v-for="(opt, index) in questions[currentIndex].options" 
          :key="index"
          @click="handleSelect(opt.score)"
          :class="{ 'opt-shrunk': opt.text.length > 13 }"
        >
          {{ opt.text }}
        </button>
      </div>
      
      <button v-if="currentIndex > 0" class="prev-btn" @click="currentIndex--">返回上一题</button>
    </div>

    <!-- 结果页（唯一、正确、不重复） -->
    <div v-else class="result-box" :style="{ '--theme-color': themeColor, '--final-type-watermark': `'${finalType}'`}">
      <div class="main-result reveal-item delay-1">
        <p class="type-tag">{{ currentResultData.dimension }}</p>
        <h1 class="result-title">{{ currentResultData.title }}</h1>
        <p class="main-desc">{{ currentResultData.desc }}</p>
      </div>

      <div class="star-map-wrapper reveal-item delay-2">
  <svg width="340" height="340" viewBox="0 0 340 340" class="star-map-svg">
    <circle cx="170" cy="170" r="120" class="orbit-ring" />

    <g class="axes-group">
      <line x1="50" y1="170" x2="290" y2="170" /> <line x1="85" y1="85" x2="255" y2="255" />  <line x1="170" y1="50" x2="170" y2="290" /> <line x1="255" y1="85" x2="85" y2="255" />  </g>
    
    <g class="axis-labels">
      <text x="300" y="175">自由</text><text x="40" y="175" text-anchor="end">决定</text>
      <text x="265" y="270">格式塔</text><text x="75" y="75" text-anchor="end">元素</text>
      <text x="170" y="40" text-anchor="middle">灵魂</text><text x="170" y="315" text-anchor="middle">肉体</text>
      <text x="75" y="270" text-anchor="end">可知</text><text x="265" y="75">不可知</text>
    </g>

    <path :d="chainPath" class="star-chain-line" />

    <circle v-for="(p, i) in starChainPoints" :key="i" 
            :cx="p.x" :cy="p.y" r="5" class="star-node" />
  
  </svg>
</div>


      <div class="mentor-box reveal-item delay-3" v-if="currentResultData.mentorSection">
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
            <span class="quote-mark">"</span>
          </div>
        </div>
      </div>

      <div class="result-actions">
        <button class="retry-btn" @click="gameState = 'welcome'">返回主页</button>
      </div>
    </div>

  </div>

<!-- ✨ 星星容器 ↓ 永远在最底部、不遮挡内容 -->
<div class="stars-container">
  <div 
    v-for="star in stars" 
    :key="star.id"
    class="star"
    :class="{ bright: star.bright }"
  ></div>
</div>

</template>


<style>
/* --- 全局极简主义 & 银灰基调 --- */
:root {
  --bg-color: #f6f6f6;         /* 浅银灰背景 */
  --text-main: #2c2c2c;        /* 深灰主文字 */
  --text-muted: #777777;       /* 辅助文字 */
  --border-color: #d1d1d1;     /* 极细分割线 */
  --theme-color: #5a6268;      /* 动态主题色初始值 */
}

.container { 
  max-width: 700px; 
  margin: 0 auto; 
  padding: 80px 25px;
  /* 纤细宋体设定 */
  font-family: "STSong", "Songti SC", "SimSun", "Noto Serif SC", serif; 
  font-weight: 300; 
  color: var(--text-main);
  background-color: var(--bg-color);
  min-height: 100vh;
  line-height: 1.8;
}

/* --- 首行缩进逻辑 --- */
/* 欢迎描述、结果详述、导师观点、长题目 */
.intro, .main-desc, .mentor-achieve {
  text-align: justify;
  text-indent: 2.1em; 
}

/* 题目文本：长题自适应 */
.question-text {
  font-size: 1.2rem;
  margin: 50px 0;
  text-align: center;
  font-weight: 400;
  transition: all 0.3s;
}
.question-text.text-small {
  text-indent: 2.1em;
  text-align: justify;
  font-size: 1.05rem;
}

/* --- 欢迎页面 --- */
.welcome-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0 40px; /* 增加顶部留白 */
  animation: fadeIn 1.2s ease-out; /* 增加进场动画 */
}

/* 标题：增加修饰线 */
.welcome-box h1 {
  font-size: 2.4rem;
  font-weight: 300;
  letter-spacing: 0.6rem;
  margin-bottom: 20px;
  position: relative;
  display: inline-block;
}

/* 标题下方的精致装饰线 */
.welcome-box h1::after {
  content: "";
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 1px;
  background-color: var(--deep-grey);
}

.subtitle {
  font-size: 0.9rem;
  color: var(--muted-grey);
  letter-spacing: 0.3rem;
  margin-top: 30px;
  margin-bottom: 60px;
  font-weight: 300;
}

/* 介绍区域：模拟书籍内页批注质感 */
.intro {
  max-width: 400px;
  margin: 0 auto 60px;
  padding: 30px;
  border-left: 1px solid var(--border-color); /* 只有左侧一线 */
  border-right: 1px solid var(--border-color); /* 只有右侧一线 */
  background: rgba(255, 255, 255, 0.3);
  color: var(--muted-grey);
  font-size: 0.95rem;
  line-height: 2;
  text-indent: 2em; /* 满足你首行缩进的要求 */
}

/* 开始按钮：极简矩形设计 */
.start-btn {
  background: var(--deep-grey);
  color: #000000;
  border: 1px solid var(--deep-grey);
  padding: 15px 80px;
  font-family: inherit;
  font-size: 1rem;
  letter-spacing: 0.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}

.start-btn:hover {
  background: transparent;
  color: var(--deep-grey);
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.1);
}

/* 简单的进场动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- 答题页进度条 --- */
.quiz-progress-bar {
  width: 100%;
  height: 1px; /* 极简一线天 */
  background: var(--border-color);
  margin-bottom: 60px;
}
.quiz-progress-fill {
  height: 100%;
  background: var(--text-main);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* --- 选项设计 --- */
.options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.options button {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 8px; /* 适度圆角 */
  padding: 20px;
  font-family: inherit;
  font-size: 1.1rem;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-main);
}
.options button:hover {
  background: var(--text-main);
  color: #fff;
  border-color: var(--text-main);
}
/* 长选项缩小 */
.options button.opt-shrunk {
  font-size: 0.95rem;
  padding: 16px;
}

/* 返回上一题 */
.prev-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 50px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
}
.prev-btn::before {
  content: "←";
  margin-right: 10px;
}
.prev-btn:hover { color: var(--text-main); }

/* --- 结果页：动态颜色适配 --- */
.result-title { 
  font-size: 2.4rem; 
  color: var(--theme-color); 
  margin: 20px 0 40px;
  font-weight: 400;
  text-align: center;
}
.main-desc {
  background: #fff;
  padding: 40px;
  border: 1px solid var(--border-color);
  margin-bottom: 60px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}
.type-code {
  font-size: 4rem;
  letter-spacing: 15px;
  color: var(--theme-color);
  font-family: "Garamond", serif;
  text-align: center;
  margin-bottom: 50px;
  font-weight: 200;
}



/* --- 思想长河导师 --- */
.mentor-box {
  margin-top: 100px;
  border-top: 1px solid var(--theme-color);
  padding-top: 50px;
  position: relative;
}
.mentor-box::after {
  content: "THE MENTORS";
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-color);
  padding: 0 20px;
  font-size: 0.7rem;
  letter-spacing: 4px;
  color: var(--theme-color);
}
.mentor-card {
  background: #fff;
  border: 1px solid var(--border-color);
  padding: 30px;
  margin-bottom: 40px;
  transition: transform 0.3s;
}
.mentor-card:hover { transform: translateY(-5px); border-color: var(--theme-color); }
.mentor-name { font-size: 1.3rem; color: var(--theme-color); border-bottom: 1px solid #eee; padding-bottom: 5px; }
.mentor-identity { font-size: 0.8rem; color: #999; margin-left: 12px; font-style: italic; }
.mentor-quote-box {
  margin-top: 25px;
  padding: 20px;
  background: #fcfcfc;
  border-left: 2px solid var(--theme-color);
}
.quote-text {
  font-family: "STKaiti", "KaiTi", serif;
  font-size: 1.1rem;
  color: #444;
}

.retry-btn {
  border: 1px solid var(--text-main);
  background: transparent;
  padding: 12px 50px;
  border-radius: 30px;
  cursor: pointer;
  margin: 60px 0;
  transition: all 0.3s;
}
.retry-btn:hover { background: var(--text-main); color: #fff; }

/* --- 1. 背景代号水印 --- */
.result-box::before {
  content: var(--final-type-watermark); /* 需要在 JS 中动态传入 */
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-size: 20rem;
  font-family: serif;
  font-weight: 900;
  color: var(--theme-color);
  opacity: 0.03; /* 极低透明度，若隐若现 */
  z-index: -1;
  pointer-events: none;
}

/* --- 2. 镂空引用框 (导师部分) --- */
.mentor-quote-box {
  margin-top: 25px;
  padding: 30px;
  background: transparent;
  border: 1px dashed var(--border-color); /* 虚线镂空感 */
  position: relative;
}

.quote-text {
  font-family: "STKaiti", "KaiTi", serif;
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-main);
  position: relative;
}

/* --- 3. 动态显影动画 --- */
.reveal-item {
  opacity: 0;
  transform: translateY(20px);
  animation: revealFade 0.8s ease-out forwards;
}

@keyframes revealFade {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 设置不同元素的延迟，制造层层递进的揭晓感 */
.delay-1 { animation-delay: 0.3s; }
.delay-2 { animation-delay: 0.8s; }
.delay-3 { animation-delay: 1.3s; }

.star-map-container {
  display: flex;
  justify-content: center;
  margin: 60px 0;
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(245,245,245,0) 70%);
}

.star-map-svg {
  overflow: visible;
  font-family: inherit;
}

/* 穿过圆心的轴线：极细、半透明 */
.axes-group line {
  stroke: var(--border-color);
  stroke-width: 0.5;
  stroke-dasharray: 4 4;
  opacity: 0.6;
}

.orbit-ring {
  fill: none;
  stroke: #eee;
  stroke-width: 1;
}

/* 核心：星链折线 */
.star-chain-line {
  fill: none;
  stroke: var(--theme-color);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  /* 增加类似星光的柔影 */
  filter: drop-shadow(0 0 5px var(--theme-color));
  transition: all 2s cubic-bezier(0.4, 0, 0.2, 1);
  stroke-dasharray: 500;
  stroke-dashoffset: 500;
  animation: drawLine 2.5s forwards ease-in-out 1s;
}

/* 星位点：像星星一样闪烁 */
.star-node {
  fill: #fff;
  stroke: var(--theme-color);
  stroke-width: 2;
  transition: all 2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: starPulse 3s infinite ease-in-out;
}

.axis-labels text {
  font-size: 11px;
  fill: #999;
  letter-spacing: 1px;
  font-weight: 300;
}

/* 动画1：折线像流星一样划过生成 */
@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}

/* 动画2：星位的呼吸感 */
@keyframes starPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; filter: blur(1px); }
}

/* 星星容器 —— 固定在最底部，不影响布局 */
.stars-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 140px;
  pointer-events: none; /* 不阻挡点击 */
  z-index: 1; /* 非常低，不会盖住文字 */
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 0 20px;
}

/* 星星样式：银色、半透明、纤细高级感 */
.star {
  width: 6px;
  height: 6px;
  background: #d0d3d9;
  border-radius: 50%;
  opacity: 0.4;
  transform: translateY(100px);
  animation: fall 0.9s ease forwards;
  transition: all 0.6s ease;
}

/* 答完所有题目 → 星星变亮 */
.star.bright {
  opacity: 0.8;
  background: #eef2ff;
  box-shadow: 0 0 10px #cdd5e3;
}

/* 掉落动画 */
@keyframes fall {
  to {
    transform: translateY(0);
  }
}

</style>