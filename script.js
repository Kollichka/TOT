let currentPage = "materials";
let materials = [];
let team = [];
let projects = [];
let contacts = { email: "", social: "", other: "" };
let isAdmin = false;
let currentProfileId = null;
let isUploading = false;

const FREEIMAGE_API_KEY = "6d207e02198a847aa98d0a2a901485a5";

const navLinks = document.querySelectorAll("[data-page]");
const pages = {
    materials: document.getElementById("materials-page"),
    team: document.getElementById("team-page"),
    projects: document.getElementById("projects-page"),
    contacts: document.getElementById("contacts-page"),
    "member-profile": document.getElementById("member-profile-page"),
};
const adminControls = {
    materials: document.getElementById("materialsAdmin"),
    team: document.getElementById("teamAdmin"),
    projects: document.getElementById("projectsAdmin"),
    contacts: document.getElementById("contactsAdmin"),
};
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginModal = document.getElementById("loginModal");
const closeModal = document.querySelector(".close");
const loginForm = document.getElementById("loginForm");

async function loadAllData() {
    try {
        const db = window.db;
        const ref = window.ref;
        const get = window.get;

        const materialsSnap = await get(ref(db, "materials"));
        if (materialsSnap.exists()) materials = materialsSnap.val();
        else {
            materials = [
                { id: "1", title: 'Дубляж трейлера "Проект Z"', type: "Видео", description: "Готовая озвучка трейлера с участием трёх актёров. Дорожка 5.1.", link: "#" },
                { id: "2", title: "Фоновая музыка для сцены", type: "Аудио", description: "Трек в стиле эмбиент, длительность 3:45.", link: "#" },
                { id: "3", title: "Сценарий эпизода 4", type: "Текст", description: "Финальная версия сценария с разметкой по ролям.", link: "#" },
                { id: "4", title: "Запись репетиции", type: "Видео", description: "Черновая запись от 12.03.2025.", link: "#" },
            ];
            await window.set(ref(db, "materials"), materials);
        }

        const teamSnap = await get(ref(db, "team"));
        if (teamSnap.exists()) team = teamSnap.val();
        else {
            team = [
                { id: "1", name: "Анна Смирнова", role: "Режиссёр дубляжа", photo: "", bio: "Опыт работы более 10 лет.", social: "https://vk.com/anna\nhttps://t.me/anna" },
                { id: "2", name: "Пётр Иванов", role: "Актёр озвучки", photo: "", bio: "Голос главного героя в 30+ проектах.", social: "https://vk.com/petr" },
                { id: "3", name: "Елена Петрова", role: "Звукорежиссёр", photo: "", bio: "Специалист по обработке аудио.", social: "" },
            ];
            await window.set(ref(db, "team"), team);
        }

        const projectsSnap = await get(ref(db, "projects"));
        if (projectsSnap.exists()) projects = projectsSnap.val();
        else {
            projects = [
                { id: "1", title: "Киберпанк 2077", description: "Полный дубляж игры", date: "2024" },
                { id: "2", title: "Аркейн", description: "Озвучка второго сезона", date: "2025" },
                { id: "3", title: "Хоббит", description: "Новая версия", date: "2023" },
            ];
            await window.set(ref(db, "projects"), projects);
        }

        const contactsSnap = await get(ref(db, "contacts"));
        if (contactsSnap.exists()) contacts = contactsSnap.val();
        else {
            contacts = {
                email: "tot.dub@example.com",
                social: "https://vk.com/tot, https://t.me/tot_dub",
                other: "По всем вопросам пишите на почту или в Telegram.",
            };
            await window.set(ref(db, "contacts"), contacts);
        }
    } catch (e) {
        console.error(e);
        alert("Не удалось загрузить данные.");
    }
}
async function saveMaterials() { await window.set(window.ref(window.db, "materials"), materials); }
async function saveTeam() { await window.set(window.ref(window.db, "team"), team); }
async function saveProjects() { await window.set(window.ref(window.db, "projects"), projects); }
async function saveContacts() { await window.set(window.ref(window.db, "contacts"), contacts); }

