// ==================== Глобальные переменные ====================
let currentPage = 'materials';
let materials = [];
let team = [];
let projects = [];
let contacts = { email: '', social: '', other: '' };
let isAdmin = false;
let currentProfileId = null;

// DOM элементы
const navLinks = document.querySelectorAll('[data-page]');
const pages = {
    materials: document.getElementById('materials-page'),
    team: document.getElementById('team-page'),
    projects: document.getElementById('projects-page'),
    contacts: document.getElementById('contacts-page'),
    'member-profile': document.getElementById('member-profile-page')
};
const adminControls = {
    materials: document.getElementById('materialsAdmin'),
    team: document.getElementById('teamAdmin'),
    projects: document.getElementById('projectsAdmin'),
    contacts: document.getElementById('contactsAdmin')
};

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');

// ==================== Работа с Firebase ====================
async function loadAllData() {
    try {
        const db = window.db;
        const ref = window.ref;
        const get = window.get;

        // Загружаем материалы
        const materialsSnap = await get(ref(db, 'materials'));
        if (materialsSnap.exists()) {
            materials = materialsSnap.val();
        } else {
            materials = [
                { id: '1', title: 'Дубляж трейлера "Проект Z"', type: 'Видео', description: 'Готовая озвучка трейлера с участием трёх актёров. Дорожка 5.1.', link: '#' },
                { id: '2', title: 'Фоновая музыка для сцены', type: 'Аудио', description: 'Трек в стиле эмбиент, длительность 3:45.', link: '#' },
                { id: '3', title: 'Сценарий эпизода 4', type: 'Текст', description: 'Финальная версия сценария с разметкой по ролям.', link: '#' },
                { id: '4', title: 'Запись репетиции', type: 'Видео', description: 'Черновая запись от 12.03.2025.', link: '#' }
            ];
            await window.set(ref(db, 'materials'), materials);
        }

        // Загружаем команду
        const teamSnap = await get(ref(db, 'team'));
        if (teamSnap.exists()) {
            team = teamSnap.val();
        } else {
            team = [
                { id: '1', name: 'Анна Смирнова', role: 'Режиссёр дубляжа', photo: '', bio: 'Опыт работы более 10 лет.', social: 'https://vk.com/anna\nhttps://t.me/anna' },
                { id: '2', name: 'Пётр Иванов', role: 'Актёр озвучки', photo: '', bio: 'Голос главного героя в 30+ проектах.', social: 'https://vk.com/petr' },
                { id: '3', name: 'Елена Петрова', role: 'Звукорежиссёр', photo: '', bio: 'Специалист по обработке аудио.', social: '' }
            ];
            await window.set(ref(db, 'team'), team);
        }

        // Загружаем проекты
        const projectsSnap = await get(ref(db, 'projects'));
        if (projectsSnap.exists()) {
            projects = projectsSnap.val();
        } else {
            projects = [
                { id: '1', title: 'Киберпанк 2077', description: 'Полный дубляж игры', date: '2024' },
                { id: '2', title: 'Аркейн', description: 'Озвучка второго сезона', date: '2025' },
                { id: '3', title: 'Хоббит', description: 'Новая версия', date: '2023' }
            ];
            await window.set(ref(db, 'projects'), projects);
        }

        // Загружаем контакты
        const contactsSnap = await get(ref(db, 'contacts'));
        if (contactsSnap.exists()) {
            contacts = contactsSnap.val();
        } else {
            contacts = {
                email: 'tot.dub@example.com',
                social: 'https://vk.com/tot, https://t.me/tot_dub',
                other: 'По всем вопросам пишите на почту или в Telegram.'
            };
            await window.set(ref(db, 'contacts'), contacts);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        alert('Не удалось загрузить данные. Проверьте интернет-соединение и настройки Firebase.');
    }
}

async function saveMaterials() {
    await window.set(window.ref(window.db, 'materials'), materials);
}
async function saveTeam() {
    await window.set(window.ref(window.db, 'team'), team);
}
async function saveProjects() {
    await window.set(window.ref(window.db, 'projects'), projects);
}
async function saveContacts() {
    await window.set(window.ref(window.db, 'contacts'), contacts);
}

// ==================== Авторизация через Firebase Auth ====================
function updateAuthUI() {
    if (isAdmin) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        if (adminControls[currentPage]) adminControls[currentPage].style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        Object.values(adminControls).forEach(el => { if (el) el.style.display = 'none'; });
    }
}

async function login(email, password) {
    try {
        await window.signInWithEmailAndPassword(window.auth, email, password);
        // isAdmin обновится через onAuthStateChanged
    } catch (error) {
        alert('Ошибка входа: ' + error.message);
    }
}

