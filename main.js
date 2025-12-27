let cryptoData = [];
let sortDirection = true; // true = rosnąco, false = malejąco
let myChart = null;

// Pobranie  Top 50 z API
async function fetchTop50() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=pln&order=market_cap_desc&per_page=50&page=1&sparkline=false'
    );
    cryptoData = await response.json();
    renderTable(cryptoData);
    updateCalculator(); // Pierwsze przeliczenie dla BTC
  } catch (error) {
    console.error('Błąd pobierania danych:', error);
  }
}

// Renderowanie
function renderTable(data) {
  const tableBody = document.getElementById('cryptoTableBody');
  tableBody.innerHTML = '';

  data.forEach((coin) => {
    const row = document.createElement('tr');
    const priceChange = coin.price_change_percentage_24h.toFixed(2);
    const changeClass = priceChange >= 0 ? 'up' : 'down';

    row.innerHTML = `
            <td><strong>${
              coin.name
            }</strong> (${coin.symbol.toUpperCase()})</td>
            <td>${coin.current_price.toLocaleString()} PLN</td>
            <td class="${changeClass}">${priceChange}%</td>
        `;

    row.onclick = () => loadChart(coin.id, coin.name);
    tableBody.appendChild(row);
  });
}

// Sortowanie
function sortData(property) {
  sortDirection = !sortDirection;
  cryptoData.sort((a, b) => {
    if (a[property] < b[property]) return sortDirection ? -1 : 1;
    if (a[property] > b[property]) return sortDirection ? 1 : -1;
    return 0;
  });
  renderTable(cryptoData);
}

// PLN -> BTC
const plnInput = document.getElementById('plnInput');
const btcResult = document.getElementById('btcResult');

function updateCalculator() {
  const btcCoin = cryptoData.find((c) => c.symbol === 'btc');
  if (btcCoin) {
    const plnValue = parseFloat(plnInput.value) || 0;
    const result = plnValue / btcCoin.current_price;
    btcResult.textContent = result.toFixed(6);
  }
}

plnInput.addEventListener('input', updateCalculator);

// Chart.js
async function loadChart(coinId, name) {
  const chartSection = document.getElementById('chartSection');
  chartSection.style.display = 'block';
  document.getElementById(
    'chartTitle'
  ).textContent = `Historia ceny: ${name} (7 dni)`;

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=pln&days=7`
    );
    const data = await response.json();

    // Ceny z API są w formacie [timestamp, cena]
    const labels = data.prices.map((p) => new Date(p[0]).toLocaleDateString());
    const prices = data.prices.map((p) => p[1]);

    if (myChart) myChart.destroy(); // Usuwa stary wykres przed rysowaniem nowego

    const ctx = document.getElementById('cryptoChart').getContext('2d');
    myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `Cena ${name} (PLN)`,
            data: prices,
            borderColor: '#38bdf8',
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: false } },
      },
    });
  } catch (error) {
    console.error('Błąd wykresu:', error);
  }
}

// Start aplikacji
document.addEventListener('DOMContentLoaded', fetchTop50);
