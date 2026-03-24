'use strict';

// ===== ДАННЫЕ ТОВАРОВ =====
const PRODUCTS = [
  { id: 1,  title: 'Беспроводные наушники',  category: 'electronics', price: 4990,  oldPrice: 6990,  rating: 4.7, reviews: 312, emoji: '🎧' },
  { id: 2,  title: 'Смарт-часы Pro',          category: 'electronics', price: 12990, oldPrice: 17000, rating: 4.5, reviews: 198, emoji: '⌚' },
  { id: 3,  title: 'Bluetooth-колонка',        category: 'electronics', price: 3490,  oldPrice: null,  rating: 4.3, reviews: 87,  emoji: '🔊' },
  { id: 4,  title: 'Игровая мышь',             category: 'electronics', price: 2290,  oldPrice: 3200,  rating: 4.6, reviews: 541, emoji: '🖱️' },
  { id: 5,  title: 'Механическая клавиатура',  category: 'electronics', price: 7800,  oldPrice: null,  rating: 4.8, reviews: 223, emoji: '⌨️' },
  { id: 6,  title: 'Куртка зимняя',            category: 'clothing',    price: 5990,  oldPrice: 8500,  rating: 4.4, reviews: 164, emoji: '🧥' },
  { id: 7,  title: 'Кроссовки беговые',        category: 'clothing',    price: 8990,  oldPrice: 12000, rating: 4.6, reviews: 290, emoji: '👟' },
  { id: 8,  title: 'Джинсы slim fit',          category: 'clothing',    price: 3290,  oldPrice: 4200,  rating: 4.1, reviews: 75,  emoji: '👖' },
  { id: 9,  title: 'Шапка вязаная',            category: 'clothing',    price: 890,   oldPrice: null,  rating: 3.9, reviews: 42,  emoji: '🧢' },
  { id: 10, title: 'Рюкзак городской',         category: 'clothing',    price: 2790,  oldPrice: 3500,  rating: 4.5, reviews: 188, emoji: '🎒' },
  { id: 11, title: 'Кофемашина',               category: 'home',        price: 15990, oldPrice: 21000, rating: 4.7, reviews: 376, emoji: '☕' },
  { id: 12, title: 'Настольная лампа',         category: 'home',        price: 1990,  oldPrice: null,  rating: 4.2, reviews: 93,  emoji: '💡' },
  { id: 13, title: 'Набор для барбекю',        category: 'home',        price: 4490,  oldPrice: 5800,  rating: 4.3, reviews: 57,  emoji: '🍖' },
  { id: 14, title: 'Комнатное растение',       category: 'home',        price: 1290,  oldPrice: null,  rating: 4.8, reviews: 201, emoji: '🌿' },
  { id: 15, title: 'Гантели 10 кг (пара)',     category: 'sport',       price: 3990,  oldPrice: 5000,  rating: 4.6, reviews: 132, emoji: '🏋️' },
  { id: 16, title: 'Коврик для йоги',          category: 'sport',       price: 1590,  oldPrice: 2200,  rating: 4.4, reviews: 265, emoji: '🧘' },
  { id: 17, title: 'Велосипед горный',         category: 'sport',       price: 34990, oldPrice: 42000, rating: 4.5, reviews: 88,  emoji: '🚴' },
  { id: 18, title: 'Скакалка скоростная',      category: 'sport',       price: 790,   oldPrice: null,  rating: 4.0, reviews: 54,  emoji: '🪢' },
];

// ===== СОСТОЯНИЕ =====
let state = {
  category: 'all',
  search: '',
  maxPrice: 50000,
  minRating: 0,
  sort: 'default',
  cart: {},
};

// ===== DOM =====
const grid          = document.getElementById('productsGrid');
const resultsCount  = document.getElementById('resultsCount');
const searchInput   = document.getElementById('searchInput');
const searchBtn     = document.getElementById('searchBtn');
const priceRange    = document.getElementById('priceRange');
const priceLabel    = document.getElementById('priceLabel');
const ratingFilter  = document.getElementById('ratingFilter');
const sortFilter    = document.getElementById('sortFilter');
const resetFilters  = document.getElementById('resetFilters');
const cartBtn       = document.getElementById('cartBtn');
const cartPanel     = document.getElementById('cartPanel');
const cartOverlay   = document.getElementById('cartOverlay');
const closeCart     = document.getElementById('closeCart');
const cartItems     = document.getElementById('cartItems');
const cartFooter    = document.getElementById('cartFooter');
const cartTotal     = document.getElementById('cartTotal');
const cartCount     = document.getElementById('cartCount');
const checkoutBtn   = document.getElementById('checkoutBtn');
const toast         = document.getElementById('toast');
const catBtns       = document.querySelectorAll('.cat-btn');

