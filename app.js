document.addEventListener("DOMContentLoaded", function() {
    // Elementos del DOM
    const cryptoSearch = document.getElementById("crypto-search");
    const searchResults = document.getElementById("search-results");
    const btcMarketCapEl = document.getElementById("btc-marketcap");
    const currentMarketCapEl = document.getElementById("current-marketcap");
    const currentPriceEl = document.getElementById("current-price");
    const hypotheticalPriceEl = document.getElementById("hypothetical-price");
    const updateTimeEl = document.getElementById("update-time");

    // Estado de la aplicación
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
            showError('Error al cargar datos. Por favor recarga la página.');
            console.error('Error de inicialización:', error);
        } finally {
            isLoading = false;
            showLoading(false);
        }
    }

    // Configurar event listeners
    function setupEventListeners() {
        cryptoSearch.addEventListener("input", function() {
            const searchTerm = this.value.toLowerCase();
            if (searchTerm.length > 2) {
                filterCryptos(searchTerm);
            } else {
                clearSearchResults();
            }
        });
    }

    // Filtrar criptomonedas
    function filterCryptos(searchTerm) {
        const filtered = allCryptos.filter(crypto => 
            crypto.name.toLowerCase().includes(searchTerm) || 
            crypto.symbol.toLowerCase().includes(searchTerm)
        );
        displaySearchResults(filtered.slice(0, 10));
    }

    // Mostrar resultados
    function displaySearchResults(results) {
        searchResults.innerHTML = results.map(crypto => `
            <div class="search-result-item" data-id="${crypto.id}">
                ${crypto.name} (${crypto.symbol.toUpperCase()})
            </div>
        `).join("");
        searchResults.style.display = "block";
    }

    // Limpiar resultados
    function clearSearchResults() {
        searchResults.style.display = "none";
    }

    // Obtener datos de la API
    async function fetchCryptoData() {
        const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100");
        const data = await response.json();
        
        // Encontrar Bitcoin
        const bitcoin = data.find(c => c.id === "bitcoin");
        if (bitcoin) {
            btcMarketCap = bitcoin.market_cap;
            btcMarketCapEl.textContent = formatCurrency(btcMarketCap);
        }
        
        allCryptos = data;
    }

    // Mostrar loading
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

    // Mostrar errores
    function showError(message) {
        alert(message); // Puedes reemplazar esto con un mejor sistema de notificaciones
    }

    // Formatear moneda
    function formatCurrency(value) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(value);
    }

    // Actualizar fecha/hora
    function updateDateTime() {
        updateTimeEl.textContent = new Date().toLocaleString();
    }
});
