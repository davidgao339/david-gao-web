let trendChartInstance = null;
let categoryChartInstance = null;
let heatmapChartInstance = null;
let loyaltyChartInstance = null;
let affinityChartInstance = null;

let dailyData = [];
let heatmapData = [];
let basketData = [];

Chart.register(ChartDataLabels);

document.addEventListener('DOMContentLoaded', () => {
    try {
        dailyData = cafeData.daily_data;
        heatmapData = cafeData.heatmap_data; // Pre-aggregated independent of date filter for simplicity, or we can filter it
        basketData = cafeData.basket_data;
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

    const filterFn = (d) => {
        return d.date >= startDate && d.date <= endDate && (categoryFilter === 'All' || d.category === categoryFilter);
    };

    const currentData = dailyData.filter(filterFn);
    
    // 1. Calculate Advanced KPIs
    const totalRev = currentData.reduce((sum, d) => sum + d.revenue, 0);
    const totalCost = currentData.reduce((sum, d) => sum + d.cost, 0);
    const totalOrders = currentData.reduce((sum, d) => sum + d.orders, 0);
    const totalQty = currentData.reduce((sum, d) => sum + d.quantity, 0);

    const grossMargin = totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0;
    const aov = totalOrders > 0 ? totalRev / totalOrders : 0;
    const ipt = totalOrders > 0 ? totalQty / totalOrders : 0;

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);
    
    document.getElementById('kpi-total-revenue').innerText = formatCurrency(totalRev);
    document.getElementById('kpi-margin').innerText = grossMargin.toFixed(1) + '%';
    document.getElementById('kpi-aov').innerText = formatCurrency(aov);
    document.getElementById('kpi-ipt').innerText = ipt.toFixed(1);
    document.getElementById('kpi-total-orders').innerText = totalOrders.toLocaleString();

    // Grouping for Charts
    const monthlyRev = {};
    const monthlyCost = {};
    const monthlyNew = {};
    const monthlyRet = {};
    const catRev = {};

    currentData.forEach(d => {
        const month = d.date.substring(0, 7); // YYYY-MM
        monthlyRev[month] = (monthlyRev[month] || 0) + d.revenue;
        monthlyCost[month] = (monthlyCost[month] || 0) + d.cost;
        monthlyNew[month] = (monthlyNew[month] || 0) + d.new_revenue;
        monthlyRet[month] = (monthlyRet[month] || 0) + d.returning_revenue;
        catRev[d.category] = (catRev[d.category] || 0) + d.revenue;
    });

    // 2. Trend Chart (Line + Bar for Margin)
    const sortedMonths = Object.keys(monthlyRev).sort();
    
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    if (trendChartInstance) trendChartInstance.destroy();
    trendChartInstance = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [
                {
                    label: 'Revenue',
                    data: sortedMonths.map(m => monthlyRev[m]),
                    borderColor: '#118dff',
                    backgroundColor: 'rgba(17, 141, 255, 0.1)',
                    tension: 0,
                    fill: true,
                    pointRadius: 3,
                    order: 1
                },
                {
                    label: 'COGS',
                    type: 'bar',
                    data: sortedMonths.map(m => monthlyCost[m]),
                    backgroundColor: 'rgba(232, 17, 35, 0.6)',
                    order: 2
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: { display: false }, legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true, grid: { color: '#e1dfdd' } }, x: { grid: { display: false } } }
        }
    });

    // 3. Category Chart (Pie)
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
                borderWidth: 1, borderColor: '#ffffff'
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
                        if(sum === 0) return "0%";
                        return (value * 100 / sum).toFixed(1) + "%";
                    },
                    font: { weight: 'bold', size: 11 }
                }
            }
        }
    });

    // 4. Traffic Heatmap (Bar by Hour)
    // Aggregate heatmapData by hour
    const hourlyOrders = Array(11).fill(0); // 7AM to 5PM (17:00)
    const hourLabels = ['7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM'];
    heatmapData.forEach(d => {
        if(d.hour >= 7 && d.hour <= 17) {
            hourlyOrders[d.hour - 7] += d.orders;
        }
    });

    const heatCtx = document.getElementById('heatmapChart').getContext('2d');
    if (heatmapChartInstance) heatmapChartInstance.destroy();
    heatmapChartInstance = new Chart(heatCtx, {
        type: 'bar',
        data: {
            labels: hourLabels,
            datasets: [{
                label: 'Total Orders',
                data: hourlyOrders,
                backgroundColor: '#00b8aa',
                borderRadius: 2
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: { display: false }, legend: { display: false } },
            scales: { y: { grid: { color: '#e1dfdd' } }, x: { grid: { display: false } } }
        }
    });

    // 5. Customer Loyalty (Stacked Bar)
    const loyalCtx = document.getElementById('loyaltyChart').getContext('2d');
    if (loyaltyChartInstance) loyaltyChartInstance.destroy();
    loyaltyChartInstance = new Chart(loyalCtx, {
        type: 'bar',
        data: {
            labels: sortedMonths,
            datasets: [
                { label: 'Returning Customers', data: sortedMonths.map(m => monthlyRet[m]), backgroundColor: '#118dff' },
                { label: 'New Customers', data: sortedMonths.map(m => monthlyNew[m]), backgroundColor: '#e1dfdd' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: { display: false }, legend: { position: 'bottom' } },
            scales: { 
                x: { stacked: true, grid: { display: false } }, 
                y: { stacked: true, grid: { color: '#e1dfdd' } } 
            }
        }
    });

    // 6. Affinity Chart (Horizontal Bar)
    const affCtx = document.getElementById('affinityChart').getContext('2d');
    if (affinityChartInstance) affinityChartInstance.destroy();
    affinityChartInstance = new Chart(affCtx, {
        type: 'bar',
        data: {
            labels: basketData.map(b => b.pair),
            datasets: [{
                label: 'Receipt Occurrences',
                data: basketData.map(b => b.count),
                backgroundColor: '#e66c37',
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
