document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Logic
    const openMenuBtn = document.getElementById('openMenu');
    const closeMenuBtn = document.getElementById('closeMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('menuOverlay');

    if (openMenuBtn && closeMenuBtn && mobileMenu && menuOverlay) {
        const toggleMenu = () => {
            mobileMenu.classList.toggle('active');
            menuOverlay.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        };

        openMenuBtn.addEventListener('click', toggleMenu);
        closeMenuBtn.addEventListener('click', toggleMenu);
        menuOverlay.addEventListener('click', toggleMenu);
    }
    const CartManager = {
        init() {
            this.cart = JSON.parse(localStorage.getItem('cart')) || [];
            this.updateBadge();
            this.bindAddToCart();
            if (document.querySelector('.cart-table')) {
                this.renderCart();
            }

            // Real-time cross tab sync
            window.addEventListener('storage', (e) => {
                if (e.key === 'cart') {
                    this.cart = JSON.parse(e.newValue) || [];
                    this.updateBadge();
                    if (document.querySelector('.cart-table')) {
                        this.renderCart();
                    }
                }
            });
        },

        save() {
            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateBadge();
        },

        updateBadge() {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            document.querySelectorAll('.cart-badge').forEach(badge => {
                badge.innerText = totalItems;
            });
        },

        bindAddToCart() {
            const addToCartBtns = document.querySelectorAll('.add-to-cart');
            addToCartBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const card = e.target.closest('.product-card');
                    if(!card) return;
                    
                    const nameTag = card.querySelector('h3');
                    if(!nameTag) return;
                    const name = nameTag.innerText;

                    const priceTag = card.querySelector('.price');
                    const price = priceTag ? parseInt(priceTag.innerText.replace(/[^0-9]/g, '')) : 0;

                    const imgEl = card.querySelector('.product-image');
                    const bgStyle = imgEl ? imgEl.style.backgroundImage : "url('assets/img/default.jpg')";
                    // Extact string from url('...')
                    const match = bgStyle.match(/url\(['"]?(.*?)['"]?\)/i);
                    const imgUrl = match ? match[1] : '';

                    this.addItem(name, price, imgUrl);
                    
                    // Visual feedback
                    const originalText = btn.innerText;
                    btn.innerText = 'Added! ✓';
                    btn.classList.add('active');
                    btn.style.backgroundColor = '#22c55e';
                    btn.style.color = 'white';
                    btn.style.borderColor = '#22c55e';

                    setTimeout(() => {
                        btn.innerText = originalText;
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                        btn.style.borderColor = '';
                    }, 2000);
                });
            });
        },

        addItem(name, price, image) {
            const existing = this.cart.find(item => item.name === name);
            if (existing) {
                existing.quantity += 1;
            } else {
                this.cart.push({ name, price, image, quantity: 1 });
            }
            this.save();
        },

        updateQuantity(name, change) {
            const item = this.cart.find(item => item.name === name);
            if (item) {
                item.quantity += change;
                if (item.quantity <= 0) {
                    this.removeItem(name);
                } else {
                    this.save();
                    this.renderCart();
                }
            }
        },

        removeItem(name) {
            this.cart = this.cart.filter(item => item.name !== name);
            this.save();
            this.renderCart();
        },

        renderCart() {
            const tbody = document.querySelector('.cart-table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (this.cart.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 2rem;">Giỏ hàng trống</td></tr>';
                this.updateSummary(0);
                return;
            }

            let subtotal = 0;

            this.cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="cart-item-detail">
                            <div class="cart-item-img" style="background-image: url('${item.image}');"></div>
                            <div class="cart-item-info">
                                <h4>${item.name}</h4>
                                <button class="remove-btn" data-name="${item.name}"><span class="material-symbols-outlined">delete</span> Remove</button>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="qty-input">
                            <button class="qty-btn dec" data-name="${item.name}">-</button>
                            <input type="number" value="${item.quantity}" readonly style="width: 40px; text-align: center; border: 1px solid #ddd; border-radius: 4px;">
                            <button class="qty-btn inc" data-name="${item.name}">+</button>
                        </div>
                    </td>
                    <td>${item.price.toLocaleString()}đ</td>
                    <td>${itemTotal.toLocaleString()}đ</td>
                `;
                tbody.appendChild(tr);
            });

            // Bind events
            tbody.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.removeItem(e.target.closest('.remove-btn').dataset.name));
            });
            tbody.querySelectorAll('.qty-btn.dec').forEach(btn => {
                btn.addEventListener('click', (e) => this.updateQuantity(e.target.dataset.name, -1));
            });
            tbody.querySelectorAll('.qty-btn.inc').forEach(btn => {
                btn.addEventListener('click', (e) => this.updateQuantity(e.target.dataset.name, 1));
            });

            this.updateSummary(subtotal);
        },

        updateSummary(subtotal) {
            const summaryContainer = document.querySelector('.cart-summary');
            if (!summaryContainer) return;
            
            const shipping = subtotal > 0 ? 15000 : 0;
            const discount = subtotal > 0 && this.cart.length >= 3 ? 5000 : 0;
            const total = subtotal + shipping - discount;

            summaryContainer.innerHTML = `
                <h2>Tạm Tính</h2>
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString()}đ</span>
                </div>
                <div class="summary-row">
                    <span>Shipping Cost:</span>
                    <span>${shipping.toLocaleString()}đ</span>
                </div>
                <div class="summary-row">
                    <span>Combo Discount:</span>
                    <span>- ${discount.toLocaleString()}đ</span>
                </div>
                <div class="summary-row summary-total">
                    <span>Total:</span>
                    <span>${total.toLocaleString()}đ</span>
                </div>
                <button class="btn btn-primary btn-large mt-2 checkout-btn" ${subtotal === 0 ? 'disabled' : ''}>Thanh Toán Ngay</button>
                <div class="payment-methods mt-2">
                    <span class="material-symbols-outlined">payments</span>
                    <span class="material-symbols-outlined">credit_card</span>
                    <span class="material-symbols-outlined">account_balance_wallet</span>
                </div>
            `;
            
            const checkoutBtn = summaryContainer.querySelector('.checkout-btn');
            if(checkoutBtn) {
                checkoutBtn.addEventListener('click', () => {
                    alert('Chức năng thanh toán đang được phát triển!');
                });
            }
        }
    };
    
    // Initialize Cart Logic globally
    CartManager.init();

    // Contact Form Logic
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerText;
            
            btn.innerText = 'Sending...';
            btn.disabled = true;

            setTimeout(() => {
                alert('Cảm ơn bạn đã liên hệ! Bân Xiển sẽ phản hồi trong giây lát.');
                btn.innerText = 'Sent Successfully!';
                contactForm.reset();
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }, 3000);
            }, 1000);
        });
    }

    // Smooth scroll for anchors (if any)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