async function logout() {
    await window.signOut(window.auth);
}

// Следим за состоянием аутентификации
window.onAuthStateChanged(window.auth, (user) => {
    if (user) {
        // Пользователь вошёл
        isAdmin = true;
    } else {
        // Пользователь вышел
        isAdmin = false;
    }
    updateAuthUI();
    renderCurrentPage();
});

function showModal() { loginModal.classList.add('show'); }
function hideModal() { loginModal.classList.remove('show'); }

function hideAllForms() {
    document.getElementById('materialFormContainer').style.display = 'none';
    document.getElementById('memberFormContainer').style.display = 'none';
    document.getElementById('projectFormContainer').style.display = 'none';
    document.getElementById('contactsFormContainer').style.display = 'none';
}

// ==================== Навигация ====================
function switchPage(pageId) {
    Object.values(pages).forEach(p => p.classList.remove('active-page'));
    if (pages[pageId]) pages[pageId].classList.add('active-page');

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) link.classList.add('active');
    });

    currentPage = pageId;
    hideAllForms();
    updateAuthUI();
    if (pageId !== 'member-profile') {
        currentProfileId = null;
    }
    renderCurrentPage();
}

function renderCurrentPage() {
    switch (currentPage) {
        case 'materials': renderMaterials(); break;
        case 'team': renderTeam(); break;
        case 'projects': renderProjects(); break;
        case 'contacts': renderContacts(); break;
        case 'member-profile': if (currentProfileId) renderMemberProfile(currentProfileId); break;
    }
}

// ==================== Материалы ====================
function renderMaterials() {
    const grid = document.getElementById('materialsGrid');
    if (!materials.length) {
        grid.innerHTML = '<div class="empty-message">Пока нет материалов</div>';
        return;
    }
    let html = '';
    materials.forEach(item => {
        html += `
            <div class="material-card" data-id="${item.id}">
                <div class="material-type">${escapeHtml(item.type)}</div>
                <h3 class="material-title">${escapeHtml(item.title)}</h3>
                <p class="material-description">${escapeHtml(item.description)}</p>
                <a href="${escapeHtml(item.link)}" class="material-link" target="_blank">Перейти</a>
                ${isAdmin ? `
                    <div class="card-actions">
                        <button class="edit-material" data-id="${item.id}">✎</button>
                        <button class="delete-material" data-id="${item.id}">🗑</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    grid.innerHTML = html;
    if (isAdmin) attachMaterialEvents();
}

function attachMaterialEvents() {
    document.querySelectorAll('.edit-material').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); editMaterial(btn.dataset.id); });
    });
    document.querySelectorAll('.delete-material').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); deleteMaterial(btn.dataset.id); });
    });
}

function editMaterial(id) {
    const material = materials.find(m => m.id === id);
    if (!material) return;
    document.getElementById('materialId').value = material.id;
    document.getElementById('materialTitle').value = material.title;
    document.getElementById('materialType').value = material.type;
    document.getElementById('materialDesc').value = material.description;
    document.getElementById('materialLink').value = material.link;
    document.getElementById('materialFormTitle').textContent = 'Редактировать материал';
    document.getElementById('materialFormContainer').style.display = 'block';
}

async function deleteMaterial(id) {
    if (confirm('Удалить материал?')) {
        materials = materials.filter(m => m.id !== id);
        await saveMaterials();
        renderMaterials();
    }
}

document.getElementById('addMaterialBtn')?.addEventListener('click', () => {
    document.getElementById('materialId').value = '';
    document.getElementById('materialForm').reset();
    document.getElementById('materialFormTitle').textContent = 'Новый материал';
    document.getElementById('materialFormContainer').style.display = 'block';
});
document.getElementById('cancelMaterial')?.addEventListener('click', () => {
    document.getElementById('materialFormContainer').style.display = 'none';
});
document.getElementById('materialForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('materialId').value;
    const title = document.getElementById('materialTitle').value.trim();
    const type = document.getElementById('materialType').value;
    const desc = document.getElementById('materialDesc').value.trim();
    const link = document.getElementById('materialLink').value.trim();
    if (!title || !desc || !link) return alert('Заполните поля');
    if (id) {
        const index = materials.findIndex(m => m.id === id);
        if (index !== -1) materials[index] = { ...materials[index], title, type, description: desc, link };
    } else {
        materials.push({ id: Date.now().toString(), title, type, description: desc, link });
    }
    await saveMaterials();
    renderMaterials();
    document.getElementById('materialFormContainer').style.display = 'none';
});