// ===== УТИЛИТЫ =====
function fmt(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function stars(r) {
  const full  = Math.floor(r);
  const half  = r - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ===== ФИЛЬТРАЦИЯ И РЕНДЕР =====
function getFiltered() {
  let list = [...PRODUCTS];

  if (state.category !== 'all')
    list = list.filter(p => p.category === state.category);

  if (state.search.trim())
    list = list.filter(p =>
      p.title.toLowerCase().includes(state.search.toLowerCase()));

  list = list.filter(p => p.price <= state.maxPrice);
  list = list.filter(p => p.rating >= state.minRating);

  if (state.sort === 'price-asc')  list.sort((a, b) => a.price - b.price);
  if (state.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (state.sort === 'rating')     list.sort((a, b) => b.rating - a.rating);

  return list;
}

function renderProducts() {
  const list = getFiltered();
  resultsCount.textContent = `Найдено товаров: ${list.length}`;

  if (!list.length) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="icon">🔍</div>
        <p>Товары не найдены. Попробуйте изменить фильтры.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const inCart  = state.cart[p.id];
    const addedCls = inCart ? ' added' : '';
    const addedTxt = inCart ? 'В корзине' : 'В корзину';
    return `
      <div class="card" data-id="${p.id}">
        <div class="card__img">${p.emoji}</div>
        <div class="card__body">
          <span class="card__category">${categoryLabel(p.category)}</span>
          <div class="card__title">${p.title}</div>
          <div class="card__rating">
            <span class="stars">${stars(p.rating)}</span>
            ${p.rating} (${p.reviews} отзывов)
          </div>
          <div class="card__footer">
            <div class="card__price">
              ${fmt(p.price)}
              ${p.oldPrice ? `<span class="old">${fmt(p.oldPrice)}</span>` : ''}
            </div>
            <button class="add-btn${addedCls}" data-id="${p.id}">${addedTxt}</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function categoryLabel(cat) {
  const map = { electronics: 'Электроника', clothing: 'Одежда', home: 'Дом и сад', sport: 'Спорт' };
  return map[cat] || cat;
}

// ===== КОРЗИНА =====
function cartTotal_() {
  return Object.values(state.cart).reduce((s, i) => s + i.price * i.qty, 0);
}

function cartQty_() {
  return Object.values(state.cart).reduce((s, i) => s + i.qty, 0);
}

function renderCart() {
  const items = Object.values(state.cart);
  cartCount.textContent = cartQty_();

  if (!items.length) {
    cartItems.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
    cartFooter.style.display = 'none';
    return;
  }

  cartFooter.style.display = '';
  cartTotal.textContent = fmt(cartTotal_());

  cartItems.innerHTML = items.map(i => `
    <div class="cart-item" data-id="${i.id}">
      <div class="cart-item__emoji">${i.emoji}</div>
      <div class="cart-item__info">
        <div class="cart-item__name">${i.title}</div>
        <div class="cart-item__price">${fmt(i.price)} × ${i.qty} = ${fmt(i.price * i.qty)}</div>
      </div>
      <div class="cart-item__controls">
        <button class="qty-btn" data-action="dec" data-id="${i.id}">−</button>
        <span class="qty-num">${i.qty}</span>
        <button class="qty-btn" data-action="inc" data-id="${i.id}">+</button>
        <button class="remove-btn" data-action="remove" data-id="${i.id}">✕</button>
      </div>
    </div>`).join('');
}

function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  if (state.cart[id]) {
    state.cart[id].qty++;
  } else {
    state.cart[id] = { ...p, qty: 1 };
  }
  renderCart();
  renderProducts();
  showToast(`"${p.title}" добавлен в корзину`);
}

function openCart() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCartFn() {
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('open');
}

// ===== СОБЫТИЯ =====
// Категории
catBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    catBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.category = btn.dataset.cat;
    renderProducts();
  });
});

// Поиск
searchBtn.addEventListener('click', () => {
  state.search = searchInput.value;
  renderProducts();
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    state.search = searchInput.value;
    renderProducts();
  }
});

// Цена
priceRange.addEventListener('input', () => {
  state.maxPrice = +priceRange.value;
  priceLabel.textContent = fmt(state.maxPrice);
  renderProducts();
});

// Рейтинг
ratingFilter.addEventListener('change', () => {
  state.minRating = +ratingFilter.value;
  renderProducts();
});

// Сортировка
sortFilter.addEventListener('change', () => {
  state.sort = sortFilter.value;
  renderProducts();
});

// Сброс
resetFilters.addEventListener('click', () => {
  state.maxPrice  = 50000;
  state.minRating = 0;
  state.sort      = 'default';
  state.search    = '';
  state.category  = 'all';
  priceRange.value = 50000;
  priceLabel.textContent = '50 000 ₽';
  ratingFilter.value = '0';
  sortFilter.value   = 'default';
  searchInput.value  = '';
  catBtns.forEach(b => b.classList.toggle('active', b.dataset.cat === 'all'));
  renderProducts();
});

// Добавление в корзину (делегирование)
grid.addEventListener('click', e => {
  const btn = e.target.closest('.add-btn');
  if (btn) addToCart(+btn.dataset.id);
});

// Управление корзиной (делегирование)
cartItems.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id     = +btn.dataset.id;
  const action = btn.dataset.action;

  if (action === 'inc') {
    state.cart[id].qty++;
  } else if (action === 'dec') {
    state.cart[id].qty--;
    if (state.cart[id].qty <= 0) delete state.cart[id];
  } else if (action === 'remove') {
    delete state.cart[id];
  }
  renderCart();
  renderProducts();
});

// Открыть / закрыть корзину
cartBtn.addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartFn);
cartOverlay.addEventListener('click', closeCartFn);

// Оформить заказ
checkoutBtn.addEventListener('click', () => {
  state.cart = {};
  renderCart();
  renderProducts();
  closeCartFn();
  showToast('Заказ оформлен! Спасибо за покупку.');
});

// ===== ИНИТ =====
renderProducts();
renderCart();
