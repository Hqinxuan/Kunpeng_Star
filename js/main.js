/**
 * 智能天体识别与科普助手 — 主交互逻辑
 * 
 * 功能模块：
 *   1. 星空粒子背景动画
 *   2. 导航栏响应（滚动效果、移动端菜单、平滑滚动）
 *   3. 图片上传与预览
 *   4. 模拟 AI 天体识别流程
 *   5. 知识卡片渲染
 *   6. 在线/离线模式切换
 *   7. 滚动淡入动画
 */

// ==================== DOM 元素引用 ====================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const starCanvas = document.getElementById('starCanvas');
const uploadZone = document.getElementById('uploadZone');
const imageInput = document.getElementById('imageInput');
const uploadContent = document.getElementById('uploadContent');
const uploadPreview = document.getElementById('uploadPreview');
const previewImage = document.getElementById('previewImage');
const previewRemove = document.getElementById('previewRemove');
const btnRecognize = document.getElementById('btnRecognize');
const recognizeLoading = document.getElementById('recognizeLoading');
const resultPanel = document.getElementById('resultPanel');
const modeToggle = document.getElementById('modeToggle');
const modeOptions = document.querySelectorAll('.mode-option');
const modeHint = document.getElementById('modeHint');
const btnRetry = document.getElementById('btnRetry');

// ==================== 全局状态 ====================
let currentMode = 'online';
let uploadedFile = null;
let currentCelestial = null;

// ==================== 1. 星空粒子背景动画 ====================
(function initStarCanvas() {
  const ctx = starCanvas.getContext('2d');
  let stars = [];
  let animationId;

  function resize() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
  }

  function createStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * starCanvas.width,
        y: Math.random() * starCanvas.height,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random(),
        speed: Math.random() * 0.3 + 0.1,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  function drawStars() {
    ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);

    stars.forEach(star => {
      // 缓慢向上移动，模拟星空流转
      star.y -= star.speed;
      if (star.y < -5) {
        star.y = starCanvas.height + 5;
        star.x = Math.random() * starCanvas.width;
      }

      // 闪烁效果
      const twinkle = Math.sin(Date.now() * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.opacity * (0.5 + 0.5 * twinkle);

      // 绘制星星
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      // 较大星星添加光晕
      if (star.radius > 1.3) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 3);
        gradient.addColorStop(0, `rgba(108, 99, 255, ${alpha * 0.4})`);
        gradient.addColorStop(1, 'rgba(108, 99, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    });

    // 偶尔画流星
    if (Math.random() < 0.003) {
      drawShootingStar(ctx, starCanvas.width, starCanvas.height);
    }

    animationId = requestAnimationFrame(drawStars);
  }

  function drawShootingStar(ctx, w, h) {
    const x = Math.random() * w;
    const y = Math.random() * h * 0.5;
    const len = 80 + Math.random() * 100;
    const gradient = ctx.createLinearGradient(x, y, x - len, y + len * 0.5);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len, y + len * 0.5);
    ctx.stroke();
  }

  window.addEventListener('resize', () => {
    resize();
    createStars(200);
  });

  resize();
  createStars(200);
  drawStars();
})();

