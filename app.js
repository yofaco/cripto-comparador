document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const cryptoSearch = document.getElementById('crypto-search');
    const searchResults = document.getElementById('search-results');
    const btcMarketCapEl = document.getElementById('btc-marketcap');
    const currentMarketCapEl = document.getElementById('current-marketcap');
    const currentPriceEl = document.getElementById('current-price');
    const hypotheticalPriceEl = document.getElementById('hypothetical-price');
    const multiplierEl = document.getElementById('multiplier');
    const updateTimeEl = document.getElementById('update-time');
    const refreshBtn = document.getElementById('refresh-btn');
    const randomBtn = document.getElementById('random-btn');
    const top10Btn = document.getElementById('top10-btn');
    const compareBtn = document.getElementById('compare-btn');
    const shareBtn = document.getElementById('share-btn');
    
    // Variables globales
    let btcMarketCap = 0;
    let allCryptos = [];
    let filteredCryptos = [];
    let currentCrypto = null;
    
    // Inicialización
    loadData();
    setupEventListeners();
    
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
        
        // Botón de refrescar
        refreshBtn.addEventListener('click', function() {
            this.classList.add('refreshing');
            loadData().finally(() => {
                setTimeout(() => {
                    this.classList.remove('refreshing');
                }, 500);
            });
        });
        
        // Botón de cripto aleatoria
        randomBtn.addEventListener('click', function() {
            if (allCryptos.length > 0) {
                const randomIndex = Math.floor(Math.random() * allCryptos.length);
                const randomCrypto = allCryptos[randomIndex];
                cryptoSearch.value = randomCrypto.name;
                updateResults(randomCrypto);
            }
        });
        
        // Botón de top 10
        top10Btn.addEventListener('click', function() {
            if (allCryptos.length > 0) {
                const top10 = allCryptos.slice(0, 10);
                displaySearchResults(top10);
            }
        });
        
        // Botón de compartir
        shareBtn.addEventListener('click', function() {
            if (currentCrypto) {
                const message = `El precio de ${currentCrypto.name} sería ${hypotheticalPriceEl.textContent} si tuviera la capitalización de Bitcoin (${btcMarketCapEl.textContent})`;
                
                if (navigator.share) {
                    navigator.share({
                        title: 'Comparador Crypto Pro',
                        text: message,
                        url: window.location.href
                    }).catch(err => {
                        console.log('Error al compartir:', err);
                        copyToClipboard(message);
                    });
                } else {
                    copyToClipboard(message);
                }
            }
        });
    }
    
    // Cargar datos de ambas APIs
    async function loadData() {
        try {
            // Mostrar estado de carga
            btcMarketCapEl.textContent = "Actualizando...";
            if (currentCrypto) {
                currentMarketCapEl.textContent = "--";
                currentPriceEl.textContent = "--";
                hypotheticalPriceEl.textContent = "--";
                multiplierEl.textContent = "--x";
            }
            
            // Obtener datos de CoinGecko (400 criptos)
            const geckoResponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=400&page=1&sparkline=false');
            const geckoData = await geckoResponse.json();
            
            // Obtener Bitcoin para capitalización
            const btcResponse = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
            const btcData = await btcResponse.json();
            
            // Procesar datos
            btcMarketCap = btcData.market_data.market_cap.usd;
            allCryptos = geckoData;
            
            // Actualizar UI
            btcMarketCapEl.textContent = formatCurrency(btcMarketCap);
            updateDateTime();
            
            // Si ya había una cripto seleccionada, actualizar sus datos
            if (currentCrypto) {
                const updatedCrypto = allCryptos.find(c => c.id === currentCrypto.id);
                if (updatedCrypto) {
                    updateResults(updatedCrypto);
                }
            }
            
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Error al cargar datos. Por favor intenta recargar la página.');
        }
    }
    
    // Filtrar criptomonedas según búsqueda
    function filterCryptos(searchTerm) {
        filteredCryptos = allCryptos.filter(crypto => 
            crypto.name.toLowerCase().includes(searchTerm) || 
            crypto.symbol.toLowerCase().includes(searchTerm)
        ).slice(0, 15); // Limitar a 15 resultados
        
        displaySearchResults(filteredCryptos);
    }
    
    // Mostrar resultados de búsqueda
    function displaySearchResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">No se encontraron resultados</div>';
        } else {
            searchResults.innerHTML = results.map(crypto => `
                <div class="search-result-item" data-id="${crypto.id}">
                    <div>
                        <strong>${crypto.name}</strong> (${crypto.symbol.toUpperCase()})
                    </div>
                    <span class="price">$${crypto.current_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</span>
                </div>
            `).join('');
            
            // Agregar event listeners a los resultados
            document.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', function() {
                    const cryptoId = this.getAttribute('data-id');
                    const selectedCrypto = allCryptos.find(c => c.id === cryptoId);
                    if (selectedCrypto) {
                        currentCrypto = selectedCrypto;
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
    
    // Actualizar resultados con la cripto seleccionada
    function updateResults(crypto) {
        const currentMarketCap = crypto.market_cap;
        const currentPrice = crypto.current_price;
        
        // Calcular precio hipotético y multiplicador
        const hypotheticalPrice = (currentPrice * btcMarketCap) / currentMarketCap;
        const multiplier = (btcMarketCap / currentMarketCap).toFixed(2);
        
        // Actualizar UI
        currentMarketCapEl.textContent = formatCurrency(currentMarketCap);
        currentPriceEl.textContent = formatCurrency(currentPrice);
        hypotheticalPriceEl.textContent = formatCurrency(hypotheticalPrice);
        multiplierEl.textContent = `${multiplier}x`;
        
        updateDateTime();
    }
    
    // Formatear moneda
    function formatCurrency(value) {
        if (!value && value !== 0) return '$--';
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
        setTimeout(() => {
            errorEl.remove();
        }, 5000);
    }
    
    // Actualizar fecha y hora
    function updateDateTime() {
        const now = new Date();
        updateTimeEl.textContent = now.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    // Copiar al portapapeles
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showError('¡Resultados copiados al portapapeles!');
        }).catch(err => {
            showError('No se pudo copiar. Error: ' + err);
        });
    }
});
