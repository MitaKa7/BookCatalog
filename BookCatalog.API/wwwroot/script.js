const apiBase = 'https://localhost:7217/api';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const moneyBGN = new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'BGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const authState = {
    roles: [],
    fullName: null,
    email: null
};

let unauthorizedAlreadyHandled = false;

let editingAuthorId = null;
let editingCategoryId = null;
let editingBookId = null;

function parseJwt(token) {
    try {
        if (!token || typeof token !== 'string') return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function looksLikeJwt(token) {
    return typeof token === 'string' && token.split('.').length === 3;
}

function extractTokenString(data) {
    if (!data) return null;
    if (typeof data === 'string') return data;

    const direct =
        data.token ??
        data.accessToken ??
        data.jwt ??
        data.bearer ??
        data.idToken;

    if (typeof direct === 'string') return direct;

    if (direct && typeof direct === 'object') {
        const nested =
            direct.accessToken ??
            direct.token ??
            direct.jwt;

        if (typeof nested === 'string') return nested;
    }

    return null;
}

function getRolesFromToken(token) {
    const payload = parseJwt(token);
    if (!payload) return [];

    const roles =
        payload.role ??
        payload.roles ??
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (!roles) return [];
    return Array.isArray(roles) ? roles : [roles];
}
function normalizeRoles(meJson) {
    const r =
        meJson?.roles ??
        meJson?.Roles ??
        meJson?.role ??
        meJson?.Role ??
        meJson?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (!r) return [];
    return Array.isArray(r) ? r : [r];
}

function isLoggedIn() {
    return !!localStorage.getItem('book_token');
}

function getEffectiveRoles() {
    if (Array.isArray(authState.roles) && authState.roles.length) return authState.roles;
    const token = localStorage.getItem('book_token');
    return getRolesFromToken(token);
}

function isAdmin() {
    return getEffectiveRoles().includes('Admin');
}

function isEditorOrAdmin() {
    const roles = getEffectiveRoles();
    return roles.includes('Editor') || roles.includes('Admin');
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setStatsPlaceholder(placeholder = '—') {
    setText('booksCount', placeholder);
    setText('authorsCount', placeholder);
    setText('categoriesCount', placeholder);
}

function setCounts({ books, authors, categories }) {
    setText('booksCount', books === 0 ? 'Няма' : String(books));
    setText('authorsCount', authors === 0 ? 'Няма' : String(authors));
    setText('categoriesCount', categories === 0 ? 'Няма' : String(categories));
}

function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function toast(message, type = 'info', ms = 2200) {
    const region = document.getElementById('toastRegion');
    if (!region) return alert(message);

    const t = document.createElement('div');
    t.textContent = message;

    const bg =
        type === 'success' ? '#065f46' :
            type === 'error' ? '#7f1d1d' :
                type === 'warn' ? '#7c2d12' :
                    '#111827';

    t.style.cssText = `
    margin: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    background: ${bg};
    color: white;
    font: 500 14px/1.2 Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    box-shadow: 0 10px 25px rgba(0,0,0,.25);
    max-width: 520px;
  `;

    region.appendChild(t);

    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = 'opacity .25s ease';
        setTimeout(() => t.remove(), 260);
    }, ms);
}


function updateActiveNav() {
    const hash = window.location.hash || '#section-books';
    $$('.nav-link').forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
}
window.addEventListener('hashchange', updateActiveNav);


async function safeJson(res) {
    try {
        const ct = res.headers.get('content-type') || '';
        if (!ct.toLowerCase().includes('application/json')) return null;
        return await res.json();
    } catch {
        return null;
    }
}

function handleUnauthorized() {
    if (unauthorizedAlreadyHandled) return;
    unauthorizedAlreadyHandled = true;

    localStorage.removeItem('book_token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');

    authState.roles = [];
    authState.fullName = null;
    authState.email = null;

    updateAuthUI();
    applyRoleBasedUI();
    setStatsPlaceholder('—');

    toast('Сесията изтече. Моля, влез отново.', 'warn');
}

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('book_token');
    const method = (options.method || 'GET').toUpperCase();
    const headers = { ...(options.headers || {}) };

    const hasBody = options.body !== undefined && options.body !== null;

    if (
        hasBody &&
        typeof options.body === 'object' &&
        !(options.body instanceof FormData) &&
        !(options.body instanceof Blob)
    ) {
        if (!headers['Content-Type'] && !headers['content-type']) {
            headers['Content-Type'] = 'application/json';
        }
        if (typeof options.body !== 'string') {
            options = { ...options, body: JSON.stringify(options.body) };
        }
    }

    if (token && looksLikeJwt(token)) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: 'omit',
        redirect: 'manual'
    });

    if (res.type === 'opaqueredirect' || [301, 302, 303, 307, 308].includes(res.status)) {
        handleUnauthorized();
        return res;
    }

    if (res.status === 401) {
        handleUnauthorized();
    }

    return res;
}


