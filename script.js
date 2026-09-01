/**
 * Student Study Planner & Productivity Dashboard
 * All JavaScript functionality with Local Storage persistence
 */

// ===== DOM REFS =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Sections
const sections = $$('.section');
const navItems = $$('.sidebar-nav li');
const taskList = $('#taskList');
const taskForm = $('#taskForm');
const taskId = $('#taskId');
const taskTitle = $('#taskTitle');
const taskPriority = $('#taskPriority');
const taskDate = $('#taskDate');
const taskDesc = $('#taskDesc');
const taskSubmitBtn = $('#taskSubmitBtn');
const taskCancelBtn = $('#taskCancelBtn');
const taskFormTitle = $('#taskFormTitle');

// Stats
const totalTasksEl = $('#totalTasks');
const completedTasksEl = $('#completedTasks');
const pendingTasksEl = $('#pendingTasks');
const highPriorityTasksEl = $('#highPriorityTasks');

// Progress rings
const progressCircle = $('#progressCircle');
const progressBigCircle = $('#progressBigCircle');
const progressPercent = $('#progressPercent');
const progressBigPercent = $('#progressBigPercent');
const progressDetail = $('#progressDetail');
const pCompleted = $('#pCompleted');
const pPending = $('#pPending');
const pTotal = $('#pTotal');

// Priority bars
const highFill = $('#highFill');
const mediumFill = $('#mediumFill');
const lowFill = $('#lowFill');
const highCount = $('#highCount');
const mediumCount = $('#mediumCount');
const lowCount = $('#lowCount');

// Goal
const goalForm = $('#goalForm');
const goalHours = $('#goalHours');
const goalMinutes = $('#goalMinutes');
const goalDisplay = $('#goalDisplay');
const goalProgressDisplay = $('#goalProgressDisplay');
const goalCircle = $('#goalCircle');
const goalPercent = $('#goalPercent');
const goalDetail = $('#goalDetail');

// Quotes
const quoteText = $('#quoteText');
const quoteAuthor = $('#quoteAuthor');
const miniQuote = $('#miniQuote');

// Theme
const themeToggle = $('#themeToggle');

// ===== STATE =====
let tasks = [];
let currentFilter = 'all';
let editingId = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    renderTasks();
    updateStats();
    updateProgress();
    updateGoalUI();
    setDefaultDate();
    startClock();
    showRandomQuote();
    showRandomTip();
    setupEventListeners();
    applyTheme();
});

// ===== LOCAL STORAGE =====
function saveToStorage() {
    localStorage.setItem('studyTasks', JSON.stringify(tasks));
    localStorage.setItem('studyGoal', JSON.stringify(getGoalData()));
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function loadFromStorage() {
    // Tasks
    const stored = localStorage.getItem('studyTasks');
    if (stored) tasks = JSON.parse(stored);
    else tasks = [];

    // Goal
    const goal = localStorage.getItem('studyGoal');
    if (goal) {
        const g = JSON.parse(goal);
        goalHours.value = g.targetHours || '';
        goalMinutes.value = g.minutesToday || 0;
    } else {
        goalHours.value = '';
        goalMinutes.value = 0;
    }

    // Theme
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
}

function getGoalData() {
    return {
        targetHours: parseFloat(goalHours.value) || 0,
        minutesToday: parseInt(goalMinutes.value) || 0
    };
}

// ===== TASKS CRUD =====
function addTask(task) {
    task.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    task.completed = false;
    tasks.push(task);
    saveToStorage();
    renderTasks();
    updateStats();
    updateProgress();
}

function updateTask(id, updated) {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updated };
        saveToStorage();
        renderTasks();
        updateStats();
        updateProgress();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveToStorage();
    renderTasks();
    updateStats();
    updateProgress();
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveToStorage();
        renderTasks();
        updateStats();
        updateProgress();
    }
}

function getFilteredTasks() {
    if (currentFilter === 'all') return tasks;
    if (currentFilter === 'completed') return tasks.filter(t => t.completed);
    return tasks.filter(t => t.priority === currentFilter && !t.completed);
}

// ===== RENDER TASKS =====
function renderTasks() {
    const filtered = getFilteredTasks();
    if (filtered.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No tasks match the current filter.</p>
            </div>
        `;
        return;
    }
    let html = '';
    filtered.forEach(task => {
        const due = task.dueDate ? `<span><i class="far fa-calendar-alt"></i> ${task.dueDate}</span>` : '';
        const desc = task.description ? `<span>${task.description}</span>` : '';
        const priorityClass = `priority-${task.priority}`;
        const completedClass = task.completed ? 'completed' : '';
        html += `
            <div class="task-item ${priorityClass} ${completedClass}" data-id="${task.id}">
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span>${task.priority}</span>
                        ${due}
                        ${desc}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="toggle-btn" title="Toggle complete"><i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i></button>
                    <button class="edit-btn" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    taskList.innerHTML = html;

    // Attach event listeners
    taskList.querySelectorAll('.task-item').forEach(item => {
        const id = item.dataset.id;
        item.querySelector('.toggle-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleComplete(id);
        });
        item.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            editTask(id);
        });
        item.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this task?')) deleteTask(id);
        });
    });
}

// ===== EDIT TASK =====
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingId = id;
    taskId.value = id;
    taskTitle.value = task.title;
    taskPriority.value = task.priority;
    taskDate.value = task.dueDate || '';
    taskDesc.value = task.description || '';
    taskFormTitle.textContent = 'Edit Task';
    taskSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Update Task';
    taskCancelBtn.style.display = 'inline-flex';
    // Scroll to form
    document.querySelector('.task-form-card').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editingId = null;
    taskId.value = '';
    taskForm.reset();
    taskFormTitle.textContent = 'Add New Task';
    taskSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Save Task';
    taskCancelBtn.style.display = 'none';
    setDefaultDate();
}

