/* ==============================
   TerraForma Studio — Main Script
   "Roots of Heaven" / «Корни Неба»
============================== */

let productData = null;
let cartQty = 0;

// ──────────────────────────────
// Init
// ──────────────────────────────
async function initApp() {
    try {
        const res = await fetch('data.json');
        const data = await res.json();
        productData = data.product;

        fillHeader(data);
        fillAbout(data);
        fillProduct(data);
        fillFooter(data);
        initCart(data);
        initQtyInline(data);
        createParticles();
    } catch (err) {
        console.error('Ошибка загрузки данных:', err);
    }
}

// ──────────────────────────────
// Header
// ──────────────────────────────
function fillHeader(data) {
    const c = data.company;
    // Keep the SVG icon, just update text portion
    const logoEl = document.getElementById('company-name');
    const iconSpan = logoEl.querySelector('.logo-icon');
    logoEl.textContent = '';
    if (iconSpan) logoEl.appendChild(iconSpan);
    logoEl.appendChild(document.createTextNode(' ' + c.name));

    document.getElementById('phone-link').textContent = c.contacts.phone;
    document.getElementById('phone-link').href = `tel:${c.contacts.phone.replace(/\D/g, '')}`;
}

// ──────────────────────────────
// About / Concept
// ──────────────────────────────
function fillAbout(data) {
    document.getElementById('company-concept').textContent = data.company.concept;
}

// ──────────────────────────────
// Product Card
// ──────────────────────────────
function fillProduct(data) {
    const p = data.product;
    document.getElementById('product-name').textContent = p.name;
    document.getElementById('product-tagline').textContent = p.tagline || '';
    document.getElementById('product-desc').textContent = p.description;
    document.getElementById('product-price').textContent = p.price.toLocaleString('ru-RU');
    document.getElementById('currency').textContent = p.currency;

    // Features list
    const ul = document.getElementById('product-features');
    (p.features || []).forEach(f => {
        const li = document.createElement('li');
        li.textContent = f;
        ul.appendChild(li);
    });
}

// ──────────────────────────────
// Inline Qty on Product Card
// ──────────────────────────────
function initQtyInline(data) {
    const input = document.getElementById('qty-inline');
    const minusB = document.getElementById('minus-inline');
    const plusB = document.getElementById('plus-inline');

    minusB.onclick = () => { if (+input.value > 1) input.value = +input.value - 1; };
    plusB.onclick = () => { input.value = +input.value + 1; };

    document.getElementById('add-to-cart').onclick = () => {
        const qty = Math.max(1, parseInt(input.value) || 1);
        addToCart(qty);
    };
}

// ──────────────────────────────
// Cart Logic
// ──────────────────────────────
function addToCart(qty) {
    cartQty += qty;
    updateCartBadge();
    updateCartSection();
    updateCartModal();
    showToast(`«${productData.name}» добавлена в корзину (${qty} шт.)`);
    // Scroll hint
    smoothTo('cart-section');
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    badge.textContent = cartQty;
    badge.classList.toggle('visible', cartQty > 0);
}

function updateCartSection() {
    const emptyEl = document.getElementById('cart-empty-state');
    const filledEl = document.getElementById('cart-filled-state');

    if (cartQty === 0) {
        emptyEl.style.display = 'block';
        filledEl.style.display = 'none';
        return;
    }

    emptyEl.style.display = 'none';
    filledEl.style.display = 'block';

    // Fill static cart info
    document.getElementById('cart-item-name').textContent = productData.name;
    document.getElementById('cart-img').src = productData.image;

    // Quantity controls in cart section
    const qInput = document.getElementById('quantity');
    const minusB = document.getElementById('minus');
    const plusB = document.getElementById('plus');

    qInput.value = cartQty;

    minusB.onclick = () => {
        if (cartQty > 1) {
            cartQty--;
            syncCartDisplay();
        } else {
            // Remove from cart
            cartQty = 0;
            updateCartBadge();
            updateCartSection();
            updateCartModal();
        }
    };

    plusB.onclick = () => {
        cartQty++;
        syncCartDisplay();
    };

    qInput.oninput = () => {
        const v = parseInt(qInput.value);
        if (!isNaN(v) && v > 0) {
            cartQty = v;
            syncCartDisplay();
        }
    };

    syncCartDisplay();
}