async function login(email, password) {
    unauthorizedAlreadyHandled = false;

    const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        redirect: 'manual',
        body: JSON.stringify({ email, password })
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
        toast('Login failed (redirect).', 'error', 3500);
        return false;
    }

    if (!res.ok) {
        const err = await res.text().catch(() => '');
        toast('Login failed: ' + (err || res.status), 'error', 3500);
        return false;
    }

    const data = (await safeJson(res)) ?? (await res.text().catch(() => null));
    const tokenStr = extractTokenString(data);

    if (!tokenStr || !looksLikeJwt(tokenStr)) {
        toast('Login failed: API не върна валиден JWT token.', 'error', 4000);
        return false;
    }

    localStorage.setItem('book_token', tokenStr);
    localStorage.setItem('userEmail', email);

    const fullName =
        (typeof data === 'object' && data && (data.fullName ?? data.FullName)) ||
        email;

    localStorage.setItem('userName', fullName);

    authState.roles = getRolesFromToken(tokenStr);
    authState.email = email;
    authState.fullName = fullName;

    return true;
}

async function register(email, password, fullName) {
    const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        redirect: 'manual',
        body: JSON.stringify({ email, password, fullName })
    });

    if (!res.ok) {
        const err = await res.text().catch(() => '');
        toast('Registration failed: ' + (err || res.status), 'error', 3500);
        return false;
    }

    toast('Registration successful! Please login.', 'success');
    return true;
}

function logout() {
    localStorage.removeItem('book_token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');

    authState.roles = [];
    authState.fullName = null;
    authState.email = null;

    unauthorizedAlreadyHandled = false;

    // Reset editing state
    editingAuthorId = null;
    editingCategoryId = null;
    editingBookId = null;

    updateAuthUI();
    applyRoleBasedUI();
    setStatsPlaceholder('—');

    const booksTbody = $('#booksTable tbody');
    const authorsTbody = $('#authorsTable tbody');
    const categoriesTbody = $('#categoriesTable tbody');
    if (booksTbody) booksTbody.innerHTML = '';
    if (authorsTbody) authorsTbody.innerHTML = '';
    if (categoriesTbody) categoriesTbody.innerHTML = '';

    const authorSelect = $('#bookAuthor');
    const categorySelect = $('#bookCategory');
    if (authorSelect) authorSelect.innerHTML = '<option value="" disabled selected>Избери автор</option>';
    if (categorySelect) categorySelect.innerHTML = '<option value="" disabled selected>Избери категория</option>';

    toast('Излезе от профила.', 'success');
}

async function loadMe() {
    if (!isLoggedIn()) return null;

    const res = await fetchWithAuth(`${apiBase}/auth/me`, { method: 'GET' });

    if (!res.ok) {
        authState.roles = getEffectiveRoles();
        applyRoleBasedUI();
        return null;
    }

    const me = await safeJson(res);
    if (!me) {
        authState.roles = getEffectiveRoles();
        applyRoleBasedUI();
        return null;
    }

    const rolesFromMe = normalizeRoles(me);
    authState.roles = rolesFromMe.length
        ? rolesFromMe
        : getRolesFromToken(localStorage.getItem('book_token'));

    authState.fullName = me.fullName ?? me.FullName ?? localStorage.getItem('userName');
    authState.email = me.email ?? me.Email ?? localStorage.getItem('userEmail');

    if (authState.fullName) localStorage.setItem('userName', authState.fullName);
    if (authState.email) localStorage.setItem('userEmail', authState.email);

    applyRoleBasedUI();
    return me;
}

