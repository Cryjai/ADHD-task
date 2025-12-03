// ============================================
// ADHD Hustle Pro - Complete Application
// ============================================

// State Management
const state = {
  tasks: [],
  stats: {
    currentCombo: 0,
    longestCombo: 0,
    totalStars: 0,
    totalCompleted: 0,
    tasksSkipped: 0,
    consecutiveNoSkip: 0,
    dailyHistory: {}, // Format: { 'YYYY-MM-DD': { completed: 0, stars: 0 } }
    categoryStats: { Work: 0, Study: 0, Health: 0, Personal: 0, Social: 0 },
    lastCompletionDate: null
  },
  achievements: {
    first_task: false,
    combo_5: false,
    combo_10: false,
    streak_7: false,
    stars_100: false,
    perfectionist: false,
    speed_runner: false,
    night_owl: false,
    early_bird: false,
    balanced: false
  },
  missions: [],
  timer: {
    active: false,
    taskId: null,
    duration: 0,
    remaining: 0,
    intervalId: null,
    paused: false,
    startTime: null
  },
  currentView: 'today',
  currentFilter: 'all',
  editingTaskId: null,
  volume: 0.7,
  speedRunStart: null,
  speedRunCount: 0
};

// Achievement Definitions
const achievementData = {
  first_task: { name: 'First Step', description: 'Complete your first task', icon: '🎯' },
  combo_5: { name: 'On Fire', description: 'Reach 5 combo', icon: '🔥' },
  combo_10: { name: 'Combo Master', description: 'Reach 10 combo', icon: '⚡' },
  streak_7: { name: 'Week Warrior', description: 'Complete tasks for 7 days', icon: '📅' },
  stars_100: { name: 'Century Club', description: 'Earn 100 stars', icon: '💯' },
  perfectionist: { name: 'No Mistakes', description: 'Complete 10 tasks without skipping', icon: '✨' },
  speed_runner: { name: 'Lightning Fast', description: 'Complete 3 tasks in under 10 minutes', icon: '⚡' },
  night_owl: { name: 'Night Owl', description: 'Complete a task after 11 PM', icon: '🌙' },
  early_bird: { name: 'Early Riser', description: 'Complete a task before 7 AM', icon: '🌅' },
  balanced: { name: 'Well Rounded', description: 'Complete tasks in all 5 categories', icon: '🎨' }
};

// Daily Mission Templates
const missionTemplates = [
  { id: 'complete_all', title: 'Complete all tasks on time', check: () => {
    const incompleteTasks = state.tasks.filter(t => !t.completed && !t.deleted);
    return incompleteTasks.length === 0 && state.tasks.filter(t => t.completed).length > 0;
  }, reward: 50 },
  { id: 'stars_100', title: 'Earn 100 stars today', check: () => getTodayStats().stars >= 100, reward: 50 },
  { id: 'combo_5', title: 'Maintain 5+ combo', check: () => state.stats.currentCombo >= 5, reward: 30 },
  { id: 'complete_3', title: 'Complete 3 tasks', check: () => getTodayStats().completed >= 3, reward: 30 },
  { id: 'no_skip', title: 'No skipped tasks', check: () => getTodayStats().skipped === 0 && getTodayStats().completed > 0, reward: 40 },
  { id: 'same_category', title: 'All tasks in same category', check: () => {
    const todayCompleted = state.tasks.filter(t => t.completed && isToday(t.completedAt));
    if (todayCompleted.length < 2) return false;
    const category = todayCompleted[0].category;
    return todayCompleted.every(t => t.category === category);
  }, reward: 35 }
];

// ============================================
// Utility Functions
// ============================================