function syncCartDisplay() {
    const price = productData.price;

    // Update inputs
    document.getElementById('quantity').value = cartQty;
    document.getElementById('summary-qty').textContent = cartQty;

    // Line price
    const lineTotal = price * cartQty;
    document.getElementById('item-line-price').textContent = lineTotal.toLocaleString('ru-RU');
    document.getElementById('total-sum').textContent = lineTotal.toLocaleString('ru-RU');
    document.getElementById('grand-total').textContent = lineTotal.toLocaleString('ru-RU');

    updateCartBadge();
    updateCartModal();
}

// ──────────────────────────────
// Cart Modal (drawer)
// ──────────────────────────────
function updateCartModal() {
    const body = document.getElementById('cart-modal-body');
    const footer = document.getElementById('cart-modal-footer');
    const total = document.getElementById('modal-total');

    if (cartQty === 0) {
        body.innerHTML = '<p class="cart-modal-empty">Корзина пуста</p>';
        footer.style.display = 'none';
        return;
    }

    const lineTotal = (productData.price * cartQty).toLocaleString('ru-RU');
    body.innerHTML = `
        <div class="modal-cart-row">
            <img src="${productData.image}" alt="${productData.name}">
            <div class="modal-cart-info">
                <div class="modal-cart-name">${productData.name}</div>
                <div class="modal-cart-qty">${cartQty} шт.</div>
            </div>
            <div class="modal-cart-price">${lineTotal} ${productData.currency}</div>
        </div>`;

    total.innerHTML = `Итого: <strong>${lineTotal} ${productData.currency}</strong>`;
    footer.style.display = 'flex';
}

document.getElementById('cart-toggle-btn').onclick = openCartModal;