function ensureActionsHeader(tableId, key, show) {
    const theadTr = document.querySelector(`${tableId} thead tr`);
    if (!theadTr) return;

    const existing = theadTr.querySelector(`th[data-actions="${key}"]`);
    if (show && !existing) {
        const th = document.createElement('th');
        th.textContent = 'Действия';
        th.setAttribute('data-actions', key);
        th.style.width = '170px'; // Увеличаваме малко ширината заради 2та бутона
        theadTr.appendChild(th);
    } else if (!show && existing) {
        existing.remove();
    }
}

function applyRoleBasedUI() {
    const roles = getEffectiveRoles();

    const roleText = roles.length ? roles.join(', ') : '—';
    const badge = document.getElementById('userRoleBadge');
    if (badge) badge.textContent = roleText;

    const profileRoles = document.getElementById('profileRoles');
    if (profileRoles) profileRoles.textContent = roleText;

    // Включваме Reader-а тук, за да отключим всички форми едновременно (могат да създават)
    const canCreate = roles.includes('Editor') || roles.includes('Admin') || roles.includes('Reader');

    const authorForm = document.getElementById('authorForm');
    const categoryForm = document.getElementById('categoryForm');
    const bookForm = document.getElementById('bookForm');

    if (authorForm) authorForm.style.opacity = canCreate ? '1' : '.5';
    if (categoryForm) categoryForm.style.opacity = canCreate ? '1' : '.5';
    if (bookForm) bookForm.style.opacity = canCreate ? '1' : '.5';

    [authorForm, categoryForm, bookForm].forEach(form => {
        if (!form) return;
        [...form.querySelectorAll('input,select,button,textarea')].forEach(el => {
            el.disabled = !canCreate;
        });
    });

    // Бутоните за Действия се показват за Admin (или Editor, ако се ползва)
    const showAdminActions = isEditorOrAdmin();
    ensureActionsHeader('#authorsTable', 'authors', showAdminActions);
    ensureActionsHeader('#categoriesTable', 'categories', showAdminActions);
    ensureActionsHeader('#booksTable', 'books', showAdminActions);
}

function updateAuthUI() {
    const loggedIn = isLoggedIn();

    const authSection = document.getElementById('authSection');
    const mainContent = document.getElementById('mainContent');

    if (authSection) authSection.style.display = loggedIn ? 'none' : 'block';
    if (mainContent) mainContent.style.display = loggedIn ? 'flex' : 'none';

    if (!loggedIn) return;

    const name = localStorage.getItem('userName') || 'Потребител';
    const email = localStorage.getItem('userEmail') || '';

    setText('profileName', name);
    setText('profileEmail', email);
    setText('userName', name);
    setText('userEmail', email);

    const avatar = document.getElementById('userAvatar');
    if (avatar) avatar.textContent = (name?.[0] || 'U').toUpperCase();
}


document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    setStatsPlaceholder('…');

    const success = await login(email, password);
    if (success) {
        updateAuthUI();
        if (!window.location.hash) window.location.hash = '#section-books';
        updateActiveNav();

        applyRoleBasedUI();
        await loadMe();
        await initData();

        toast(`Добре дошъл${isAdmin() ? ', Admin' : ''}!`, 'success');
    } else {
        setStatsPlaceholder('—');
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('registerFullName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    await register(email, password, fullName);
});

document.getElementById('logoutBtn')?.addEventListener('click', logout);


// --- БУТОНИ ЗА ДЕЙСТВИЯ ---

function makeDeleteButton(onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Изтрий';
    btn.style.cssText = `
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid rgba(0,0,0,.15);
    background: #991b1b;
    color: white;
    cursor: pointer;
  `;
    btn.addEventListener('click', onClick);
    return btn;
}

function makeEditButton(onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Редактирай';
    btn.style.cssText = `
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid rgba(0,0,0,.15);
    background: #0ea5e9;
    color: white;
    cursor: pointer;
    margin-right: 5px;
  `;
    btn.addEventListener('click', onClick);
    return btn;
}