async function uploadToFreeImage(file) {
    if (!file) return null;
    if (!file.type.startsWith("image/")) { 
        alert("Пожалуйста, выберите изображение"); 
        return null; 
    }
    if (file.size > 64 * 1024 * 1024) { 
        alert("Максимальный размер файла — 64 МБ"); 
        return null; 
    }

    const progressSpan = document.getElementById("uploadProgress");
    if (progressSpan) progressSpan.textContent = "Загрузка...";

    try {
        const formData = new FormData();
        formData.append("key", FREEIMAGE_API_KEY);
        formData.append("action", "upload");
        formData.append("source", file);
        formData.append("type", "file");
        formData.append("format", "json");

        const response = await fetch("https://freeimage.host/api/1/upload", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status_code === 200 && result.image) {
            if (progressSpan) progressSpan.textContent = "Готово!";
            setTimeout(() => { if (progressSpan) progressSpan.textContent = ""; }, 2000);
            return result.image.url;
        } else {
            throw new Error(result.error?.message || "Неизвестная ошибка API");
        }
    } catch (error) {
        console.error("Ошибка загрузки:", error);
        if (progressSpan) progressSpan.textContent = "Ошибка!";
        alert("Не удалось загрузить изображение. Проверьте интернет-соединение или попробуйте другой формат файла.");
        setTimeout(() => { if (progressSpan) progressSpan.textContent = ""; }, 3000);
        return null;
    }
}

window.onAuthStateChanged(window.auth, (user) => {
    isAdmin = !!user;
    updateAuthUI();
    renderCurrentPage();
});
async function login(email, password) {
    try { await window.signInWithEmailAndPassword(window.auth, email, password); }
    catch (e) { alert("Ошибка входа: " + e.message); }
}
async function logout() { await window.signOut(window.auth); }
function updateAuthUI() {
    if (isAdmin) {
        loginBtn.style.display = "none";
        logoutBtn.style.display = "block";
        if (adminControls[currentPage]) adminControls[currentPage].style.display = "block";
    } else {
        loginBtn.style.display = "block";
        logoutBtn.style.display = "none";
        Object.values(adminControls).forEach(el => { if (el) el.style.display = "none"; });
    }
}
function showModal() { loginModal.classList.add("show"); }
function hideModal() { loginModal.classList.remove("show"); }
function hideAllForms() {
    document.getElementById("materialFormContainer").style.display = "none";
    document.getElementById("memberFormContainer").style.display = "none";
    document.getElementById("projectFormContainer").style.display = "none";
    document.getElementById("contactsFormContainer").style.display = "none";
    const prog = document.getElementById("uploadProgress");
    if (prog) prog.textContent = "";
}
function switchPage(pageId) {
    Object.values(pages).forEach(p => p.classList.remove("active-page"));
    if (pages[pageId]) pages[pageId].classList.add("active-page");
    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.dataset.page === pageId) link.classList.add("active");
    });
    currentPage = pageId;
    hideAllForms();
    updateAuthUI();
    if (pageId !== "member-profile") currentProfileId = null;
    renderCurrentPage();
}
function renderCurrentPage() {
    if (currentPage === "materials") renderMaterials();
    else if (currentPage === "team") renderTeam();
    else if (currentPage === "projects") renderProjects();
    else if (currentPage === "contacts") renderContacts();
    else if (currentPage === "member-profile" && currentProfileId) renderMemberProfile(currentProfileId);
}
function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"]/g, m => {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        if (m === '"') return "&quot;";
        return m;
    });
}

