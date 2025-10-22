// app.js
const apiBase = '/api/books';

const $ = id => document.getElementById(id);
const booksList = $('books-list');
const form = $('book-form');
const formTitle = $('form-title');
const bookIdInput = $('book-id');

async function fetchBooks(q = '') {
  const url = q ? `${apiBase}?q=${encodeURIComponent(q)}` : apiBase;
  const res = await fetch(url);
  return res.json();
}

function renderBooks(books) {
  booksList.innerHTML = '';
  if (!books.length) {
    booksList.innerHTML = '<li class="book-item"><div class="book-meta small">No books found.</div></li>';
    return;
  }
  books.forEach(b => {
    const li = document.createElement('li');
    li.className = 'book-item';
    li.innerHTML = `
      <div class="book-meta">
        <strong>${escapeHtml(b.title)}</strong>
        <div class="small">${escapeHtml(b.author || 'Unknown')} • ISBN: ${escapeHtml(b.isbn || '-')}${b.year ? ' • ' + b.year : ''} • Copies: ${b.copies ?? 0}</div>
      </div>
      <div class="book-actions">
        <button onclick="editBook('${b._id}')">Edit</button>
        <button onclick="deleteBook('${b._id}')" class="secondary">Delete</button>
      </div>
    `;
    booksList.appendChild(li);
  });
}

function escapeHtml(unsafe) {
  if (!unsafe && unsafe !== 0) return '';
  return String(unsafe)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadBooks(q = '') {
  try {
    const books = await fetchBooks(q);
    renderBooks(books);
  } catch (err) {
    console.error(err);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = bookIdInput.value;
  const payload = {
    title: $('title').value.trim(),
    author: $('author').value.trim(),
    isbn: $('isbn').value.trim(),
    year: $('year').value ? Number($('year').value) : undefined,
    copies: $('copies').value ? Number($('copies').value) : undefined
  };

  try {
    if (!payload.title) return alert('Title is required');
    if (id) {
      // update
      const res = await fetch(`${apiBase}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Update failed');
    } else {
      // create
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Create failed');
    }
    resetForm();
    loadBooks();
  } catch (err) {
    alert(err.message || 'Error');
  }
});

$('cancel-btn').addEventListener('click', resetForm);
$('search-btn').addEventListener('click', () => loadBooks($('search').value.trim()));
$('refresh-btn').addEventListener('click', () => { $('search').value=''; loadBooks(); });

window.editBook = async function (id) {
  try {
    const res = await fetch(`${apiBase}/${id}`);
    if (!res.ok) throw new Error('Not found');
    const b = await res.json();
    bookIdInput.value = b._id;
    $('title').value = b.title || '';
    $('author').value = b.author || '';
    $('isbn').value = b.isbn || '';
    $('year').value = b.year || '';
    $('copies').value = b.copies ?? 1;
    formTitle.textContent = 'Edit Book';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    alert('Could not load book');
  }
};

window.deleteBook = async function (id) {
  if (!confirm('Delete this book?')) return;
  try {
    const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    loadBooks();
  } catch (err) {
    alert(err.message || 'Error');
  }
};

function resetForm() {
  form.reset();
  bookIdInput.value = '';
  formTitle.textContent = 'Add Book';
}

loadBooks(); // initial load
