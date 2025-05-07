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
    let filteredCryptos = [];
    
    // Inicialización
    fetchCryptoData();
    setupEventListeners();
    updateDateTime();
    
    // Configurar event listeners
    function setupEventListeners() {
        cryptoSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            if (searchTerm.length > 1) {
                filterCryptos(searchTerm);
            } else {
                clearSearchResults();
            }
        });
        
        // Cerrar resultados al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-container')) {
                clearSearchResults();
            }
        });
    }
    
    // Filtrar criptomonedas según búsqueda
    function filterCryptos(searchTerm) {
        filteredCryptos = allCryptos.filter(crypto => 
            crypto.name.toLowerCase().includes(searchTerm) || 
            crypto.symbol.toLowerCase().includes(searchTerm)
            .slice(0, 10); // Limitar a 10 resultados
        
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
                    <span class="price">$${crypto.current_price.toLocaleString()}</span>
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
    
    // Obtener datos de criptomonedas
    async function fetchCryptoData() {
        try {
            // Obtener Bitcoin primero
            const btcResponse = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
            const btcData = await btcResponse.json();
            btcMarketCap = btcData.market_data.market_cap.usd;
            btcMarketCapEl.textContent = formatCurrency(btcMarketCap);
            
            // Obtener lista de las 200 principales criptomonedas
            const listResponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false');
            allCryptos = await listResponse.json();
            
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Error al cargar datos. Por favor intenta recargar la página.');
        }
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
        if (!value) return '$--';
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
    }
    
    // Actualizar fecha y hora
    function updateDateTime() {
        const now = new Date();
        updateTimeEl.textContent = now.toLocaleString();
    }
});
