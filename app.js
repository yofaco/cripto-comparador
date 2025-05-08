document.addEventListener("DOMContentLoaded", async function() {
    // Elementos del DOM
    const elements = {
        search: document.getElementById("crypto-search"),
        results: document.getElementById("search-results"),
        btcMarketCap: document.getElementById("btc-marketcap"),
        currentMarketCap: document.getElementById("current-marketcap"),
        currentPrice: document.getElementById("current-price"),
        hypotheticalPrice: document.getElementById("hypothetical-price"),
        updateTime: document.getElementById("update-time")
    };

    // Estado de la aplicación
    let state = {
        btcMarketCap: 0,
        allCryptos: [],
        loading: false
    };

    // Inicialización
    try {
        state.loading = true;
        showLoading(true);
        
        // Cargar datos
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100');
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        state.allCryptos = data;
        
        // Obtener datos de Bitcoin
        const bitcoin = data.find(c => c.id === 'bitcoin');
        if (bitcoin) {
            state.btcMarketCap = bitcoin.market_cap;
            elements.btcMarketCap.textContent = formatCurrency(bitcoin.market_cap);
        }
        
        // Configurar eventos
        elements.search.addEventListener("input", handleSearch);
        updateDateTime();
        
    } catch (error) {
        console.error("Error:", error);
        showError("Error al cargar datos. Intenta recargar la página.");
    } finally {
        state.loading = false;
        showLoading(false);
    }

    function handleSearch() {
        const term = this.value.toLowerCase().trim();
        if (term.length < 2) {
            elements.results.style.display = "none";
            return;
        }
        
        const results = state.allCryptos.filter(crypto => 
            crypto.name.toLowerCase().includes(term) || 
            crypto.symbol.toLowerCase().includes(term)
        ).slice(0, 5);
        
        displayResults(results);
    }

    function displayResults(results) {
        elements.results.innerHTML = results.map(crypto => `
            <div class="result-item" data-id="${crypto.id}">
                ${crypto.name} (${crypto.symbol.toUpperCase()}) - ${formatCurrency(crypto.current_price)}
            </div>
        `).join("");
        
        // Añadir event listeners a cada resultado
        document.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', function() {
                const cryptoId = this.getAttribute('data-id');
                selectCrypto(cryptoId);
            });
        });
        
        elements.results.style.display = "block";
    }

    // Función nueva para manejar la selección
    function selectCrypto(cryptoId) {
        const selectedCrypto = state.allCryptos.find(c => c.id === cryptoId);
        if (!selectedCrypto) return;
        
        // Ocultar resultados de búsqueda
        elements.results.style.display = "none";
        
        // Actualizar el campo de búsqueda
        elements.search.value = selectedCrypto.name;
        
        // Calcular valores
        calculateResults(selectedCrypto);
    }

    // Función nueva para realizar los cálculos
    function calculateResults(crypto) {
        // Actualizar valores en la UI
        elements.currentMarketCap.textContent = formatCurrency(crypto.market_cap);
        elements.currentPrice.textContent = formatCurrency(crypto.current_price);
        
        // Calcular precio hipotético
        if (state.btcMarketCap > 0 && crypto.market_cap > 0) {
            const hypotheticalPrice = (crypto.current_price * state.btcMarketCap) / crypto.market_cap;
            elements.hypotheticalPrice.textContent = formatCurrency(hypotheticalPrice);
        } else {
            elements.hypotheticalPrice.textContent = "--";
        }
        
        // Actualizar fecha/hora
        updateDateTime();
    }

    function formatCurrency(value) {
        if (!value) return "--";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(value);
    }

    function updateDateTime() {
        elements.updateTime.textContent = new Date().toLocaleString();
    }

    function showLoading(show) {
        const loader = document.getElementById("loader") || createLoader();
        loader.style.display = show ? "block" : "none";
    }

    function createLoader() {
        const loader = document.createElement("div");
        loader.id = "loader";
        loader.innerHTML = "Cargando datos...";
        document.body.appendChild(loader);
        return loader;
    }

    function showError(message) {
        const errorEl = document.createElement("div");
        errorEl.className = "error-message";
        errorEl.textContent = message;
        document.body.appendChild(errorEl);
        setTimeout(() => errorEl.remove(), 5000);
    }
});
