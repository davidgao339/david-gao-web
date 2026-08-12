let trendChartInstance = null;
let categoryChartInstance = null;
let inventoryChartInstance = null;
let rawData = [];

Chart.register(ChartDataLabels);

document.addEventListener('DOMContentLoaded', () => {
    try {
        rawData = cafeData.daily_data;
    } catch (error) {
        console.error("Failed to load metrics. Please ensure data.js exists.", error);
        document.getElementById('kpi-total-revenue').innerText = "Error Loading";
        return;
    }

    Chart.defaults.color = '#605e5c';
    Chart.defaults.font.family = "'Segoe UI', 'Inter', sans-serif";

    document.getElementById('startDate').addEventListener('change', updateDashboard);
    document.getElementById('endDate').addEventListener('change', updateDashboard);
    document.getElementById('categoryFilter').addEventListener('change', updateDashboard);

    updateDashboard(); // Initial render
});

function getPreviousPeriod(dateStr, monthsBack) {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() - monthsBack);
    return d.toISOString().split('T')[0];
}

function updateDashboard() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    const filterFn = (d, start, end, cat) => {
        return d.date >= start && d.date <= end && (cat === 'All' || d.category === cat);
    };

    // Filter Data for current period
    const currentData = rawData.filter(d => filterFn(d, startDate, endDate, categoryFilter));
    
    // Filter Data for YoY (12 months back)
    const yoyStart = getPreviousPeriod(startDate, 12);
    const yoyEnd = getPreviousPeriod(endDate, 12);
    const yoyData = rawData.filter(d => filterFn(d, yoyStart, yoyEnd, categoryFilter));

    // Filter Data for MoM (1 month back)
    const momStart = getPreviousPeriod(startDate, 1);
    const momEnd = getPreviousPeriod(endDate, 1);
    const momData = rawData.filter(d => filterFn(d, momStart, momEnd, categoryFilter));

    // 1. Calculate KPIs
    const totalRev = currentData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = currentData.reduce((sum, d) => sum + d.orders, 0);
    const yoyRev = yoyData.reduce((sum, d) => sum + d.revenue, 0);
    const momRev = momData.reduce((sum, d) => sum + d.revenue, 0);

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);
    document.getElementById('kpi-total-revenue').innerText = formatCurrency(totalRev);
    document.getElementById('kpi-total-orders').innerText = totalOrders.toLocaleString();
    
    // YoY Rendering
    const yoyPct = yoyRev > 0 ? ((totalRev - yoyRev) / yoyRev) * 100 : 0;
    const yoyEl = document.getElementById('kpi-yoy');
    yoyEl.innerText = (yoyPct >= 0 ? '+' : '') + yoyPct.toFixed(1) + '%';
    yoyEl.nextElementSibling.className = 'kpi-trend ' + (yoyPct >= 0 ? 'positive' : 'negative');
    yoyEl.nextElementSibling.innerText = yoyPct >= 0 ? '▲ YoY' : '▼ YoY';

    // MoM Rendering
    const momPct = momRev > 0 ? ((totalRev - momRev) / momRev) * 100 : 0;
    const momEl = document.getElementById('kpi-mom');
    momEl.innerText = (momPct >= 0 ? '+' : '') + momPct.toFixed(1) + '%';
    momEl.nextElementSibling.className = 'kpi-trend ' + (momPct >= 0 ? 'positive' : 'negative');
    momEl.nextElementSibling.innerText = momPct >= 0 ? '▲ MoM' : '▼ MoM';

    // Grouping for Charts
    const monthlyRev = {};
    const catRev = {};
    const subcatQty = {};

    currentData.forEach(d => {
        const month = d.date.substring(0, 7); // YYYY-MM
        monthlyRev[month] = (monthlyRev[month] || 0) + d.revenue;
        catRev[d.category] = (catRev[d.category] || 0) + d.revenue;
        subcatQty[d.subcategory] = (subcatQty[d.subcategory] || 0) + d.quantity;
    });

    // 2. Trend Chart (Line)
    const sortedMonths = Object.keys(monthlyRev).sort();
    const trendData = sortedMonths.map(m => monthlyRev[m]);

    const trendCtx = document.getElementById('trendChart').getContext('2d');
    if (trendChartInstance) trendChartInstance.destroy();
    trendChartInstance = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Revenue',
                data: trendData,
                borderColor: '#118dff',
                backgroundColor: 'rgba(17, 141, 255, 0.1)',
                tension: 0,
                fill: true,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: { display: false }, legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: '#e1dfdd' } }, x: { grid: { display: false } } }
        }
    });

    // 3. Category Chart (Pie with Data Labels)
    const catLabels = Object.keys(catRev);
    const catDataArr = Object.values(catRev);

    const catCtx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(catCtx, {
        type: 'pie',
        data: {
            labels: catLabels,
            datasets: [{
                data: catDataArr,
                backgroundColor: ['#118dff', '#12239e', '#e66c37', '#00b050', '#00b8aa'],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } },
                datalabels: {
                    color: '#fff',
                    formatter: (value, ctx) => {
                        let sum = 0;
                        let dataArr = ctx.chart.data.datasets[0].data;
                        dataArr.map(data => { sum += data; });
                        if (sum === 0) return "0%";
                        let percentage = (value * 100 / sum).toFixed(1) + "%";
                        return percentage;
                    },
                    font: { weight: 'bold', size: 11 }
                }
            }
        }
    });

    // 4. Inventory Chart (Bar)
    const subcatEntries = Object.entries(subcatQty).sort((a,b) => b[1] - a[1]).slice(0, 8); // Top 8
    
    const invCtx = document.getElementById('inventoryChart').getContext('2d');
    if (inventoryChartInstance) inventoryChartInstance.destroy();
    inventoryChartInstance = new Chart(invCtx, {
        type: 'bar',
        data: {
            labels: subcatEntries.map(e => e[0]),
            datasets: [{
                label: 'Quantity Sold',
                data: subcatEntries.map(e => e[1]),
                backgroundColor: '#118dff',
                borderRadius: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: { display: false }, legend: { display: false } },
            scales: { x: { grid: { color: '#e1dfdd' } }, y: { grid: { display: false } } }
        }
    });
}