function openCartModal() {
    document.getElementById('cart-overlay').classList.add('open');
    document.getElementById('cart-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCartModal() {
    document.getElementById('cart-overlay').classList.remove('open');
    document.getElementById('cart-modal').classList.remove('open');
    document.body.style.overflow = '';
}

// ──────────────────────────────
// Order Form
// ──────────────────────────────
function initCart() {
    document.getElementById('order-form').onsubmit = e => {
        e.preventDefault();
        const name = document.getElementById('input-name').value.trim();
        const phone = document.getElementById('input-phone').value.trim();

        if (!name || !phone) {
            showToast('Пожалуйста, заполните имя и телефон');
            return;
        }

        // Reset
        cartQty = 0;
        updateCartBadge();
        updateCartSection();
        updateCartModal();
        e.target.reset();
        showToast(`Заказ оформлен! Мы свяжемся с вами, ${name}.`);
    };
}

// ──────────────────────────────
// Footer
// ──────────────────────────────
function fillFooter(data) {
    const c = data.company;
    document.getElementById('footer-logo').textContent = c.name;
    document.getElementById('footer-phone').textContent = c.contacts.phone;
    document.getElementById('footer-phone').href = `tel:${c.contacts.phone.replace(/\D/g, '')}`;
    document.getElementById('footer-email').textContent = c.contacts.email;
    document.getElementById('footer-email').href = `mailto:${c.contacts.email}`;

    const div = document.getElementById('team-links');
    data.team.forEach(member => {
        const a = document.createElement('a');
        a.href = member.vk;
        a.textContent = member.name;
        a.target = '_blank';
        a.rel = 'noopener';
        div.appendChild(a);
    });
}

// ──────────────────────────────
// Gallery thumbs
// ──────────────────────────────
function setMainImg(thumb) {
    document.getElementById('product-img').src = thumb.src;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}

// ──────────────────────────────
// Blueprint Carousel Logic
// ──────────────────────────────
function initCarousel() {
    const track = document.getElementById('bp-carousel-track');
    const slides = document.querySelectorAll('.bp-slide');
    const btnPrev = document.getElementById('bp-prev');
    const btnNext = document.getElementById('bp-next');
    const dotsContainer = document.getElementById('bp-dots');
    const curEl = document.getElementById('bp-current');
    const totEl = document.getElementById('bp-total');

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    const total = slides.length;
    totEl.textContent = total;

    // Create dots
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'bp-dot';
        dot.setAttribute('aria-label', `Слайд ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });
    const dots = document.querySelectorAll('.bp-dot');

    function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        curEl.textContent = currentIndex + 1;
        dots.forEach((d, i) => {
            d.classList.toggle('active', i === currentIndex);
        });
        
        // Hide/show arrows at ends
        btnPrev.style.opacity = currentIndex === 0 ? '0.3' : '1';
        btnPrev.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
        
        btnNext.style.opacity = currentIndex === total - 1 ? '0.3' : '1';
        btnNext.style.pointerEvents = currentIndex === total - 1 ? 'none' : 'auto';
    }

    function goToSlide(index) {
        if (index < 0 || index >= total) return;
        currentIndex = index;
        updateCarousel();
    }

    btnPrev.addEventListener('click', () => goToSlide(currentIndex - 1));
    btnNext.addEventListener('click', () => goToSlide(currentIndex + 1));

    // Swipe support
    let startX = 0;
    let isSwiping = false;

    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwiping = true;
        track.style.transition = 'none';
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        
        // Add some resistance at the edges
        let translateX = -(currentIndex * 100) - (diff / track.offsetWidth * 100);
        if (currentIndex === 0 && diff < 0) {
            translateX = -(diff / track.offsetWidth * 30);
        } else if (currentIndex === total - 1 && diff > 0) {
            translateX = -(currentIndex * 100) - (diff / track.offsetWidth * 30);
        }
        
        track.style.transform = `translateX(${translateX}%)`;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) { // Threshold for swipe
            if (diff > 0 && currentIndex < total - 1) {
                currentIndex++;
            } else if (diff < 0 && currentIndex > 0) {
                currentIndex--;
            }
        }
        updateCarousel();
    });

    // Fullscreen viewer
    slides.forEach(slide => {
        slide.addEventListener('click', () => {
            const img = slide.querySelector('img');
            const title = slide.getAttribute('data-title');
            
            document.getElementById('bp-fs-img').src = img.src;
            document.getElementById('bp-fs-title').textContent = title;
            document.getElementById('bp-fullscreen').classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    });

    updateCarousel();
}

function closeBpFullscreen(e) {
    if (e.target.id === 'bp-fullscreen' || e.target.classList.contains('modal-close') || e.target.id === 'bp-fs-img') {
        document.getElementById('bp-fullscreen').classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => {
            document.getElementById('bp-fs-img').src = '';
        }, 300);
    }
}

// Close fullscreen on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const fs = document.getElementById('bp-fullscreen');
        if (fs && fs.classList.contains('open')) {
            fs.classList.remove('open');
            document.body.style.overflow = '';
        }
    }
});

// ──────────────────────────────
// Toast notification
// ──────────────────────────────
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ──────────────────────────────
// Smooth scroll helper
// ──────────────────────────────
function smoothTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ──────────────────────────────
// Header scroll effect
// ──────────────────────────────
window.addEventListener('scroll', () => {
    const header = document.getElementById('site-header');
    header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ──────────────────────────────
// Hero parallax subtle
// ──────────────────────────────
const heroImg = document.getElementById('hero-img');
heroImg.addEventListener('load', () => heroImg.classList.add('loaded'));
if (heroImg.complete) heroImg.classList.add('loaded');

window.addEventListener('scroll', () => {
    const offset = window.scrollY;
    if (offset < window.innerHeight) {
        heroImg.style.transform = `scale(1) translateY(${offset * 0.18}px)`;
    }
}, { passive: true });

// ──────────────────────────────
// Floating Particles (organic feel)
// ──────────────────────────────
function createParticles() {
    const container = document.getElementById('hero-particles');
    if (!container) return;

    const count = 20;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'hero-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = (Math.random() * 8) + 's';
        p.style.animationDuration = (6 + Math.random() * 6) + 's';
        p.style.width = (2 + Math.random() * 4) + 'px';
        p.style.height = p.style.width;
        // Vary the color slightly
        const hue = 90 + Math.random() * 30;
        const lightness = 40 + Math.random() * 25;
        p.style.background = `hsl(${hue}, 55%, ${lightness}%)`;
        container.appendChild(p);
    }
}

// ──────────────────────────────
// Scroll Reveal
// ──────────────────────────────
function initReveal() {
    const els = document.querySelectorAll('.section > .container > *:not(.section-label):not(.section-title), .product-card, .feature-card, .about-grid, .showcase-grid, .cart-wrap');
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.08 });

    els.forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${(i % 4) * 0.08}s`;
        obs.observe(el);
    });
}

// ──────────────────────────────
// Boot
// ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initReveal();
    initCarousel();
});
