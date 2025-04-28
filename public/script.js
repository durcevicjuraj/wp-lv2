
let sviFilmovi = [];
let displayedFilms = [];
let currentPage = 0;
const pageSize = 50;
let kosarica = [];

function fetchData() {
  fetch('filmovi.csv')
    .then(res => res.text())
    .then(csv => {
      const rezultat = Papa.parse(csv, { header: true, skipEmptyLines: true });
      sviFilmovi = rezultat.data.map(f => ({
        title: f.title,
        year: Number(f.year),
        genre: f.genre,
        duration: Number(f.duration),
        country: f.country ? f.country.split(',').map(c => c.trim()) : [],
        avg_vote: Number(f.avg_vote),
      }));
      populateGenreFilter();
      displayedFilms = sviFilmovi;
      currentPage = 0;
      prikaziStranicu();
    })
    .catch(err => console.error('Greška pri dohvatu CSV-a:', err));
}

function populateGenreFilter() {
  const genres = new Set();
  sviFilmovi.forEach(f => {
    f.genre.split(';').forEach(g => genres.add(g.trim()));
  });
  const genreEl = document.getElementById('filter-genre');
  genreEl.innerHTML = '<option value="">-- Svi --</option>';
  Array.from(genres).sort().forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    genreEl.appendChild(opt);
  });
}

function prikaziStranicu() {
  const start = currentPage * pageSize;
  const slice = displayedFilms.slice(start, start + pageSize);
  prikaziTablicu(slice, true);
  const totalPages = Math.max(1, Math.ceil(displayedFilms.length / pageSize));
  document.getElementById('page-info').textContent = `${currentPage + 1}/${totalPages}`;
}

function filtriraj() {
  const genre = document.getElementById('filter-genre').value;
  const yearFrom = parseInt(document.getElementById('filter-year-from').value) || -Infinity;
  const yearTo = parseInt(document.getElementById('filter-year-to').value) || Infinity;
  const countryText = document.getElementById('filter-country').value.trim().toLowerCase();
  const ratingMin = parseFloat(document.getElementById('filter-rating').value) || 0;

  const countries = countryText
    ? countryText.split(',').map(s => s.trim().toLowerCase())
    : [];

  const filtrirano = sviFilmovi.filter(f => {
    const matchGenre = !genre || f.genre.split(';').includes(genre);
    const matchYear = f.year >= yearFrom && f.year <= yearTo;
    const matchRating = f.avg_vote >= ratingMin;
    const matchCountry = !countries.length ||
      countries.some(c => f.country.map(x => x.toLowerCase()).includes(c));
    return matchGenre && matchYear && matchRating && matchCountry;
  });

  displayedFilms = filtrirano;
  currentPage = 0;
  prikaziStranicu();
}

function prikaziTablicu(filmovi, allowAdd) {
  const tbody = document.querySelector('#filmovi-tablica tbody');
  tbody.innerHTML = '';
  filmovi.forEach((f, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${f.title}</td>
      <td>${f.year}</td>
      <td>${f.genre}</td>
      <td>${f.duration} min</td>
      <td>${f.country.join(', ')}</td>
      <td>${f.avg_vote}</td>
      <td>${allowAdd ? `<button data-idx="${idx}">Dodaj</button>` : ''}</td>
    `;
    if (allowAdd) {
      tr.querySelector('button').addEventListener('click', () => dodajUKosaricu(f));
    }
    tbody.appendChild(tr);
  });
  osvjeziKosaricu();
}

function dodajUKosaricu(film) {
  if (!kosarica.includes(film)) {
    kosarica.push(film);
    osvjeziKosaricu();
  } else {
    alert('Film je već u košarici!');
  }
}

function osvjeziKosaricu() {
  const lista = document.getElementById('lista-kosarice');
  lista.innerHTML = '';
  kosarica.forEach((f, i) => {
    const li = document.createElement('li');
    li.textContent = f.title;
    const btn = document.createElement('button');
    btn.textContent = 'Ukloni';
    btn.addEventListener('click', () => {
      kosarica.splice(i, 1);
      osvjeziKosaricu();
    });
    li.appendChild(btn);
    lista.appendChild(li);
  });
}

function setupListeners() {
  // Slideri za godine
  const fromInput = document.getElementById('filter-year-from');
  const toInput = document.getElementById('filter-year-to');
  const fromDisplay = document.getElementById('year-from-value');
  const toDisplay = document.getElementById('year-to-value');
  fromDisplay.textContent = fromInput.value;
  toDisplay.textContent = toInput.value;
  fromInput.addEventListener('input', () => fromDisplay.textContent = fromInput.value);
  toInput.addEventListener('input', () => toDisplay.textContent = toInput.value);

  document.getElementById('primijeni-filtere').addEventListener('click', filtriraj);
  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 0) { currentPage--; prikaziStranicu(); }
  });
  document.getElementById('next-page').addEventListener('click', () => {
    if ((currentPage + 1) * pageSize < displayedFilms.length) {
      currentPage++; prikaziStranicu();
    }
  });
  document.getElementById('potvrdi-kosaricu').addEventListener('click', () => {
    if (!kosarica.length) return alert('Košarica je prazna!');
    alert(`Uspješno ste dodali ${kosarica.length} filmova u svoju košaricu za vikend maraton!`);
    kosarica = []; osvjeziKosaricu();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setupListeners();
  fetchData();
});