// --- ФУНКЦИИ ЗА ТРИЕНЕ ---

async function deleteAuthor(authorId) {
    if (!confirm('Сигурен ли си, че искаш да изтриеш автора?')) return;
    const res = await fetchWithAuth(`${apiBase}/authors/${authorId}`, { method: 'DELETE' });
    if (res.status === 403) {
        toast('Само Admin може да трие автори.', 'error');
        return;
    }
    if (res.ok) {
        toast('Авторът е изтрит.', 'success');
        await initData();
        return;
    }
    const msg = await res.text().catch(() => '');
    toast('Грешка при триене: ' + (msg || res.status), 'error', 3500);
}

async function deleteCategory(categoryId) {
    if (!confirm('Сигурен ли си, че искаш да изтриеш категорията?')) return;
    const res = await fetchWithAuth(`${apiBase}/categories/${categoryId}`, { method: 'DELETE' });
    if (res.status === 403) {
        toast('Само Admin може да трие категории.', 'error');
        return;
    }
    if (res.ok) {
        toast('Категорията е изтрита.', 'success');
        await initData();
        return;
    }
    const msg = await res.text().catch(() => '');
    toast('Грешка при триене: ' + (msg || res.status), 'error', 3500);
}

async function deleteBook(bookId) {
    if (!confirm('Сигурен ли си, че искаш да изтриеш книгата?')) return;
    const res = await fetchWithAuth(`${apiBase}/books/${bookId}`, { method: 'DELETE' });
    if (res.status === 403) {
        toast('Само Admin може да трие книги.', 'error');
        return;
    }
    if (res.ok) {
        toast('Книгата е изтрита.', 'success');
        await initData();
        return;
    }
    const msg = await res.text().catch(() => '');
    toast('Грешка при триене: ' + (msg || res.status), 'error', 3500);
}

// --- ЗАРЕЖДАНЕ НА ДАННИ В ТАБЛИЦИТЕ ---

async function loadAuthors() {
    const res = await fetchWithAuth(`${apiBase}/authors`);
    if (!res.ok) return null;
    const authors = await safeJson(res);
    if (!Array.isArray(authors)) return null;

    const tbody = document.querySelector('#authorsTable tbody');
    const select = document.getElementById('bookAuthor');

    if (tbody) tbody.innerHTML = '';
    if (select) select.innerHTML = '<option value="" disabled selected>Избери автор</option>';

    const showActions = isEditorOrAdmin();
    ensureActionsHeader('#authorsTable', 'authors', showActions);

    authors.forEach(a => {
        if (tbody) {
            const tr = document.createElement('tr');

            const nameTd = document.createElement('td');
            nameTd.textContent = a.name ?? '';

            const bioTd = document.createElement('td');
            bioTd.textContent = a.biography ?? '';

            tr.appendChild(nameTd);
            tr.appendChild(bioTd);

            if (showActions) {
                const actionsTd = document.createElement('td');

                // Бутон Редактирай
                actionsTd.appendChild(makeEditButton(() => {
                    editingAuthorId = a.id;
                    document.getElementById('authorName').value = a.name || '';
                    document.getElementById('authorBio').value = a.biography || '';

                    const btn = document.querySelector('#authorForm button[type="submit"]');
                    if (btn) btn.textContent = 'Запази промените';
                    document.getElementById('authorForm').scrollIntoView({ behavior: 'smooth' });
                }));

                // Бутон Изтрий
                actionsTd.appendChild(makeDeleteButton(() => deleteAuthor(a.id)));

                tr.appendChild(actionsTd);
            }

            tbody.appendChild(tr);
        }

        if (select) {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.name;
            select.appendChild(opt);
        }
    });

    return authors;
}

