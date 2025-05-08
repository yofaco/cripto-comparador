// Configuración global
const config = {
    apiUrl: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100'
};

// Estado de la aplicación
const state = {
    btcData: null,
    cryptos: [],
    selectedCrypto: null
};

// Elementos del DOM
const elements = {
    searchInput: document.getElementById('crypto-search'),
    resultsContainer: document.getElementById('search-results'),
    btcMarketCap: document.getElementById('btc-marketcap'),
    currentMarketCap: document.getElementById('current-marketcap'),
    currentPrice: document.getElementById('current-price'),
    hypotheticalPrice: document.getElementById('hypothetical-price'),
    updateTime: document.getElementById('update-time')
};

// Inicialización
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        showLoading(true);
        await loadData();
        setupEventListeners();
        updateUI();
    } catch (error) {
        showError('Error al cargar datos. Recarga la página.');
        console.error('Init error:', error);
    } finally {
        showLoading(false);
    }
}

// Cargar datos de la API
async function loadData() {
    const response = await fetch(config.apiUrl);
    if (!response.ok) throw new Error('API request failed');
    
    state.cryptos = await response.json();
    state.btcData = state.cryptos.find(c => c.id === 'bitcoin');
    
    if (state.btcData) {
        elements.btcMarketCap.textContent = formatCurrency(state.btcData.market_cap);
    }
}

// Configurar eventos
function setupEventListeners() {
    // Evento de búsqueda
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Delegación de eventos para los resultados
    elements.resultsContainer.addEventListener('click', function(e) {
        const resultItem = e.target.closest('.result-item');
        if (resultItem) {
            const cryptoId = resultItem.dataset.id;
            selectCrypto(cryptoId);
        }
    });
}

// Manejar búsqueda
function handleSearch() {
    const searchTerm = this.value.trim().toLowerCase();
    
    if (searchTerm.length < 2) {
        elements.resultsContainer.style.display = 'none';
        return;
    }
    
    const results = state.cryptos.filter(crypto => 
        crypto.name.toLowerCase().includes(searchTerm) || 
        crypto.symbol.toLowerCase().includes(searchTerm)
    ).slice(0, 5);
    
    displayResults(results);
}

// Mostrar resultados
function displayResults(results) {
    elements.resultsContainer.innerHTML = results.map(crypto => `
        <div class="result-item" data-id="${crypto.id}">
            <strong>${crypto.name}</strong> (${crypto.symbol.toUpperCase()})
            <span class="price">${formatCurrency(crypto.current_price)}</span>
        </div>
    `).join('');
    
    elements.resultsContainer.style.display = results.length ? 'block' : 'none';
}

// Seleccionar criptomoneda
function selectCrypto(cryptoId) {
    state.selectedCrypto = state.cryptos.find(c => c.id === cryptoId);
    
    if (!state.selectedCrypto) return;
    
    // Actualizar UI
    elements.searchInput.value = state.selectedCrypto.name;
    elements.resultsContainer.style.display = 'none';
    updateUI();
}

// Actualizar toda la UI
function updateUI() {
    if (!state.selectedCrypto) return;
    
    elements.currentMarketCap.textContent = formatCurrency(state.selectedCrypto.market_cap);
    elements.currentPrice.textContent = formatCurrency(state.selectedCrypto.current_price);
    
    if (state.btcData && state.selectedCrypto.market_cap > 0) {
        const ratio = state.btcData.market_cap / state.selectedCrypto.market_cap;
        const hypotheticalPrice = state.selectedCrypto.current_price * ratio;
        elements.hypotheticalPrice.textContent = formatCurrency(hypotheticalPrice);
    } else {
        elements.hypotheticalPrice.textContent = '--';
    }
    
    elements.updateTime.textContent = new Date().toLocaleString();
}

// Función debounce para mejor performance
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Formatear moneda
function formatCurrency(value) {
    if (!value && value !== 0) return '--';
    const digits = value < 1 ? 6 : 2;  // 6 decimales si <1, sino 2
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: digits
    }).format(value);
}

// Mostrar loading
function showLoading(show) {
    const loader = document.getElementById('loader') || createLoader();
    loader.style.display = show ? 'flex' : 'none';
}

function createLoader() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = '<div class="loader-spinner"></div>';
    document.body.appendChild(loader);
    return loader;
}

// Mostrar errores
function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    document.body.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 5000);
}
// Función mejorada para copiar direcciones
function setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const address = this.getAttribute('data-address');
            const addressElement = this.parentElement.querySelector('.wallet-address');
            
            try {
                await navigator.clipboard.writeText(address);
                
                // Animación de copiado
                const originalText = this.textContent;
                this.textContent = '✓ Copiado!';
                this.style.background = '#4CAF50';
                
                // Resaltar la dirección brevemente
                addressElement.style.color = '#4CAF50';
                addressElement.style.fontWeight = 'bold';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = '';
                    addressElement.style.color = '';
                    addressElement.style.fontWeight = '';
                }, 2000);
                
            } catch (err) {
                console.error('Error al copiar:', err);
                // Fallback para navegadores antiguos
                const textArea = document.createElement('textarea');
                textArea.value = address;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.textContent = 'Copiado (manual)';
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000);
            }
        });
    });
}

// Llama a la función cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', setupCopyButtons);