// ==================== 2. 导航栏交互 ====================
// 滚动时导航栏样式变化 + 激活对应锚点
window.addEventListener('scroll', () => {
  // 毛玻璃加深
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // 高亮当前区域对应的导航项
  const sections = document.querySelectorAll('section[id]');
  let currentSection = 'home';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) {
      currentSection = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSection}`) {
      link.classList.add('active');
    }
  });
});

// 移动端菜单切换
navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
  const isOpen = navMenu.classList.contains('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

// 点击导航链接关闭菜单
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
  });
});

// 点击页面其他区域关闭菜单
document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target) && navMenu.classList.contains('open')) {
    navMenu.classList.remove('open');
  }
});

// ==================== 3. 图片上传与预览 ====================
// 点击上传区域触发文件选择
uploadZone.addEventListener('click', (e) => {
  if (e.target === previewRemove || previewRemove.contains(e.target)) return;
  imageInput.click();
});

// 文件选择
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// 拖拽上传
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// 处理文件
function handleFile(file) {
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请上传图片文件（JPG / PNG / WebP）');
    return;
  }

  uploadedFile = file;

  // 预览图片
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    uploadContent.classList.add('hidden');
    uploadPreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);

  // 启用识别按钮
  btnRecognize.disabled = false;

  // 隐藏之前的结果
  resultPanel.classList.add('hidden');
  recognizeLoading.classList.add('hidden');
}

// 移除预览
previewRemove.addEventListener('click', (e) => {
  e.stopPropagation();
  uploadedFile = null;
  imageInput.value = '';
  uploadContent.classList.remove('hidden');
  uploadPreview.classList.add('hidden');
  btnRecognize.disabled = true;
  resultPanel.classList.add('hidden');
  recognizeLoading.classList.add('hidden');
});

// ==================== 4. 模拟 AI 天体识别流程 ====================
btnRecognize.addEventListener('click', () => {
  if (!uploadedFile) return;

  // 显示加载动画
  btnRecognize.classList.add('hidden');
  recognizeLoading.classList.remove('hidden');
  resultPanel.classList.add('hidden');

  // 模拟识别延迟（1.5-2.5秒）
  const delay = 1500 + Math.random() * 1000;

  setTimeout(() => {
    // 根据模式选择不同的匹配策略
    const celestial = matchCelestial(currentMode);
    currentCelestial = celestial;

    // 隐藏加载，显示结果
    recognizeLoading.classList.add('hidden');
    resultPanel.classList.remove('hidden');
    btnRecognize.classList.remove('hidden');

    // 渲染结果
    renderResult(celestial);

    // 平滑滚动到结果区域
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, delay);
});

// 天体匹配逻辑
function matchCelestial(mode) {
  if (!celestialData || celestialData.length === 0) {
    return getFallbackData();
  }

  if (mode === 'offline') {
    // 离线模式：只匹配星座和亮星（预置的本地数据）
    const localTargets = celestialData.filter(
      item => item.type === '星座' || item.type === '恒星'
    );
    return localTargets[Math.floor(Math.random() * localTargets.length)];
  } else {
    // 在线模式：可匹配所有天体，偏好返回较高置信度的结果
    return celestialData[Math.floor(Math.random() * celestialData.length)];
  }
}

// 备用数据（万一 data.js 未加载）
function getFallbackData() {
  return {
    name: '大熊座（北斗七星）',
    type: '星座',
    season: '全年可见（北半球）',
    distance: '78 ~ 124 光年',
    description: '北斗七星是大熊座中最亮的七颗星，在北半球常年可见，形如一把巨大的勺子。',
    funFact: '北斗七星在古代是天然的指南针，用它就能找到北极星！'
  };
}

// ==================== 5. 知识卡片渲染 ====================
function renderResult(celestial) {
  // 计算置信度（在线模式高，离线模式略低）
  let confidence;
  if (currentMode === 'online') {
    confidence = 88 + Math.floor(Math.random() * 11); // 88-98%
  } else {
    confidence = 65 + Math.floor(Math.random() * 16); // 65-80%
  }

  // 填充数据
  document.getElementById('resultName').textContent = celestial.name;
  document.getElementById('resultTag').textContent = celestial.type;
  document.getElementById('confidenceValue').textContent = confidence + '%';
  document.getElementById('confidenceBar').style.width = confidence + '%';
  document.getElementById('knowledgeDesc').textContent = celestial.description;
  document.getElementById('funFactText').textContent = celestial.funFact;
  document.getElementById('metaDistance').textContent = celestial.distance || '未知';
  document.getElementById('metaSeason').textContent = celestial.season || '未知';

  // 置信度颜色
  const confidenceValue = document.getElementById('confidenceValue');
  const confidenceBar = document.getElementById('confidenceBar');
  if (confidence >= 90) {
    confidenceValue.style.color = 'var(--success)';
    confidenceBar.style.background = 'linear-gradient(90deg, #6C63FF, #4ADE80)';
  } else if (confidence >= 75) {
    confidenceValue.style.color = 'var(--warning)';
    confidenceBar.style.background = 'linear-gradient(90deg, #6C63FF, #F59E0B)';
  } else {
    confidenceValue.style.color = 'var(--danger)';
    confidenceBar.style.background = 'linear-gradient(90deg, #6C63FF, #EF4444)';
  }

  // 重新触发入场动画
  resultPanel.style.animation = 'none';
  resultPanel.offsetHeight; // 强制回流
  resultPanel.style.animation = 'slideInRight 0.6s ease';
}

// 重新识别按钮
btnRetry.addEventListener('click', () => {
  resultPanel.classList.add('hidden');
  recognizeLoading.classList.remove('hidden');
  btnRecognize.classList.add('hidden');

  const delay = 1200 + Math.random() * 800;
  setTimeout(() => {
    const celestial = matchCelestial(currentMode);
    currentCelestial = celestial;
    recognizeLoading.classList.add('hidden');
    resultPanel.classList.remove('hidden');
    btnRecognize.classList.remove('hidden');
    renderResult(celestial);
  }, delay);
});

// ==================== 6. 在线/离线模式切换 ====================
modeOptions.forEach(option => {
  option.addEventListener('click', () => {
    // 更新选中状态
    modeOptions.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');

    // 更新当前模式
    currentMode = option.dataset.mode;

    // 更新提示文字
    if (currentMode === 'online') {
      modeHint.textContent = '（联网增强识别精度 + Plate Solving 天图解析校准）';
    } else {
      modeHint.textContent = '（仅使用本地 88 星座 + 亮星数据，基础识别离线可用）';
    }

    // 如果已有识别结果，重新识别
    if (uploadedFile && currentCelestial) {
      resultPanel.classList.add('hidden');
      recognizeLoading.classList.remove('hidden');
      btnRecognize.classList.add('hidden');

      setTimeout(() => {
        const celestial = matchCelestial(currentMode);
        currentCelestial = celestial;
        recognizeLoading.classList.add('hidden');
        resultPanel.classList.remove('hidden');
        btnRecognize.classList.remove('hidden');
        renderResult(celestial);
      }, 1000);
    }
  });
});

// ==================== 7. 滚动淡入动画 ====================
(function initScrollReveal() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // 为特色卡片、区块标题等元素添加淡入动画
  document.querySelectorAll('.feature-card, .section-header, .experience-main > *').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
})();

// ==================== 补充：CTA 按钮平滑滚动 ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ==================== 初始化确认 ====================
console.log('🔭 智能天体识别与科普助手 Demo 已就绪');
console.log('📚 预置天体数据：' + (celestialData ? celestialData.length : 0) + ' 条');
console.log('👨‍🎓 项目作者：陈思宇 | 鲲鹏少年院');
console.log('📌 AI 创新创业项目 | 初中生科创展示 Demo');