async function loadCategories() {
    const res = await fetchWithAuth(`${apiBase}/categories`);
    if (!res.ok) return null;
    const categories = await safeJson(res);
    if (!Array.isArray(categories)) return null;

    const tbody = document.querySelector('#categoriesTable tbody');
    const select = document.getElementById('bookCategory');

    if (tbody) tbody.innerHTML = '';
    if (select) select.innerHTML = '<option value="" disabled selected>Избери категория</option>';

    const showActions = isEditorOrAdmin();
    ensureActionsHeader('#categoriesTable', 'categories', showActions);

    categories.forEach(c => {
        if (tbody) {
            const tr = document.createElement('tr');

            const nameTd = document.createElement('td');
            nameTd.innerHTML = escapeHtml(c.name);

            tr.appendChild(nameTd);

            if (showActions) {
                const actionsTd = document.createElement('td');

                // Бутон Редактирай
                actionsTd.appendChild(makeEditButton(() => {
                    editingCategoryId = c.id;
                    document.getElementById('categoryName').value = c.name || '';

                    const btn = document.querySelector('#categoryForm button[type="submit"]');
                    if (btn) btn.textContent = 'Запази промените';
                    document.getElementById('categoryForm').scrollIntoView({ behavior: 'smooth' });
                }));

                // Бутон Изтрий
                actionsTd.appendChild(makeDeleteButton(() => deleteCategory(c.id)));
                tr.appendChild(actionsTd);
            }

            tbody.appendChild(tr);
        }

        if (select) {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        }
    });

    return categories;
}

async function loadBooks() {
    const res = await fetchWithAuth(`${apiBase}/books`);
    if (!res.ok) return null;
    const books = await safeJson(res);
    if (!Array.isArray(books)) return null;

    const tbody = document.querySelector('#booksTable tbody');
    if (tbody) tbody.innerHTML = '';

    const showActions = isEditorOrAdmin();
    ensureActionsHeader('#booksTable', 'books', showActions);

    books.forEach(b => {
        if (!tbody) return;

        const tr = document.createElement('tr');

        const titleTd = document.createElement('td');
        titleTd.innerHTML = escapeHtml(b.title);

        const authorTd = document.createElement('td');
        authorTd.innerHTML = escapeHtml(b.authorName);

        const categoryTd = document.createElement('td');
        categoryTd.innerHTML = escapeHtml(b.categoryName);

        const priceTd = document.createElement('td');
        priceTd.textContent = moneyBGN.format(Number(b.price || 0));

        tr.appendChild(titleTd);
        tr.appendChild(authorTd);
        tr.appendChild(categoryTd);
        tr.appendChild(priceTd);

        if (showActions) {
            const actionsTd = document.createElement('td');

            // Бутон Редактирай
            actionsTd.appendChild(makeEditButton(() => {
                editingBookId = b.id;
                document.getElementById('bookTitle').value = b.title || '';
                document.getElementById('bookAuthor').value = b.authorId || '';
                document.getElementById('bookCategory').value = b.categoryId || '';
                document.getElementById('bookPrice').value = b.price || '';

                const btn = document.querySelector('#bookForm button[type="submit"]');
                if (btn) btn.textContent = 'Запази промените';
                document.getElementById('bookForm').scrollIntoView({ behavior: 'smooth' });
            }));

            // Бутон Изтрий
            actionsTd.appendChild(makeDeleteButton(() => deleteBook(b.id)));

            tr.appendChild(actionsTd);
        }

        tbody.appendChild(tr);
    });

    return books;
}

// --- СЪБМИТВАНЕ НА ФОРМИТЕ (СЪЗДАВАНЕ И РЕДАКЦИЯ) ---

// Форма за Автори
document.getElementById('authorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const roles = getEffectiveRoles();
    if (!roles.includes('Editor') && !roles.includes('Admin') && !roles.includes('Reader')) {
        toast('Нямаш права да добавяш/редактираш автори.', 'error');
        return;
    }

    const author = {
        name: document.getElementById('authorName').value.trim(),
        biography: document.getElementById('authorBio').value.trim()
    };

    const isEditing = editingAuthorId !== null;
    if (isEditing) author.id = editingAuthorId;

    const url = isEditing ? `${apiBase}/authors/${editingAuthorId}` : `${apiBase}/authors`;
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetchWithAuth(url, {
        method: method,
        body: JSON.stringify(author),
        headers: { 'Content-Type': 'application/json' }
    });

    if (res.status === 403) {
        toast('Сървърът отказа достъп (нямаш права).', 'error');
        return;
    }

    if (res.ok) {
        e.target.reset();
        editingAuthorId = null;
        const btn = document.querySelector('#authorForm button[type="submit"]');
        if (btn) btn.textContent = 'Добави автор';

        toast(isEditing ? 'Авторът е обновен.' : 'Авторът е добавен.', 'success');
        await initData();
    } else {
        const msg = await res.text().catch(() => '');
        toast('Грешка: ' + (msg || res.status), 'error', 3500);
    }
});

