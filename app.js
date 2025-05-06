document.addEventListener('DOMContentLoaded', function() {
    const cryptoSelect = document.getElementById('crypto-select');
    const btcMarketCapEl = document.getElementById('btc-marketcap');
    const currentMarketCapEl = document.getElementById('current-marketcap');
    const currentPriceEl = document.getElementById('current-price');
    const hypotheticalPriceEl = document.getElementById('hypothetical-price');
    
    let btcMarketCap = 0;
    let cryptocurrencies = [];
    
    // Cargar datos iniciales
    fetchCryptoData();
    
    // Event listener para cambios en la selección
    cryptoSelect.addEventListener('change', function() {
        const selectedId = this.value;
        if (!selectedId) return;
        
        const selectedCrypto = cryptocurrencies.find(c => c.id === selectedId);
        if (selectedCrypto) {
            updateResults(selectedCrypto);
        }
    });
    
    async function fetchCryptoData() {
        try {
            // Primero obtenemos Bitcoin para tener su market cap
            const btcResponse = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
            const btcData = await btcResponse.json();
            btcMarketCap = btcData.market_data.market_cap.usd;
            btcMarketCapEl.textContent = formatCurrency(btcMarketCap);
            
            // Luego obtenemos la lista de las principales criptomonedas
            const listResponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
            cryptocurrencies = await listResponse.json();
            
            // Llenar el select
            cryptoSelect.innerHTML = '<option value="">Selecciona una criptomoneda</option>';
            cryptocurrencies.forEach(crypto => {
                const option = document.createElement('option');
                option.value = crypto.id;
                option.textContent = `${crypto.name} (${crypto.symbol.toUpperCase()})`;
                cryptoSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error fetching data:', error);
            cryptoSelect.innerHTML = '<option value="">Error cargando datos. Intenta recargar la página.</option>';
        }
    }
    
    function updateResults(crypto) {
        const currentMarketCap = crypto.market_cap;
        const currentPrice = crypto.current_price;
        
        // Calcular precio hipotético
        const hypotheticalPrice = (currentPrice * btcMarketCap) / currentMarketCap;
        
        // Actualizar UI
        currentMarketCapEl.textContent = formatCurrency(currentMarketCap);
        currentPriceEl.textContent = formatCurrency(currentPrice);
        hypotheticalPriceEl.textContent = formatCurrency(hypotheticalPrice);
    }
    
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(value);
    }
});