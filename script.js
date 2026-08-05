// ============================================
// 1. JAM, TANGGAL & GREETING
// ============================================
const greetingEl = document.getElementById("greeting");
const clockEl = document.getElementById("clock");
const dateEl = document.getElementById("date");

function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    dateEl.textContent = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const h = now.getHours();
    if (h < 12) greetingEl.textContent = "🌅 Selamat Pagi";
    else if (h < 15) greetingEl.textContent = "☀️ Selamat Siang";
    else if (h < 18) greetingEl.textContent = "🌇 Selamat Sore";
    else greetingEl.textContent = "🌙 Selamat Malam";
}
setInterval(updateClock, 1000);
updateClock();

// ============================================
// 2. TO-DO LIST (dengan localStorage)
// ============================================
function addTask() {
    const input = document.getElementById("taskInput");
    const list = document.getElementById("taskList");
    if (input.value.trim() === "") return;

    const li = document.createElement("li");
    li.textContent = input.value.trim();

    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.style.background = "transparent";
    delBtn.style.border = "none";
    delBtn.style.color = "#f87171";
    delBtn.style.cursor = "pointer";
    delBtn.onclick = () => { li.remove(); saveTasks(); updateStats(); updateProgress(); };
    li.appendChild(delBtn);
    list.appendChild(li);
    input.value = "";
    saveTasks();
    updateStats();
    updateProgress();
}

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
        delBtn.style.background = "transparent";
        delBtn.style.border = "none";
        delBtn.style.color = "#f87171";
        delBtn.style.cursor = "pointer";
        delBtn.onclick = () => { li.remove(); saveTasks(); updateStats(); updateProgress(); };
        li.appendChild(delBtn);
        list.appendChild(li);
    });
    updateStats();
    updateProgress();
}

// ============================================
// 3. STATISTIK (Total, Selesai, Pending)
// ============================================
function updateStats() {
    const tasks = document.querySelectorAll("#taskList li");
    const total = tasks.length;
    let done = 0;
    tasks.forEach(li => {
        if (li.textContent.includes("✅")) done++;
    });
    const pending = total - done;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("doneTasks").textContent = done;
    document.getElementById("pendingTasks").textContent = pending;

    // Simpan juga jumlah catatan (opsional)
    const note = document.getElementById("note");
    const noteLength = note.value.split("\n").filter(line => line.trim() !== "").length;
    document.getElementById("noteCount").textContent = noteLength;
}

// ============================================
// 4. PROGRESS BAR (otomatis dari to-do)
// ============================================
function updateProgress() {
    const tasks = document.querySelectorAll("#taskList li");
    const total = tasks.length;
    let done = 0;
    tasks.forEach(li => {
        if (li.textContent.includes("✅")) done++;
    });
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    const fill = document.getElementById("progressFill");
    const text = document.getElementById("progressText");
    if (fill) {
        fill.style.width = percent + "%";
        fill.textContent = percent + "%";
    }
    if (text) text.textContent = `${percent}% selesai (${done}/${total} tugas)`;
}

// ============================================
// 5. CATATAN (auto save)
// ============================================
const note = document.getElementById("note");
note.value = localStorage.getItem("note") || "";
note.addEventListener("input", () => {
    localStorage.setItem("note", note.value);
    updateStats();
});

// ============================================
// 6. SIDEBAR TOGGLE (buka/tutup)
// ============================================
const sidebar = document.getElementById("sidebar");
document.getElementById("openSidebar").addEventListener("click", () => {
    sidebar.classList.toggle("closed");
    sidebar.classList.toggle("open");
});
document.getElementById("closeSidebar").addEventListener("click", () => {
    sidebar.classList.add("closed");
    sidebar.classList.remove("open");
});

// ============================================
// 7. DARK / LIGHT MODE
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
// 8. KALENDER
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

    for (let i = 0; i < firstDay; i++) html += `<div class="day empty"></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = (i === now.getDate()) ? 'today' : '';
        html += `<div class="day ${isToday}">${i}</div>`;
    }
    grid.innerHTML = html;
}
renderCalendar();

// ============================================
// 9. CUACA (simulasi, bisa diganti API)
// ============================================
document.getElementById("weatherText").textContent = "🌤️ Cerah, 28°C • Jakarta";

// ============================================
// 10. QUOTE HARIAN (random)
// ============================================
const quotes = [
    '"Kesuksesan dimulai dari keberanian untuk mencoba."',
    '"Jangan bandingkan dirimu dengan orang lain, bandingkan dengan dirimu kemarin."',
    '"Kegagalan adalah batu loncatan menuju kesuksesan."',
    '"Lakukan yang terbaik, biarkan Tuhan yang mengatur sisanya."',
    '"Orang yang berhenti belajar akan tertinggal oleh zaman."',
    '"Hidup itu seperti sepeda, biar seimbang kamu harus terus bergerak."'
];
document.getElementById("quoteText").textContent = quotes[Math.floor(Math.random() * quotes.length)];

// ============================================
// 11. SEARCH BAR (filter konten)
// ============================================
document.getElementById("searchBar").addEventListener("input", function() {
    const keyword = this.value.toLowerCase();
    document.querySelectorAll(".card").forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(keyword) ? "block" : "none";
    });
});

// ============================================
// 12. NOTIFIKASI AWAL (sekali)
// ============================================
if (!localStorage.getItem("notifShown")) {
    setTimeout(() => {
        alert("🔔 Selamat datang di Dashboard Super Lengkap!");
        localStorage.setItem("notifShown", "true");
    }, 800);
}

// ============================================
// 13. MUTASI OBSERVER (update otomatis)
// ============================================
const taskList = document.getElementById("taskList");
if (taskList) {
    const observer = new MutationObserver(() => {
        saveTasks();
        updateStats();
        updateProgress();
    });
    observer.observe(taskList, { childList: true, subtree: true });
}

// ============================================
// 14. LOAD AWAL
// ============================================
loadTasks();
updateStats();
updateProgress();
console.log("✅ Dashboard Super Lengkap siap! — Dildawg");