function renderMaterials() {
    const grid = document.getElementById("materialsGrid");
    if (!materials.length) { grid.innerHTML = '<div class="empty-message">Пока нет материалов</div>'; return; }
    let html = "";
    materials.forEach(item => {
        html += `<div class="material-card" data-id="${item.id}">
            <div class="material-type">${escapeHtml(item.type)}</div>
            <h3 class="material-title">${escapeHtml(item.title)}</h3>
            <p class="material-description">${escapeHtml(item.description)}</p>
            <a href="${escapeHtml(item.link)}" class="material-link" target="_blank">Перейти</a>
            ${isAdmin ? `<div class="card-actions"><button class="edit-material" data-id="${item.id}">✎</button><button class="delete-material" data-id="${item.id}">🗑</button></div>` : ""}
        </div>`;
    });
    grid.innerHTML = html;
    if (isAdmin) {
        document.querySelectorAll(".edit-material").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); editMaterial(btn.dataset.id); }));
        document.querySelectorAll(".delete-material").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); deleteMaterial(btn.dataset.id); }));
    }
}
function editMaterial(id) {
    const m = materials.find(m => m.id === id);
    if (!m) return;
    document.getElementById("materialId").value = m.id;
    document.getElementById("materialTitle").value = m.title;
    document.getElementById("materialType").value = m.type;
    document.getElementById("materialDesc").value = m.description;
    document.getElementById("materialLink").value = m.link;
    document.getElementById("materialFormTitle").textContent = "Редактировать материал";
    document.getElementById("materialFormContainer").style.display = "block";
}
async function deleteMaterial(id) {
    if (confirm("Удалить материал?")) {
        materials = materials.filter(m => m.id !== id);
        await saveMaterials();
        renderMaterials();
    }
}
document.getElementById("addMaterialBtn")?.addEventListener("click", () => {
    document.getElementById("materialId").value = "";
    document.getElementById("materialForm").reset();
    document.getElementById("materialFormTitle").textContent = "Новый материал";
    document.getElementById("materialFormContainer").style.display = "block";
});
document.getElementById("cancelMaterial")?.addEventListener("click", () => {
    document.getElementById("materialFormContainer").style.display = "none";
});
document.getElementById("materialForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("materialId").value;
    const title = document.getElementById("materialTitle").value.trim();
    const type = document.getElementById("materialType").value;
    const desc = document.getElementById("materialDesc").value.trim();
    const link = document.getElementById("materialLink").value.trim();
    if (!title || !desc || !link) return alert("Заполните поля");
    if (id) {
        const idx = materials.findIndex(m => m.id === id);
        if (idx !== -1) materials[idx] = { ...materials[idx], title, type, description: desc, link };
    } else {
        materials.push({ id: Date.now().toString(), title, type, description: desc, link });
    }
    await saveMaterials();
    renderMaterials();
    document.getElementById("materialFormContainer").style.display = "none";
});

function renderTeam() {
    const grid = document.getElementById("teamGrid");
    if (!team.length) { grid.innerHTML = '<div class="empty-message">Команда пока не добавлена</div>'; return; }
    let html = "";
    team.forEach(m => {
        html += `<div class="team-card" data-id="${m.id}">
            ${m.photo ? `<img src="${escapeHtml(m.photo)}" class="team-photo">` : '<div class="team-photo">Нет фото</div>'}
            <div class="team-role">${escapeHtml(m.role)}</div>
            <h3 class="team-name">${escapeHtml(m.name)}</h3>
            ${isAdmin ? `<div class="card-actions"><button class="edit-member" data-id="${m.id}">✎</button><button class="delete-member" data-id="${m.id}">🗑</button></div>` : ""}
        </div>`;
    });
    grid.innerHTML = html;
    document.querySelectorAll(".team-card").forEach(card => {
        const mid = card.dataset.id;
        card.addEventListener("click", (e) => {
            if (!e.target.closest(".edit-member") && !e.target.closest(".delete-member")) showMemberProfile(mid);
        });
    });
    if (isAdmin) {
        document.querySelectorAll(".edit-member").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); editMember(btn.dataset.id); }));
        document.querySelectorAll(".delete-member").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); deleteMember(btn.dataset.id); }));
    }
}

let pendingPhotoFile = null;

function editMember(id) {
    const member = team.find(m => m.id === id);
    if (!member) return;
    document.getElementById("memberId").value = member.id;
    document.getElementById("memberName").value = member.name;
    document.getElementById("memberRole").value = member.role;
    document.getElementById("memberPhoto").value = member.photo || "";
    document.getElementById("memberBio").value = member.bio || "";
    document.getElementById("memberSocial").value = member.social || "";
    document.getElementById("memberFormTitle").textContent = "Редактировать участника";
    document.getElementById("memberFormContainer").style.display = "block";
    pendingPhotoFile = null;
    const fileInput = document.getElementById("memberPhotoFile");
    if (fileInput) {
        fileInput.value = "";
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file && window.auth.currentUser) {
                pendingPhotoFile = file;
                document.getElementById("uploadProgress").textContent = "Файл выбран";
                setTimeout(() => document.getElementById("uploadProgress").textContent = "", 2000);
            } else if (file) alert("Войдите как администратор");
        };
    }
}

