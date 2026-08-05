// ============================================
// V1 — JAM & GREETING
// ============================================
const greeting = document.getElementById("greeting");
const clock = document.getElementById("clock");

function updateClock() {
    const now = new Date();
    clock.innerHTML = now.toLocaleString();

    const h = now.getHours();
    if (h < 12) {
        greeting.innerHTML = "Selamat Pagi ☀️";
    } else if (h < 15) {
        greeting.innerHTML = "Selamat Siang 🌤️";
    } else if (h < 18) {
        greeting.innerHTML = "Selamat Sore 🌅";
    } else {
        greeting.innerHTML = "Selamat Malam 🌙";
    }
}

setInterval(updateClock, 1000);
updateClock();

// ============================================
// V1 — TO-DO LIST (dengan localStorage)
// ============================================
function addTask() {
    const input = document.getElementById("taskInput");
    const list = document.getElementById("taskList");
    if (input.value.trim() === "") return;

    const li = document.createElement("li");
    li.textContent = "✅ " + input.value.trim();

    // Tombol hapus
    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.style.marginLeft = "12px";
    delBtn.style.background = "transparent";
    delBtn.style.border = "none";
    delBtn.style.color = "#e06a7a";
    delBtn.style.cursor = "pointer";
    delBtn.onclick = function () {
        li.remove();
        saveTasks();
    };

    li.appendChild(delBtn);
    list.appendChild(li);
    input.value = "";
    saveTasks();
}

// Simpan & muat tugas dari localStorage
function saveTasks() {
    const tasks = [];
    document.querySelectorAll("#taskList li").forEach(li => {
        tasks.push(li.textContent.replace("✕", "").trim());
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    const stored = localStorage.getItem("tasks");
    if (!stored) return;
    const tasks = JSON.parse(stored);
    const list = document.getElementById("taskList");
    tasks.forEach(task => {
        const li = document.createElement("li");
        li.textContent = task;
        const delBtn = document.createElement("button");
        delBtn.textContent = "✕";
        delBtn.style.marginLeft = "12px";
        delBtn.style.background = "transparent";
        delBtn.style.border = "none";
        delBtn.style.color = "#e06a7a";
        delBtn.style.cursor = "pointer";
        delBtn.onclick = function () {
            li.remove();
            saveTasks();
        };
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}
loadTasks();

// ============================================
// V1 — CATATAN (localStorage)
// ============================================
const note = document.getElementById("note");
note.value = localStorage.getItem("note") || "";
note.addEventListener("input", () => {
    localStorage.setItem("note", note.value);
});

// ============================================
// V2 — SIDEBAR TOGGLE
// ============================================
const sidebar = document.getElementById("sidebar");
const openBtn = document.getElementById("openSidebar");
const closeBtn = document.getElementById("closeSidebar");

if (openBtn) {
    openBtn.addEventListener("click", () => {
        sidebar.classList.remove("closed");
    });
}
if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        sidebar.classList.add("closed");
    });
}

// ============================================
// V2 — DARK / LIGHT MODE
// ============================================
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const mode = document.body.classList.contains("light-mode") ? "☀️" : "🌙";
    themeToggle.textContent = mode;
    localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
});

// Muat tema dari localStorage
if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀️";
}

// ============================================
// V2 — KALENDER
// ============================================
function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = document.getElementById("calendarGrid");
    if (!grid) return;
    let html = "";
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    html += dayNames.map(d => `<div class="day-label">${d}</div>`).join("");

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="day empty"></div>`;
    }
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = (i === now.getDate()) ? 'today' : '';
        html += `<div class="day ${isToday}">${i}</div>`;
    }
    grid.innerHTML = html;
}
renderCalendar();

// ============================================
// V2 — PROGRESS BAR (update dari to-do)
// ============================================
function updateProgress() {
    const tasks = document.querySelectorAll("#taskList li");
    const total = tasks.length;
    const done = [...tasks].filter(li => li.textContent.includes("✅")).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    const fill = document.getElementById("progressFill");
    const text = document.getElementById("progressText");
    if (fill) fill.style.width = percent + "%";
    if (fill) fill.textContent = percent + "%";
    if (text) text.textContent = `Target hari ini: ${percent}% selesai (${done}/${total})`;
}

// Jalankan tiap kali ada perubahan di to-do
const taskObserver = new MutationObserver(updateProgress);
const taskList = document.getElementById("taskList");
if (taskList) {
    taskObserver.observe(taskList, { childList: true, subtree: true });
}
updateProgress();

// ============================================
// V2 — CUACA (simulasi)
// ============================================
const weatherText = document.getElementById("weatherText");
if (weatherText) {
    weatherText.textContent = "🌤️ Cerah, 28°C • Jakarta";
}

// ============================================
// V2 — QUOTE HARIAN
// ============================================
const quotes = [
    '"Kesuksesan dimulai dari keberanian untuk mencoba."',
    '"Jangan bandingkan dirimu dengan orang lain, bandingkan dengan dirimu kemarin."',
    '"Kegagalan adalah batu loncatan menuju kesuksesan."',
    '"Lakukan yang terbaik, biarkan Tuhan yang mengatur sisanya."',
    '"Orang yang berhenti belajar akan tertinggal oleh zaman."'
];
const quoteEl = document.getElementById("quoteText");
if (quoteEl) {
    quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

// ============================================
// V2 — NOTIFIKASI AWAL (sekali)
// ============================================
if (!localStorage.getItem("notifShown")) {
    setTimeout(() => {
        alert("🔔 Selamat datang di Dashboard V2!");
        localStorage.setItem("notifShown", "true");
    }, 800);
}

console.log("✅ Dashboard V2 siap! — Dildawg");