function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function isToday(timestamp) {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function getTodayStats() {
  const today = getToday();
  return state.stats.dailyHistory[today] || { completed: 0, stars: 0, skipped: 0 };
}

function updateDailyHistory(updates) {
  const today = getToday();
  if (!state.stats.dailyHistory[today]) {
    state.stats.dailyHistory[today] = { completed: 0, stars: 0, skipped: 0 };
  }
  Object.assign(state.stats.dailyHistory[today], updates);
}

function getCategoryIcon(category) {
  const icons = {
    Work: '💼',
    Study: '📚',
    Health: '💪',
    Personal: '🌟',
    Social: '👥'
  };
  return icons[category] || '📋';
}

// ============================================
// Audio System
// ============================================

const AudioSystem = {
  context: null,
  
  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  },
  
  playSound(frequency, duration, type = 'sine') {
    if (!this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(state.volume * 0.3, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  },
  
  playComplete() {
    this.playSound(523.25, 0.1); // C5
    setTimeout(() => this.playSound(659.25, 0.1), 100); // E5
    setTimeout(() => this.playSound(783.99, 0.2), 200); // G5
  },
  
  playAchievement() {
    this.playSound(440, 0.1);
    setTimeout(() => this.playSound(554.37, 0.1), 100);
    setTimeout(() => this.playSound(659.25, 0.1), 200);
    setTimeout(() => this.playSound(880, 0.3), 300);
  },
  
  playCombo() {
    this.playSound(659.25, 0.1);
    setTimeout(() => this.playSound(783.99, 0.15), 80);
  },
  
  playTimerEnd() {
    this.playSound(880, 0.1);
    setTimeout(() => this.playSound(880, 0.1), 150);
    setTimeout(() => this.playSound(880, 0.2), 300);
  },
  
  playSkip() {
    this.playSound(330, 0.3, 'sawtooth');
  }
};

// ============================================
// Animation System
// ============================================

function createConfetti() {
  const container = document.getElementById('confetti-container');
  const colors = ['#2BA6B2', '#E68161', '#FF5459', '#FFD700', '#32B8C6'];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.3 + 's';
    confetti.style.animationDuration = (Math.random() * 1 + 2) + 's';
    container.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
}

function animateBadge(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add('bounce');
    setTimeout(() => element.classList.remove('bounce'), 500);
  }
}

function animateDuo(animation) {
  const duo = document.getElementById('duo-character');
  duo.classList.add(animation);
  setTimeout(() => duo.classList.remove(animation), 600);
}

// ============================================
// Task Management
// ============================================

function addTask(name, description, duration, category) {
  const task = {
    id: generateId(),
    name,
    description,
    duration: parseInt(duration),
    category,
    completed: false,
    deleted: false,
    createdAt: Date.now(),
    completedAt: null
  };
  
  state.tasks.push(task);
  renderTasks();
  return task;
}

function editTask(taskId, updates) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    Object.assign(task, updates);
    renderTasks();
  }
}

function deleteTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.deleted = true;
    renderTasks();
  }
}

function toggleTaskComplete(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task && !task.deleted) {
    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    
    if (task.completed) {
      completeTask(task);
    }
    
    renderTasks();
  }
}

function completeTask(task) {
  // Award stars (1 star per minute)
  const stars = Math.max(1, Math.floor(task.duration / 5));
  state.stats.totalStars += stars;
  state.stats.totalCompleted++;
  state.stats.currentCombo++;
  state.stats.consecutiveNoSkip++;
  
  // Update longest combo
  if (state.stats.currentCombo > state.stats.longestCombo) {
    state.stats.longestCombo = state.stats.currentCombo;
  }
  
  // Update daily history
  const todayStats = getTodayStats();
  updateDailyHistory({
    completed: todayStats.completed + 1,
    stars: todayStats.stars + stars
  });
  
  // Update category stats
  state.stats.categoryStats[task.category]++;
  
  // Speed runner tracking
  if (!state.speedRunStart) {
    state.speedRunStart = Date.now();
    state.speedRunCount = 1;
  } else {
    const elapsed = (Date.now() - state.speedRunStart) / 1000 / 60; // minutes
    if (elapsed <= 10) {
      state.speedRunCount++;
    } else {
      state.speedRunStart = Date.now();
      state.speedRunCount = 1;
    }
  }
  
  // Effects
  createConfetti();
  AudioSystem.playComplete();
  animateDuo('celebrate');
  animateBadge('combo-badge');
  animateBadge('stars-badge');
  
  // Check achievements
  checkAchievements();
  
  // Update missions
  checkMissions();
  
  // Update UI
  updateStatsDisplay();
  renderTasks();
}

function skipTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    // Reset combo
    state.stats.currentCombo = 0;
    state.stats.tasksSkipped++;
    state.stats.consecutiveNoSkip = 0;
    
    // Update daily history
    const todayStats = getTodayStats();
    updateDailyHistory({
      skipped: todayStats.skipped + 1
    });
    
    // Speed runner reset
    state.speedRunStart = null;
    state.speedRunCount = 0;
    
    AudioSystem.playSkip();
    animateDuo('sad');
    
    updateStatsDisplay();
  }
}

// ============================================
// Timer System
// ============================================

function startTimer(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  state.timer = {
    active: true,
    taskId,
    duration: task.duration * 60,
    remaining: task.duration * 60,
    intervalId: null,
    paused: false,
    startTime: Date.now()
  };
  
  renderTimer();
  runTimer();
}

function runTimer() {
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
  }
  
  state.timer.intervalId = setInterval(() => {
    if (!state.timer.paused && state.timer.remaining > 0) {
      state.timer.remaining--;
      updateTimerDisplay();
      
      if (state.timer.remaining === 0) {
        timerComplete();
      }
    }
  }, 1000);
}

function pauseTimer() {
  state.timer.paused = !state.timer.paused;
  const pauseBtn = document.getElementById('timer-pause');
  if (pauseBtn) {
    pauseBtn.textContent = state.timer.paused ? '▶ Resume' : '⏸ Pause';
  }
}

function stopTimer() {
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
  }
  state.timer.active = false;
  state.timer.taskId = null;
  renderTimer();
}

function timerComplete() {
  const task = state.tasks.find(t => t.id === state.timer.taskId);
  if (task) {
    task.completed = true;
    task.completedAt = Date.now();
    completeTask(task);
  }
  
  AudioSystem.playTimerEnd();
  stopTimer();
}

function updateTimerDisplay() {
  const timerText = document.getElementById('timer-text');
  const progressCircle = document.getElementById('timer-progress-circle');
  
  if (timerText) {
    timerText.textContent = formatTime(state.timer.remaining);
  }
  
  if (progressCircle) {
    const circumference = 2 * Math.PI * 90;
    const progress = state.timer.remaining / state.timer.duration;
    const offset = circumference * (1 - progress);
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = `${offset}`;
  }
}

// ============================================
// Achievements System
// ============================================

function checkAchievements() {
  const checks = {
    first_task: () => state.stats.totalCompleted >= 1,
    combo_5: () => state.stats.currentCombo >= 5,
    combo_10: () => state.stats.currentCombo >= 10,
    streak_7: () => {
      const last7Days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
      }
      return last7Days.every(date => {
        const stats = state.stats.dailyHistory[date];
        return stats && stats.completed > 0;
      });
    },
    stars_100: () => state.stats.totalStars >= 100,
    perfectionist: () => state.stats.consecutiveNoSkip >= 10,
    speed_runner: () => state.speedRunCount >= 3,
    night_owl: () => {
      const lastCompleted = state.tasks.filter(t => t.completed).pop();
      if (!lastCompleted) return false;
      const hour = new Date(lastCompleted.completedAt).getHours();
      return hour >= 23 || hour < 1;
    },
    early_bird: () => {
      const lastCompleted = state.tasks.filter(t => t.completed).pop();
      if (!lastCompleted) return false;
      const hour = new Date(lastCompleted.completedAt).getHours();
      return hour < 7;
    },
    balanced: () => {
      return Object.values(state.stats.categoryStats).every(count => count > 0);
    }
  };
  
  for (const [key, check] of Object.entries(checks)) {
    if (!state.achievements[key] && check()) {
      unlockAchievement(key);
    }
  }
}

function unlockAchievement(achievementId) {
  state.achievements[achievementId] = true;
  const achievement = achievementData[achievementId];
  
  AudioSystem.playAchievement();
  showAchievementToast(achievement);
  renderAchievements();
}

