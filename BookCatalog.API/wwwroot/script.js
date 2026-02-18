const apiBase = 'https://localhost:7217/api';

// -------------------- Authors --------------------
async function loadAuthors() {
    const res = await fetch(`${apiBase}/authors`);
    const authors = await res.json();
    const tbody = document.querySelector('#authorsTable tbody');
    tbody.innerHTML = '';
    authors.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.id}</td><td>${a.name}</td><td>${a.biography || ''}</td>`;
        tbody.appendChild(tr);
    });
    populateAuthorDropdown(authors);
}

function populateAuthorDropdown(authors) {
    const select = document.getElementById('bookAuthor');
    select.innerHTML = '';
    authors.forEach(a => {
        const option = document.createElement('option');
        option.value = a.id;
        option.textContent = a.name;
        select.appendChild(option);
    });
}

// Author form submission
document.getElementById('authorForm').addEventListener('submit', async e => {
    e.preventDefault();
    const author = {
        name: document.getElementById('authorName').value,
        biography: document.getElementById('authorBio').value
    };
    await fetch(`${apiBase}/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(author)
    });
    e.target.reset();
    await loadAuthors(); // ensure dropdown updates
});

// -------------------- Categories --------------------
async function loadCategories() {
    const res = await fetch(`${apiBase}/categories`);
    const categories = await res.json();
    const tbody = document.querySelector('#categoriesTable tbody');
    tbody.innerHTML = '';
    categories.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.id}</td><td>${c.name}</td>`;
        tbody.appendChild(tr);
    });
    populateCategoryDropdown(categories);
}

function populateCategoryDropdown(categories) {
    const select = document.getElementById('bookCategory');
    select.innerHTML = '';
    categories.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        select.appendChild(option);
    });
}

// Category form submission
document.getElementById('categoryForm').addEventListener('submit', async e => {
    e.preventDefault();
    const category = { name: document.getElementById('categoryName').value };
    await fetch(`${apiBase}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
    });
    e.target.reset();
    await loadCategories(); // ensure dropdown updates
});

// -------------------- Books --------------------
async function loadBooks() {
    const res = await fetch(`${apiBase}/books`);
    const books = await res.json();
    const tbody = document.querySelector('#booksTable tbody');
    tbody.innerHTML = '';
    books.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${b.id}</td><td>${b.title}</td><td>${b.authorName}</td><td>${b.categoryName}</td><td>${b.price.toFixed(2)}</td>`;
        tbody.appendChild(tr);
    });
}

// Book form submission (IDs + Names)
document.getElementById('bookForm').addEventListener('submit', async e => {
    e.preventDefault();

    const authorSelect = document.getElementById('bookAuthor');
    const categorySelect = document.getElementById('bookCategory');

    const authorId = parseInt(authorSelect.value);
    const categoryId = parseInt(categorySelect.value);

    if (!authorId || !categoryId) {
        alert("Please select a valid author and category.");
        return;
    }

    const book = {
        title: document.getElementById('bookTitle').value,
        authorId: authorId,
        categoryId: categoryId,
        authorName: authorSelect.options[authorSelect.selectedIndex].text,
        categoryName: categorySelect.options[categorySelect.selectedIndex].text,
        price: parseFloat(document.getElementById('bookPrice').value)
    };

    const response = await fetch(`${apiBase}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book)
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Error creating book:", err);
        alert("Failed to create book. Check console.");
        return;
    }

    e.target.reset();
    await loadBooks();
});

// -------------------- Init --------------------
async function init() {
    await loadAuthors();
    await loadCategories();
    await loadBooks();
}
init();