// Форма за Категории
document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const roles = getEffectiveRoles();
    if (!roles.includes('Editor') && !roles.includes('Admin') && !roles.includes('Reader')) {
        toast('Нямаш права да добавяш/редактираш категории.', 'error');
        return;
    }

    const category = {
        name: document.getElementById('categoryName').value.trim()
    };

    const isEditing = editingCategoryId !== null;
    if (isEditing) category.id = editingCategoryId;

    const url = isEditing ? `${apiBase}/categories/${editingCategoryId}` : `${apiBase}/categories`;
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetchWithAuth(url, {
        method: method,
        body: JSON.stringify(category),
        headers: { 'Content-Type': 'application/json' }
    });

    if (res.status === 403) {
        toast('Сървърът отказа достъп (нямаш права).', 'error');
        return;
    }

    if (res.ok) {
        e.target.reset();
        editingCategoryId = null;
        const btn = document.querySelector('#categoryForm button[type="submit"]');
        if (btn) btn.textContent = 'Добави категория';

        toast(isEditing ? 'Категорията е обновена.' : 'Категорията е добавена.', 'success');
        await initData();
    } else {
        const msg = await res.text().catch(() => '');
        toast('Грешка: ' + (msg || res.status), 'error', 3500);
    }
});

// Форма за Книги
document.getElementById('bookForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const roles = getEffectiveRoles();
    if (!roles.includes('Editor') && !roles.includes('Admin') && !roles.includes('Reader')) {
        toast('Нямаш права да добавяш/редактираш книги.', 'error');
        return;
    }

    const authorId = parseInt(document.getElementById('bookAuthor').value, 10);
    const categoryId = parseInt(document.getElementById('bookCategory').value, 10);

    const book = {
        title: document.getElementById('bookTitle').value.trim(),
        authorId,
        categoryId,
        price: parseFloat(document.getElementById('bookPrice').value)
    };

    const isEditing = editingBookId !== null;
    if (isEditing) book.id = editingBookId;

    const url = isEditing ? `${apiBase}/books/${editingBookId}` : `${apiBase}/books`;
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetchWithAuth(url, {
        method: method,
        body: JSON.stringify(book),
        headers: { 'Content-Type': 'application/json' }
    });

    if (res.status === 403) {
        toast('Сървърът отказа достъп (нямаш права).', 'error');
        return;
    }

    if (res.ok) {
        e.target.reset();
        editingBookId = null;
        const btn = document.querySelector('#bookForm button[type="submit"]');
        if (btn) btn.textContent = 'Добави книга';

        toast(isEditing ? 'Книгата е обновена.' : 'Книгата е добавена.', 'success');
        await initData();
    } else {
        const msg = await res.text().catch(() => '');
        toast('Грешка: ' + (msg || res.status), 'error', 3500);
    }
});

// Инициализация на данните
async function initData() {
    if (!isLoggedIn()) {
        setStatsPlaceholder('—');
        return;
    }

    setStatsPlaceholder('…');

    try {
        await loadMe();

        if (!isLoggedIn()) {
            setStatsPlaceholder('—');
            return;
        }

        const [authors, categories, books] = await Promise.all([
            loadAuthors(),
            loadCategories(),
            loadBooks()
        ]);

        setCounts({
            authors: Array.isArray(authors) ? authors.length : 0,
            categories: Array.isArray(categories) ? categories.length : 0,
            books: Array.isArray(books) ? books.length : 0
        });
    } catch (err) {
        console.error(err);
        setStatsPlaceholder('—');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateAuthUI();
    updateActiveNav();

    if (isLoggedIn()) {
        await loadMe();
        await initData();
    } else {
        applyRoleBasedUI();
        setStatsPlaceholder('—');
    }
});