// ==================== Команда ====================
function renderTeam() {
    const grid = document.getElementById('teamGrid');
    if (!team.length) {
        grid.innerHTML = '<div class="empty-message">Команда пока не добавлена</div>';
        return;
    }
    let html = '';
    team.forEach(member => {
        html += `
            <div class="team-card" data-id="${member.id}">
                ${member.photo ? `<img src="${escapeHtml(member.photo)}" alt="${escapeHtml(member.name)}" class="team-photo">` : '<div class="team-photo">Нет фото</div>'}
                <div class="team-role">${escapeHtml(member.role)}</div>
                <h3 class="team-name">${escapeHtml(member.name)}</h3>
                ${isAdmin ? `
                    <div class="card-actions">
                        <button class="edit-member" data-id="${member.id}">✎</button>
                        <button class="delete-member" data-id="${member.id}">🗑</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    grid.innerHTML = html;

    document.querySelectorAll('.team-card').forEach(card => {
        const memberId = card.dataset.id;
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.edit-member') && !e.target.closest('.delete-member')) {
                showMemberProfile(memberId);
            }
        });
    });
    if (isAdmin) {
        document.querySelectorAll('.edit-member').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); editMember(btn.dataset.id); });
        });
        document.querySelectorAll('.delete-member').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); deleteMember(btn.dataset.id); });
        });
    }
}

function editMember(id) {
    const member = team.find(m => m.id === id);
    if (!member) return;
    document.getElementById('memberId').value = member.id;
    document.getElementById('memberName').value = member.name;
    document.getElementById('memberRole').value = member.role;
    document.getElementById('memberPhoto').value = member.photo || '';
    document.getElementById('memberBio').value = member.bio || '';
    document.getElementById('memberSocial').value = member.social || '';
    document.getElementById('memberFormTitle').textContent = 'Редактировать участника';
    document.getElementById('memberFormContainer').style.display = 'block';
}

async function deleteMember(id) {
    if (confirm('Удалить участника?')) {
        team = team.filter(m => m.id !== id);
        await saveTeam();
        if (currentPage === 'member-profile' && currentProfileId === id) {
            switchPage('team');
        } else {
            renderTeam();
        }
    }
}

document.getElementById('addMemberBtn')?.addEventListener('click', () => {
    document.getElementById('memberId').value = '';
    document.getElementById('memberForm').reset();
    document.getElementById('memberFormTitle').textContent = 'Новый участник';
    document.getElementById('memberFormContainer').style.display = 'block';
});
document.getElementById('cancelMember')?.addEventListener('click', () => {
    document.getElementById('memberFormContainer').style.display = 'none';
});
document.getElementById('memberForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('memberId').value;
    const name = document.getElementById('memberName').value.trim();
    const role = document.getElementById('memberRole').value.trim();
    const photo = document.getElementById('memberPhoto').value.trim();
    const bio = document.getElementById('memberBio').value.trim();
    const social = document.getElementById('memberSocial').value.trim();
    if (!name || !role) return alert('Заполните имя и роль');
    if (id) {
        const index = team.findIndex(m => m.id === id);
        if (index !== -1) team[index] = { ...team[index], name, role, photo, bio, social };
    } else {
        team.push({ id: Date.now().toString(), name, role, photo, bio, social });
    }
    await saveTeam();
    if (currentPage === 'member-profile' && currentProfileId === id) {
        renderMemberProfile(id);
    } else {
        renderTeam();
    }
    document.getElementById('memberFormContainer').style.display = 'none';
});

// ==================== Профиль участника ====================
function showMemberProfile(memberId) {
    currentProfileId = memberId;
    renderMemberProfile(memberId);
    switchPage('member-profile');
}

function renderMemberProfile(memberId) {
    const member = team.find(m => m.id === memberId);
    if (!member) return;
    const container = document.getElementById('memberProfileContent');
    const html = `
        <div class="profile-container">
            ${member.photo ? `<img src="${escapeHtml(member.photo)}" alt="${escapeHtml(member.name)}" class="profile-photo">` : '<div class="profile-photo" style="background:#333; display:flex; align-items:center; justify-content:center;">Нет фото</div>'}
            <h2 class="profile-name">${escapeHtml(member.name)}</h2>
            <div class="profile-role">${escapeHtml(member.role)}</div>
            <div class="profile-bio"><strong>Биография:</strong><br>${escapeHtml(member.bio || 'Не указана')}</div>
            <div class="profile-social"><strong>Социальные сети:</strong><br>${formatSocialLinks(member.social)}</div>
        </div>
    `;
    container.innerHTML = html;
}

function formatSocialLinks(socialStr) {
    if (!socialStr) return '—';
    const links = socialStr.split('\n').filter(l => l.trim());
    if (!links.length) return '—';
    return links.map(link => `<a href="${link.trim()}" target="_blank">${link.trim()}</a>`).join('<br>');
}

