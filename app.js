// ============================================
// CALISTHENICS ESHOP - MAIN APPLICATION LOGIC
// ============================================

class CalisthenicsShop {
    constructor() {
        this.products = [];
        this.cart = [];
        this.shopName = localStorage.getItem('shopName') || 'CALISTHENICS';
        this.csvData = localStorage.getItem('csvData');
        this.init();
    }

    // Inizializzazione
    init() {
        if (!this.csvData) {
            window.location.href = 'ini.html';
            return;
        }

        this.parseCSV();
        this.loadCart();
        this.renderHeader();
        this.setupPersistenceCheck();
    }

    // Parse CSV
    parseCSV() {
        const lines = this.csvData.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            console.error('CSV non valido');
            return;
        }

        lines.slice(1).forEach((line, index) => {
            const [brand, nomeProdotto, descrizione, immagine, prezzo] = line.split(',').map(col => col.trim());
            
            if (brand && nomeProdotto && descrizione && immagine && prezzo) {
                this.products.push({
                    id: index,
                    brand,
                    nomeProdotto,
                    descrizione,
                    immagine,
                    prezzo: parseFloat(prezzo)
                });
            }
        });
    }

    // Render Header
    renderHeader() {
        const header = document.querySelector('header');
        if (!header) return;

        const cartCount = this.cart.length;
        const cartBadgeHTML = cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : '';

        header.innerHTML = `
            <div class="shop-logo">${this.shopName}</div>
            <nav class="header-nav">
                <a href="index.html" class="nav-link">CATALOGO</a>
                <a href="cart.html" class="cart-link">
                    CARRELLO
                    ${cartBadgeHTML}
                </a>
            </nav>
        `;
    }

    // Carica carrello da localStorage
    loadCart() {
        const stored = localStorage.getItem('cartData');
        if (stored) {
            try {
                this.cart = JSON.parse(stored);
            } catch (e) {
                this.cart = [];
            }
        }
    }

    // Salva carrello
    saveCart() {
        localStorage.setItem('cartData', JSON.stringify(this.cart));
        this.renderHeader();
    }

    // Aggiungi al carrello
    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === parseInt(productId));
        if (!product) return false;

        // Ogni prodotto aggiunto è una nuova riga (non accumula quantità)
        this.cart.push({
            id: this.cart.length,
            productId: product.id,
            brand: product.brand,
            nomeProdotto: product.nomeProdotto,
            prezzo: product.prezzo,
            quantity: quantity
        });

        this.saveCart();
        return true;
    }

    // Rimuovi dal carrello
    removeFromCart(cartId) {
        this.cart = this.cart.filter((item, idx) => idx !== parseInt(cartId));
        this.saveCart();
    }

    // Aggiorna quantità
    updateQuantity(cartId, quantity) {
        const item = this.cart[parseInt(cartId)];
        if (item) {
            item.quantity = Math.max(1, parseInt(quantity));
            this.saveCart();
        }
    }

    // Calcola totale carrello
    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.prezzo * item.quantity), 0);
    }

    // Applica coupon - Sconto fisso 10%
    applyCoupon(code) {
        const lowerCode = code.trim().toLowerCase();
        
        // Coupon fisso: qualsiasi codice valido = 10% di sconto
        if (lowerCode === 'sconto' || lowerCode === 'sconto10') {
            const total = this.getCartTotal();
            
            if (total < 30) {
                return { valid: false, message: 'Spesa minima: 30€' };
            }

            const discount = (total * 10) / 100; // 10% fisso
            return { 
                valid: true, 
                percentage: 10,
                discount: discount,
                finalTotal: total - discount
            };
        }

        return { valid: false, message: 'Codice non valido. Usa: SCONTO' };
    }

    // Get prodotto per ID
    getProductById(id) {
        return this.products.find(p => p.id === parseInt(id));
    }

    // Cerca prodotti
    searchProducts(query) {
        const q = query.toLowerCase();
        return this.products.filter(p => 
            p.nomeProdotto.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q)
        );
    }

    // Setup persistenza carrello
    setupPersistenceCheck() {
        const asked = localStorage.getItem('persistenceAsked');
        if (!asked && this.cart.length > 0) {
            // Mostra il primo accesso con carrello - chiedi se mantenere
            // Questo si attiva naturalmente quando l'utente torna
        }
    }

    // Genera numero ordine
    generateOrderNumber() {
        return 'ORD-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    // Crea dato ordine per PDF
    createOrderData(customerInfo, couponDiscount = 0) {
        const orderNumber = this.generateOrderNumber();
        const total = this.getCartTotal();
        const finalTotal = total - couponDiscount;

        return {
            orderNumber,
            date: new Date().toLocaleDateString('it-IT'),
            customer: customerInfo,
            items: this.cart,
            subtotal: total,
            discount: couponDiscount,
            total: finalTotal,
            shopName: this.shopName
        };
    }
}

// Istanza globale
let shop = null;

// Inizializza al load
document.addEventListener('DOMContentLoaded', function() {
    shop = new CalisthenicsShop();
});

// Utility: Formatta prezzo
function formatPrice(price) {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

// Utility: Carica HTML da file
function loadHTML(filename) {
    return fetch(filename).then(r => r.text());
}