function showAchievementToast(achievement) {
  const toast = document.getElementById('achievement-toast');
  const title = toast.querySelector('.achievement-title');
  const desc = toast.querySelector('.achievement-desc');
  const icon = toast.querySelector('.achievement-icon');
  
  title.textContent = achievement.name;
  desc.textContent = achievement.description;
  icon.textContent = achievement.icon;
  
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// ============================================
// Daily Missions System
// ============================================

function generateDailyMissions() {
  const today = getToday();
  const savedDate = state.missions[0]?.date;
  
  // Generate new missions if it's a new day
  if (savedDate !== today) {
    const shuffled = [...missionTemplates].sort(() => Math.random() - 0.5);
    state.missions = shuffled.slice(0, 3).map(template => ({
      ...template,
      completed: false,
      date: today
    }));
  }
}

function checkMissions() {
  let anyCompleted = false;
  
  state.missions.forEach(mission => {
    if (!mission.completed && mission.check()) {
      mission.completed = true;
      state.stats.totalStars += mission.reward;
      anyCompleted = true;
      
      const todayStats = getTodayStats();
      updateDailyHistory({
        stars: todayStats.stars + mission.reward
      });
    }
  });
  
  if (anyCompleted) {
    AudioSystem.playAchievement();
    animateDuo('celebrate');
    updateStatsDisplay();
  }
  
  renderMissions();
}

// ============================================
// Rendering Functions
// ============================================

function renderTasks() {
  const todayList = document.getElementById('today-task-list');
  const allList = document.getElementById('all-tasks-list');
  
  const activeTasks = state.tasks.filter(t => !t.deleted);
  
  // Filter for current view
  const filteredTasks = state.currentFilter === 'all' 
    ? activeTasks 
    : activeTasks.filter(t => t.category === state.currentFilter);
  
  // Render today's tasks
  if (todayList) {
    const todayTasks = activeTasks.filter(t => !t.completed);
    todayList.innerHTML = todayTasks.length === 0 
      ? '<p style="text-align: center; color: var(--color-text-secondary); padding: 40px;">No tasks yet! Add your first task to get started 🎯</p>'
      : todayTasks.map(task => createTaskHTML(task)).join('');
  }
  
  // Render all tasks
  if (allList) {
    allList.innerHTML = filteredTasks.length === 0
      ? '<p style="text-align: center; color: var(--color-text-secondary); padding: 40px;">No tasks found</p>'
      : filteredTasks.map(task => createTaskHTML(task, true)).join('');
  }
  
  attachTaskEventListeners();
}

function createTaskHTML(task, showEdit = false) {
  const categoryClass = `category-${task.category.toLowerCase()}`;
  const checkedClass = task.completed ? 'checked' : '';
  const completedClass = task.completed ? 'completed' : '';
  
  return `
    <div class="task-item ${completedClass}" data-task-id="${task.id}">
      <div class="task-checkbox ${checkedClass}" data-action="toggle"></div>
      <div class="task-info">
        <div class="task-name">${task.name}</div>
        <div class="task-meta">
          <span class="task-category ${categoryClass}">${getCategoryIcon(task.category)} ${task.category}</span>
          <span>⏱ ${task.duration} min</span>
        </div>
      </div>
      <div class="task-actions">
        ${!task.completed ? `<button class="btn-icon" data-action="start" title="Start timer">▶️</button>` : ''}
        ${showEdit ? `<button class="btn-icon" data-action="edit" title="Edit">✏️</button>` : ''}
        <button class="btn-icon" data-action="delete" title="Delete">🗑️</button>
      </div>
    </div>
  `;
}

function attachTaskEventListeners() {
  document.querySelectorAll('.task-item').forEach(item => {
    const taskId = item.dataset.taskId;
    
    item.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        
        switch (action) {
          case 'toggle':
            toggleTaskComplete(taskId);
            break;
          case 'start':
            startTimer(taskId);
            break;
          case 'edit':
            openEditTaskModal(taskId);
            break;
          case 'delete':
            confirmDelete(taskId);
            break;
        }
      });
    });
  });
}

function renderTimer() {
  const timerCard = document.getElementById('timer-card');
  const timerName = document.getElementById('timer-task-name');
  
  if (state.timer.active) {
    const task = state.tasks.find(t => t.id === state.timer.taskId);
    if (task) {
      timerCard.classList.remove('hidden');
      timerName.textContent = task.name;
      updateTimerDisplay();
    }
  } else {
    timerCard.classList.add('hidden');
  }
}