// ===== TASK FORM SUBMIT =====
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitle.value.trim();
    if (!title) return;
    const priority = taskPriority.value;
    const dueDate = taskDate.value || '';
    const description = taskDesc.value.trim();

    const taskData = { title, priority, dueDate, description };

    if (editingId) {
        updateTask(editingId, taskData);
        cancelEdit();
    } else {
        addTask(taskData);
        taskForm.reset();
        setDefaultDate();
    }
});

taskCancelBtn.addEventListener('click', cancelEdit);

// ===== FILTERS =====
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// ===== STATS & PROGRESS =====
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const high = tasks.filter(t => t.priority === 'High' && !t.completed).length;

    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
    highPriorityTasksEl.textContent = high;

    // Progress page stats
    pCompleted.textContent = completed;
    pPending.textContent = pending;
    pTotal.textContent = total;
}

function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const circumference = 339.292; // 2*pi*54
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
    progressBigCircle.style.strokeDashoffset = offset;
    progressPercent.textContent = percent + '%';
    progressBigPercent.textContent = percent + '%';
    progressDetail.textContent = `${completed} of ${total} tasks done`;

    // Priority breakdown
    const high = tasks.filter(t => t.priority === 'High' && !t.completed).length;
    const medium = tasks.filter(t => t.priority === 'Medium' && !t.completed).length;
    const low = tasks.filter(t => t.priority === 'Low' && !t.completed).length;
    const pending = total - completed;
    const highPct = pending === 0 ? 0 : Math.round((high / pending) * 100);
    const mediumPct = pending === 0 ? 0 : Math.round((medium / pending) * 100);
    const lowPct = pending === 0 ? 0 : Math.round((low / pending) * 100);
    highFill.style.width = highPct + '%';
    mediumFill.style.width = mediumPct + '%';
    lowFill.style.width = lowPct + '%';
    highCount.textContent = high;
    mediumCount.textContent = medium;
    lowCount.textContent = low;
}

// ===== GOAL =====
goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveToStorage();
    updateGoalUI();
});

function updateGoalUI() {
    const data = getGoalData();
    const targetMinutes = data.targetHours * 60;
    const studied = data.minutesToday || 0;
    const percent = targetMinutes === 0 ? 0 : Math.min(100, Math.round((studied / targetMinutes) * 100));

    // Display
    goalDisplay.textContent = data.targetHours ? `${data.targetHours} h` : 'Not set';
    goalProgressDisplay.textContent = `${studied} min`;

    // Ring
    const circumference = 376.991; // 2*pi*60
    const offset = circumference - (percent / 100) * circumference;
    goalCircle.style.strokeDashoffset = offset;
    goalPercent.textContent = percent + '%';
    goalDetail.textContent = `${studied} min / ${targetMinutes} min`;
}

// ===== QUOTES =====
const quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Education is the most powerful weapon you can use to change the world.", author: "Nelson Mandela" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" }
];

function showRandomQuote() {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.textContent = `“${q.text}”`;
    quoteAuthor.textContent = `— ${q.author}`;
    miniQuote.textContent = q.text.length > 60 ? q.text.slice(0, 60) + '…' : q.text;
}

// ===== STUDY TIPS =====
const tips = [
    "Break your study sessions into 25-minute focused blocks with 5-minute breaks. (Pomodoro technique)",
    "Use active recall: test yourself on the material rather than just re-reading.",
    "Teach what you've learned to someone else – it reinforces your own understanding.",
    "Plan your hardest subject for when you're most alert (usually morning).",
    "Remove distractions: put your phone in another room while studying.",
    "Use spaced repetition to review material over increasing intervals.",
    "Stay hydrated and take short walks to refresh your mind.",
    "Set specific goals for each study session, not just 'study math'."
];

function showRandomTip() {
    const tip = tips[Math.floor(Math.random() * tips.length)];
    document.getElementById('studyTip').textContent = tip;
}

// ===== CLOCK =====
function startClock() {
    function update() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('dateDisplay').textContent = dateStr;
        document.getElementById('timeDisplay').textContent = timeStr;
    }
    update();
    setInterval(update, 1000);
}

function setDefaultDate() {
    if (!taskDate.value) {
        const today = new Date().toISOString().split('T')[0];
        taskDate.value = today;
    }
}

// ===== THEME =====
function applyTheme() {
    const isDark = document.body.classList.contains('dark');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> <span>Light Mode</span>' : '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    saveToStorage();
    applyTheme();
});

// ===== NAVIGATION =====
function navigateTo(sectionId) {
    // Update sections
    sections.forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    // Update nav
    navItems.forEach(li => li.classList.remove('active'));
    const navLink = document.querySelector(`.sidebar-nav li[data-section="${sectionId}"]`);
    if (navLink) navLink.classList.add('active');

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const section = item.dataset.section;
        if (section) navigateTo(section);
    });
});

// ===== SIDEBAR TOGGLE =====
document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('menuToggle');
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// ===== QUOTE BUTTONS =====
document.getElementById('refreshQuoteBtn').addEventListener('click', showRandomQuote);
document.getElementById('newQuoteBtn').addEventListener('click', showRandomQuote);
document.getElementById('newTipBtn').addEventListener('click', showRandomTip);

// ===== EXTRA: load mini quote on dashboard =====
// Also update quote on dashboard load
document.querySelector('[data-section="dashboard"]').addEventListener('click', () => {
    // mini quote already shown
});

// ===== INITIAL LOAD =====
// Ensure default filter active
document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');