async function deleteMember(id) {
    if (confirm("Удалить участника?")) {
        team = team.filter(m => m.id !== id);
        await saveTeam();
        if (currentPage === "member-profile" && currentProfileId === id) switchPage("team");
        else renderTeam();
    }
}

document.getElementById("addMemberBtn")?.addEventListener("click", () => {
    document.getElementById("memberId").value = "";
    document.getElementById("memberForm").reset();
    document.getElementById("memberFormTitle").textContent = "Новый участник";
    document.getElementById("memberFormContainer").style.display = "block";
    pendingPhotoFile = null;
    const fileInput = document.getElementById("memberPhotoFile");
    if (fileInput) {
        fileInput.value = "";
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file && window.auth.currentUser) {
                pendingPhotoFile = file;
                document.getElementById("uploadProgress").textContent = "Файл выбран";
                setTimeout(() => document.getElementById("uploadProgress").textContent = "", 2000);
            } else if (file) alert("Войдите как администратор");
        };
    }
});

document.getElementById("cancelMember")?.addEventListener("click", () => {
    document.getElementById("memberFormContainer").style.display = "none";
    pendingPhotoFile = null;
    const prog = document.getElementById("uploadProgress");
    if (prog) prog.textContent = "";
});

document.getElementById("memberForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isUploading) return;
    const id = document.getElementById("memberId").value;
    const name = document.getElementById("memberName").value.trim();
    const role = document.getElementById("memberRole").value.trim();
    let photo = document.getElementById("memberPhoto").value.trim();
    const bio = document.getElementById("memberBio").value.trim();
    const social = document.getElementById("memberSocial").value.trim();
    if (!name || !role) return alert("Заполните имя и роль");

    isUploading = true;
    const submitBtn = document.querySelector("#memberForm .submit-btn");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Сохранение...";
    submitBtn.disabled = true;

    try {
        if (pendingPhotoFile) {
            const newUrl = await uploadToFreeImage(pendingPhotoFile);
            if (newUrl) photo = newUrl;
            pendingPhotoFile = null;
        }
        if (id) {
            const idx = team.findIndex(m => m.id === id);
            if (idx !== -1) team[idx] = { ...team[idx], name, role, photo, bio, social };
            await saveTeam();
        } else {
            team.push({ id: Date.now().toString(), name, role, photo, bio, social });
            await saveTeam();
        }
        if (currentPage === "member-profile" && currentProfileId === id) renderMemberProfile(id);
        else renderTeam();
        document.getElementById("memberFormContainer").style.display = "none";
    } catch (err) {
        console.error(err);
        alert("Ошибка сохранения: " + err.message);
    } finally {
        isUploading = false;
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        const prog = document.getElementById("uploadProgress");
        if (prog) prog.textContent = "";
    }
});

function showMemberProfile(mid) {
    currentProfileId = mid;
    renderMemberProfile(mid);
    switchPage("member-profile");
}
function renderMemberProfile(mid) {
    const member = team.find(m => m.id === mid);
    if (!member) return;
    const container = document.getElementById("memberProfileContent");
    container.innerHTML = `<div class="profile-container">
        ${member.photo ? `<img src="${escapeHtml(member.photo)}" class="profile-photo">` : '<div class="profile-photo">Нет фото</div>'}
        <h2 class="profile-name">${escapeHtml(member.name)}</h2>
        <div class="profile-role">${escapeHtml(member.role)}</div>
        <div class="profile-bio"><strong>Биография:</strong><br>${escapeHtml(member.bio || "Не указана")}</div>
        <div class="profile-social"><strong>Социальные сети:</strong><br>${formatSocialLinks(member.social)}</div>
    </div>`;
}
function formatSocialLinks(s) {
    if (!s) return "—";
    const links = s.split("\n").filter(l => l.trim());
    if (!links.length) return "—";
    return links.map(l => `<a href="${escapeHtml(l.trim())}" target="_blank">${escapeHtml(l.trim())}</a>`).join("<br>");
}
document.getElementById("backToTeamBtn").addEventListener("click", () => switchPage("team"));