function renderMissions() {
  const missionsList = document.getElementById('missions-list');
  
  missionsList.innerHTML = state.missions.map(mission => {
    const progress = mission.check() ? 100 : 0;
    const completedClass = mission.completed ? 'completed' : '';
    
    return `
      <div class="mission-item ${completedClass}">
        <div class="mission-title">${mission.completed ? '✅' : '🎯'} ${mission.title}</div>
        <div class="mission-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <span style="font-size: 12px; font-weight: 600;">${progress}%</span>
        </div>
        <div class="mission-reward">Reward: ${mission.reward} ⭐</div>
      </div>
    `;
  }).join('');
}

function renderAchievements() {
  const grid = document.getElementById('achievements-grid');
  
  grid.innerHTML = Object.entries(achievementData).map(([id, achievement]) => {
    const unlocked = state.achievements[id];
    const unlockedClass = unlocked ? 'unlocked' : 'locked';
    
    return `
      <div class="achievement-card ${unlockedClass}">
        <span class="achievement-icon">${achievement.icon}</span>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
    `;
  }).join('');
}

function updateStatsDisplay() {
  // Update header badges
  document.getElementById('combo-count').textContent = state.stats.currentCombo;
  document.getElementById('stars-count').textContent = state.stats.totalStars;
  
  // Update mini stats
  document.getElementById('longest-combo').textContent = state.stats.longestCombo;
  document.getElementById('total-stars-display').textContent = state.stats.totalStars;
  document.getElementById('total-completed').textContent = state.stats.totalCompleted;
  
  // Update records in stats view
  document.getElementById('record-combo').textContent = state.stats.longestCombo;
  document.getElementById('record-stars').textContent = state.stats.totalStars;
  document.getElementById('record-completed').textContent = state.stats.totalCompleted;
  
  const totalTasks = state.tasks.filter(t => !t.deleted).length;
  const completionRate = totalTasks > 0 ? Math.round((state.stats.totalCompleted / totalTasks) * 100) : 0;
  document.getElementById('record-rate').textContent = completionRate + '%';
  
  const completedTasks = state.tasks.filter(t => t.completed && !t.deleted);
  const avgDuration = completedTasks.length > 0
    ? Math.round(completedTasks.reduce((sum, t) => sum + t.duration, 0) / completedTasks.length)
    : 0;
  document.getElementById('record-duration').textContent = avgDuration + ' min';
}

function renderCharts() {
  renderWeekChart();
  renderCategoryChart();
}

function renderWeekChart() {
  const ctx = document.getElementById('week-chart');
  if (!ctx) return;
  
  const last7Days = [];
  const labels = [];
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last7Days.push(dateStr);
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    
    const dayStats = state.stats.dailyHistory[dateStr] || { completed: 0 };
    data.push(dayStats.completed);
  }
  
  if (window.weekChart) {
    window.weekChart.destroy();
  }
  
  window.weekChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tasks Completed',
        data,
        backgroundColor: '#2BA6B2',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

