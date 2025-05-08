document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const cryptoSearch = document.getElementById('crypto-search');
    const btcMarketCapEl = document.getElementById('btc-marketcap');
    const currentMarketCapEl = document.getElementById('current-marketcap');
    const currentPriceEl = document.getElementById('current-price');
    const hypotheticalPriceEl = document.getElementById('hypothetical-price');
    const updateTimeEl = document.getElementById('update-time');
    
    // Estado de la aplicación
    let btcMarketCap = 0;
    let allCryptos = [];
    let isLoading = false;
    
    // Inicialización
    init();
    
    async function init() {
        try {
            showLoading(true);
            await fetchCryptoData();
            setupEventListeners();
            updateDateTime();
        } catch (error) {
            showError('Error al cargar datos. Por favor recarga la página.');
            console.error('Error:', error);
        } finally {
            showLoading(false);
        }
    }
    
    // Configurar event listeners
    function setupEventListeners() {
        cryptoSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            if (searchTerm.length > 2) {
                filterCryptos(searchTerm);
            } else {
                clearSearchResults();
            }
        });
    }
    
    // Función mejorada para obtener datos
    async function fetchCryptoData() {
        // Primero intentamos con CoinGecko
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1');
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Obtenemos Bitcoin específicamente
            const btc = data.find(c => c.id === 'bitcoin');
            if (btc) {
                btcMarketCap = btc.market_cap;
                btcMarketCapEl.textContent = formatCurrency(btcMarketCap);
            }
            
            allCryptos = data;
            return true;
            
        } catch (error) {
            console.error('Error con CoinGecko:', error);
            showError('Servicio no disponible temporalmente. Intenta más tarde.');
            return false;
        }
    }
    
    // Mostrar/ocultar loading
    function showLoading(show) {
        const loader = document.getElementById('loader') || createLoader();
        loader.style.display = show ? 'flex' : 'none';
    }
    
    function createLoader() {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <p>Cargando datos de criptomonedas...</p>
        `;
        document.body.appendChild(loader);
        return loader;
    }
    
    // Mostrar errores
    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        `;
        document.body.appendChild(errorEl);
        setTimeout(() => errorEl.remove(),