function renderProjects() {
    const grid = document.getElementById("projectsGrid");
    if (!projects.length) { grid.innerHTML = '<div class="empty-message">Проектов пока нет</div>'; return; }
    let html = "";
    projects.forEach(p => {
        html += `<div class="project-card" data-id="${p.id}">
            <h3 class="project-title">${escapeHtml(p.title)}</h3>
            <p class="project-description">${escapeHtml(p.description)}</p>
            <div class="project-date" style="color:#2ecc71;">${escapeHtml(p.date)}</div>
            ${isAdmin ? `<div class="card-actions"><button class="edit-project" data-id="${p.id}">✎</button><button class="delete-project" data-id="${p.id}">🗑</button></div>` : ""}
        </div>`;
    });
    grid.innerHTML = html;
    if (isAdmin) {
        document.querySelectorAll(".edit-project").forEach(btn => btn.addEventListener("click", () => editProject(btn.dataset.id)));
        document.querySelectorAll(".delete-project").forEach(btn => btn.addEventListener("click", () => deleteProject(btn.dataset.id)));
    }
}
function editProject(id) {
    const p = projects.find(p => p.id === id);
    if (!p) return;
    document.getElementById("projectId").value = p.id;
    document.getElementById("projectTitle").value = p.title;
    document.getElementById("projectDesc").value = p.description;
    document.getElementById("projectDate").value = p.date;
    document.getElementById("projectFormTitle").textContent = "Редактировать проект";
    document.getElementById("projectFormContainer").style.display = "block";
}
async function deleteProject(id) {
    if (confirm("Удалить проект?")) {
        projects = projects.filter(p => p.id !== id);
        await saveProjects();
        renderProjects();
    }
}
document.getElementById("addProjectBtn")?.addEventListener("click", () => {
    document.getElementById("projectId").value = "";
    document.getElementById("projectForm").reset();
    document.getElementById("projectFormTitle").textContent = "Новый проект";
    document.getElementById("projectFormContainer").style.display = "block";
});
document.getElementById("cancelProject")?.addEventListener("click", () => {
    document.getElementById("projectFormContainer").style.display = "none";
});
document.getElementById("projectForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("projectId").value;
    const title = document.getElementById("projectTitle").value.trim();
    const desc = document.getElementById("projectDesc").value.trim();
    const date = document.getElementById("projectDate").value.trim();
    if (!title || !desc || !date) return alert("Заполните поля");
    if (id) {
        const idx = projects.findIndex(p => p.id === id);
        if (idx !== -1) projects[idx] = { ...projects[idx], title, description: desc, date };
    } else {
        projects.push({ id: Date.now().toString(), title, description: desc, date });
    }
    await saveProjects();
    renderProjects();
    document.getElementById("projectFormContainer").style.display = "none";
});

function renderContacts() {
    const content = document.getElementById("contactsContent");
    const socialHtml = contacts.social ? contacts.social.split(",").map(l => `<a href="${escapeHtml(l.trim())}" target="_blank">${escapeHtml(l.trim())}</a>`).join(", ") : "—";
    content.innerHTML = `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(contacts.email)}">${escapeHtml(contacts.email)}</a></p>
                         <p><strong>Соцсети:</strong> ${socialHtml}</p>
                         <p><strong>Дополнительно:</strong> ${escapeHtml(contacts.other)}</p>`;
}
document.getElementById("editContactsBtn")?.addEventListener("click", () => {
    document.getElementById("contactEmail").value = contacts.email;
    document.getElementById("contactSocial").value = contacts.social;
    document.getElementById("contactOther").value = contacts.other;
    document.getElementById("contactsFormContainer").style.display = "block";
});
document.getElementById("cancelContacts")?.addEventListener("click", () => {
    document.getElementById("contactsFormContainer").style.display = "none";
});
document.getElementById("contactsForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    contacts.email = document.getElementById("contactEmail").value.trim();
    contacts.social = document.getElementById("contactSocial").value.trim();
    contacts.other = document.getElementById("contactOther").value.trim();
    await saveContacts();
    renderContacts();
    document.getElementById("contactsFormContainer").style.display = "none";
});

document.addEventListener("DOMContentLoaded", async () => {
    await loadAllData();
    navLinks.forEach(link => link.addEventListener("click", (e) => { e.preventDefault(); switchPage(link.dataset.page); }));
    loginBtn.addEventListener("click", showModal);
    logoutBtn.addEventListener("click", logout);
    closeModal.addEventListener("click", hideModal);
    window.addEventListener("click", (e) => { if (e.target === loginModal) hideModal(); });
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        login(document.getElementById("username").value, document.getElementById("password").value);
        hideModal();
    });
    switchPage("materials");
});