function renderCategoryChart() {
  const ctx = document.getElementById('category-chart');
  if (!ctx) return;
  
  const categories = Object.keys(state.stats.categoryStats);
  const data = categories.map(cat => state.stats.categoryStats[cat]);
  
  if (window.categoryChart) {
    window.categoryChart.destroy();
  }
  
  window.categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories.map(cat => `${getCategoryIcon(cat)} ${cat}`),
      datasets: [{
        data,
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// ============================================
// Modal Management
// ============================================

function openAddTaskModal() {
  state.editingTaskId = null;
  document.getElementById('modal-title').textContent = 'Add New Task';
  document.getElementById('task-form').reset();
  document.getElementById('task-modal').classList.remove('hidden');
}

function openEditTaskModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  state.editingTaskId = taskId;
  document.getElementById('modal-title').textContent = 'Edit Task';
  document.getElementById('task-name').value = task.name;
  document.getElementById('task-description').value = task.description || '';
  document.getElementById('task-duration').value = task.duration;
  document.getElementById('task-category').value = task.category;
  document.getElementById('task-modal').classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function confirmDelete(taskId) {
  const modal = document.getElementById('confirm-modal');
  document.getElementById('confirm-title').textContent = 'Delete Task';
  document.getElementById('confirm-message').textContent = 'Are you sure you want to delete this task?';
  modal.classList.remove('hidden');
  
  const confirmBtn = document.getElementById('confirm-ok');
  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  
  newBtn.addEventListener('click', () => {
    deleteTask(taskId);
    closeModal('confirm-modal');
  });
}

// ============================================
// Backup & Restore
// ============================================

function exportData() {
  const data = {
    version: '1.0',
    exportDate: Date.now(),
    tasks: state.tasks,
    stats: state.stats,
    achievements: state.achievements,
    missions: state.missions
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `adhd-hustle-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      state.tasks = data.tasks || [];
      state.stats = data.stats || state.stats;
      state.achievements = data.achievements || state.achievements;
      state.missions = data.missions || [];
      
      renderTasks();
      renderMissions();
      renderAchievements();
      updateStatsDisplay();
      renderCharts();
      
      alert('✅ Data restored successfully!');
    } catch (error) {
      alert('❌ Error importing data: ' + error.message);
    }
  };
  
  reader.readAsText(file);
}

// ============================================
// Event Listeners
// ============================================

function initializeEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
  
  // Add task buttons
  document.getElementById('add-task-btn').addEventListener('click', openAddTaskModal);
  document.getElementById('add-task-btn-2').addEventListener('click', openAddTaskModal);
  
  // Task form
  document.getElementById('task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('task-name').value;
    const description = document.getElementById('task-description').value;
    const duration = document.getElementById('task-duration').value;
    const category = document.getElementById('task-category').value;
    
    if (state.editingTaskId) {
      editTask(state.editingTaskId, { name, description, duration: parseInt(duration), category });
    } else {
      addTask(name, description, duration, category);
    }
    
    closeModal('task-modal');
  });
  
  // Modal close buttons
  document.querySelectorAll('.modal-overlay, #modal-close, #cancel-btn').forEach(el => {
    el.addEventListener('click', () => closeModal('task-modal'));
  });
  
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    closeModal('confirm-modal');
  });
  
  // Timer controls
  document.getElementById('timer-pause').addEventListener('click', pauseTimer);
  document.getElementById('timer-skip').addEventListener('click', () => {
    if (confirm('Skip this task? Your combo will reset!')) {
      skipTask(state.timer.taskId);
      stopTimer();
    }
  });
  document.getElementById('timer-complete').addEventListener('click', () => {
    timerComplete();
  });
  document.getElementById('timer-close').addEventListener('click', stopTimer);
  
  // Category filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.dataset.category;
      renderTasks();
    });
  });
  
  // Duo owl
  document.getElementById('duo-owl').addEventListener('click', () => {
    const messages = [
      'You\'re doing great! Keep it up! 💪',
      'Combo streak looking good! 🔥',
      'Let\'s crush these tasks! 🎯',
      'Focus mode: ACTIVATED ⚡',
      'You got this, champion! 🏆'
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    alert(msg);
    AudioSystem.playCombo();
    animateDuo('celebrate');
  });
  
  // Volume control
  const volumeSlider = document.getElementById('volume-slider');
  volumeSlider.addEventListener('input', (e) => {
    state.volume = e.target.value / 100;
    document.getElementById('volume-percent').textContent = e.target.value + '%';
  });
  
  // Backup & Restore
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importData(file);
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  
  // Update nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  
  // Update views
  document.querySelectorAll('.view-container').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });
  
  // Render charts if stats view
  if (viewName === 'stats') {
    setTimeout(renderCharts, 100);
  }
}

// ============================================
// Initialization
// ============================================

function initialize() {
  // Initialize audio
  AudioSystem.init();
  
  // Generate daily missions
  generateDailyMissions();
  
  // Add sample tasks for demo
  if (state.tasks.length === 0) {
    addTask('Finish math problem set', 'Complete exercises 1-10', 45, 'Study');
    addTask('Go for a run', '30 minutes cardio', 30, 'Health');
    addTask('Review HKUST notes', 'Review lecture slides from week 3', 60, 'Study');
  }
  
  // Render everything
  renderTasks();
  renderMissions();
  renderAchievements();
  updateStatsDisplay();
  
  // Initialize event listeners
  initializeEventListeners();
  
  console.log('🎯 ADHD Hustle Pro initialized!');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}