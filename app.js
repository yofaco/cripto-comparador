document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const cryptoSearch = document.getElementById('crypto-search');
    const searchResults = document.getElementById('search-results');
    const btcMarketCapEl = document.getElementById('btc-marketcap');
    const currentMarketCapEl = document.getElementById('current-marketcap');
    const currentPriceEl = document.getElementById('current-price');
    const hypotheticalPriceEl = document.getElementById('hypothetical-price');
    const updateTimeEl = document.getElementById('update-time');
    
    // Variables globales
    let btcMarketCap = 0;
    let allCryptos = [];
    let isLoading = false;
    
    // Inicialización
    init();
    
    async function init() {
        try {
            isLoading = true;
            showLoading(true);
            await fetchCryptoData();
            setupEventListeners();
            updateDateTime();
        } catch (error) {
            showError('Error al cargar datos. Por favor intenta recargar la página.');
            console.error('Initialization error:', error);
        } finally {
            isLoading = false;
            showLoading(false);
        }
    }
    
    // Configurar event listeners
    function setupEventListeners() {
        cryptoSearch.addEventListener('input', debounce(function() {
            if (isLoading) return;
            
            const searchTerm = this.value.toLowerCase().trim();
            if (searchTerm.length > 1) {
                filterCryptos(searchTerm);
            } else {
                clearSearchResults();
            }
        }, 300));
        
        // Cerrar resultados al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-container')) {
                clearSearchResults();
            }
        });
    }
    
    // Función debounce para limitar llamadas a la API
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Filtrar criptomonedas según búsqueda
    function filterCryptos(searchTerm) {
        const filteredCryptos = allCryptos.filter(crypto => 
            crypto.name.toLowerCase().includes(searchTerm) || 
            crypto.symbol.toLowerCase().includes(searchTerm)
            .slice(0, 10);
        
        displaySearchResults(filteredCryptos);
    }
    
    // Mostrar resultados de búsqueda
    function displaySearchResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">No se encontraron resultados</div>';
        } else {
            searchResults.innerHTML = results.map(crypto => `
                <div class="search-result-item" data-id="${crypto.id}">
                    <strong>${crypto.name}</strong> (${crypto.symbol.toUpperCase()})
                    <span class="price">$${crypto.current_price?.toLocaleString() || 'N/A'}</span>
                </div>
            `).join('');
            
            // Agregar event listeners a los resultados
            document.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', function() {
                    const cryptoId = this.getAttribute('data-id');
                    const selectedCrypto = allCryptos.find(c => c.id === cryptoId);
                    if (selectedCrypto) {
                        updateResults(selectedCrypto);
                        cryptoSearch.value = selectedCrypto.name;
                        clearSearchResults();
                    }
                });
            });
        }
        searchResults.style.display = 'block';
    }
    
    // Limpiar resultados de búsqueda
    function clearSearchResults() {
        searchResults.style.display = 'none';
    }
    
    // Obtener datos de criptomonedas con reintentos
    async function fetchCryptoData() {
        try {
            // Intento 1
            let success = await tryFetch();
            if (!success) {
                // Esperar 5 segundos y reintentar
                await new Promise(resolve => setTimeout(resolve, 5000));
                success = await tryFetch();
                if (!success) throw new Error('Failed after retry');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }
    
    async function tryFetch() {
        try {
            // Obtener Bitcoin primero
            const btcResponse = await fetchWithTimeout('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false', {}, 5000);
            
            if (!btcResponse.ok) return false;
            
            const btcData = await btcResponse.json();
            btcMarketCap = btcData.market_data.market_cap.usd;
            btcMarketCapEl.textContent = formatCurrency(btcMarketCap);
            
            // Obtener lista de criptomonedas
            const listResponse = await fetchWithTimeout('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false', {}, 5000);
            
            if (!listResponse.ok) return false;
            
            allCryptos = await listResponse.json();
            return true;
        } catch (error) {
            console.error('Try fetch error:', error);
            return false;
        }
    }
    
    // Fetch con timeout
    function fetchWithTimeout(resource, options = {}, timeout = 8000) {
        return Promise.race([
            fetch(resource, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }
    
    // Actualizar resultados con la cripto seleccionada
    function updateResults(crypto) {
        const currentMarketCap = crypto.market_cap;
        const currentPrice = crypto.current_price;
        
        // Calcular precio hipotético
        const hypotheticalPrice = (currentPrice * btcMarketCap) / currentMarketCap;
        
        // Actualizar UI
        currentMarketCapEl.textContent = formatCurrency(currentMarketCap);
        currentPriceEl.textContent = formatCurrency(currentPrice);
        hypotheticalPriceEl.textContent = formatCurrency(hypotheticalPrice);
        
        updateDateTime();
    }
    
    // Formatear moneda
    function formatCurrency(value) {
        if (value === undefined || value === null) return '$--';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: value < 1 ? 6 : 2
        }).format(value);
    }
    
    // Mostrar error
    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        document.body.appendChild(errorEl);
        setTimeout(() => errorEl.remove(), 5000);
    }
    
    // Mostrar/ocultar loading
    function showLoading(show) {
        const loader = document.getElementById('loader') || createLoader();
        loader.style.display = show ? 'block' : 'none';
    }
    
    function createLoader() {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = '<div class="loader-spinner"></div><p>Cargando datos...</p>';
        document.body.appendChild(loader);
        return loader;
    }
    
    // Actualizar fecha y hora
    function updateDateTime() {
        const now = new Date();
        updateTimeEl.textContent = now.toLocaleString();
    }
});