document.getElementById('backToTeamBtn').addEventListener('click', () => {
    switchPage('team');
});

// ==================== Проекты ====================
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!projects.length) {
        grid.innerHTML = '<div class="empty-message">Проектов пока нет</div>';
        return;
    }
    let html = '';
    projects.forEach(proj => {
        html += `
            <div class="project-card" data-id="${proj.id}">
                <h3 class="project-title">${escapeHtml(proj.title)}</h3>
                <p class="project-description">${escapeHtml(proj.description)}</p>
                <div class="project-date" style="color:#2ecc71;">${escapeHtml(proj.date)}</div>
                ${isAdmin ? `
                    <div class="card-actions">
                        <button class="edit-project" data-id="${proj.id}">✎</button>
                        <button class="delete-project" data-id="${proj.id}">🗑</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    grid.innerHTML = html;
    if (isAdmin) {
        document.querySelectorAll('.edit-project').forEach(btn => {
            btn.addEventListener('click', () => editProject(btn.dataset.id));
        });
        document.querySelectorAll('.delete-project').forEach(btn => {
            btn.addEventListener('click', () => deleteProject(btn.dataset.id));
        });
    }
}

function editProject(id) {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    document.getElementById('projectId').value = proj.id;
    document.getElementById('projectTitle').value = proj.title;
    document.getElementById('projectDesc').value = proj.description;
    document.getElementById('projectDate').value = proj.date;
    document.getElementById('projectFormTitle').textContent = 'Редактировать проект';
    document.getElementById('projectFormContainer').style.display = 'block';
}

async function deleteProject(id) {
    if (confirm('Удалить проект?')) {
        projects = projects.filter(p => p.id !== id);
        await saveProjects();
        renderProjects();
    }
}

document.getElementById('addProjectBtn')?.addEventListener('click', () => {
    document.getElementById('projectId').value = '';
    document.getElementById('projectForm').reset();
    document.getElementById('projectFormTitle').textContent = 'Новый проект';
    document.getElementById('projectFormContainer').style.display = 'block';
});
document.getElementById('cancelProject')?.addEventListener('click', () => {
    document.getElementById('projectFormContainer').style.display = 'none';
});
document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('projectId').value;
    const title = document.getElementById('projectTitle').value.trim();
    const desc = document.getElementById('projectDesc').value.trim();
    const date = document.getElementById('projectDate').value.trim();
    if (!title || !desc || !date) return alert('Заполните поля');
    if (id) {
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) projects[index] = { ...projects[index], title, description: desc, date };
    } else {
        projects.push({ id: Date.now().toString(), title, description: desc, date });
    }
    await saveProjects();
    renderProjects();
    document.getElementById('projectFormContainer').style.display = 'none';
});

// ==================== Контакты ====================
function renderContacts() {
    const content = document.getElementById('contactsContent');
    let html = `
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(contacts.email)}">${escapeHtml(contacts.email)}</a></p>
        <p><strong>Соцсети:</strong> ${formatContactsSocial(contacts.social)}</p>
        <p><strong>Дополнительно:</strong> ${escapeHtml(contacts.other)}</p>
    `;
    content.innerHTML = html;
}

function formatContactsSocial(str) {
    if (!str) return '—';
    return str.split(',').map(link => `<a href="${link.trim()}" target="_blank">${link.trim()}</a>`).join(', ');
}

document.getElementById('editContactsBtn')?.addEventListener('click', () => {
    document.getElementById('contactEmail').value = contacts.email;
    document.getElementById('contactSocial').value = contacts.social;
    document.getElementById('contactOther').value = contacts.other;
    document.getElementById('contactsFormContainer').style.display = 'block';
});
document.getElementById('cancelContacts')?.addEventListener('click', () => {
    document.getElementById('contactsFormContainer').style.display = 'none';
});
document.getElementById('contactsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    contacts.email = document.getElementById('contactEmail').value.trim();
    contacts.social = document.getElementById('contactSocial').value.trim();
    contacts.other = document.getElementById('contactOther').value.trim();
    await saveContacts();
    renderContacts();
    document.getElementById('contactsFormContainer').style.display = 'none';
});

// ==================== Вспомогательные ====================
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[&<>"]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
    });
}

// ==================== Инициализация ====================
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData();
    // onAuthStateChanged уже установлен, он обновит UI

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(link.dataset.page);
        });
    });

    loginBtn.addEventListener('click', showModal);
    logoutBtn.addEventListener('click', logout);
    closeModal.addEventListener('click', hideModal);
    window.addEventListener('click', (e) => { if (e.target === loginModal) hideModal(); });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(email, password);
        hideModal();
    });

    switchPage('materials');
});
