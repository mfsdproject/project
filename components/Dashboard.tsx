'use client'; // This is a client component because it uses hooks and browser APIs

import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

// --- Type Definitions for robust typing ---
interface WeatherDataPoint {
  timestamp: string;
  [key: string]: any;
}

interface WeatherDataState {
  [key: string]: WeatherDataPoint[];
}

// --- Utility Functions ---
const degreesToCardinal = (deg: number): string => { 
    const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']; 
    return DIRS[Math.round(deg / 22.5) % 16]; 
};

const Dashboard = () => {
    // State management for React
    const [loadingData, setLoadingData] = useState(true);
    const [dataError, setDataError] = useState('');
    const [weatherData, setWeatherData] = useState<WeatherDataState>({});
    const [selectedLogger, setSelectedLogger] = useState('MFSD Thaton Barometric');
    const [selectedChartStyle, setSelectedChartStyle] = useState<'line' | 'bar'>('line');
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
    });

    // Refs to hold chart instances
    const chartInstancesRef = useRef<{ [key: string]: Chart }>({});

    // --- Constants and Mappings ---
    const LOGO_COLORS = { RED: '#C8102E', GOLD: '#FDB813', DARK: '#21272C' };
    const LOGGER_IDS: { [key: string]: string } = { 'MFSD Thaton Barometric': '22226346', 'MFSD MLM Stationary': '22284699', 'MFSD MLM Transportable': '22284700' };
    const SENSOR_TYPE_MAP: { [key: string]: string } = { "Pressure": "barometric_pressure", "Barometric Pressure": "barometric_pressure", "Baro Pressure": "barometric_pressure", "Wind Direction": "wind_direction", "Wind Speed": "wind_speed", "Gust Speed": "gust_speed", "Temperature": "air_temperature", "RH": "relative_humidity", "Dew Point": "dew_point", "Battery": "battery", "Rain": "rain", "Accumulated Rain": "accumulated_rain" };
    const SENSOR_ICONS: { [key: string]: string } = { 
        barometric_pressure: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${LOGO_COLORS.RED}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5c0 1.6.8 3 2 4H7c-2.2 0-4 1.8-4 4s1.8 4 4 4h10c2.2 0 4-1.8 4-4s-1.8-4-4-4h-2c1.2-1 2-2.4 2-4a5 5 0 0 0-5-5z"/><path d="M12 7v10"/></svg>`, 
        air_temperature: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${LOGO_COLORS.RED}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`, 
        relative_humidity: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${LOGO_COLORS.GOLD}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-2.5-3.5-2.5-1.5 1-3.5 2.5S5 13 5 15a7 7 0 0 0 7 7z"/><path d="M12 10v6"/><path d="M12 13h.01"/></svg>`, 
        wind_speed: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${LOGO_COLORS.GOLD}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1-5 0"/><path d="M12.2 12.2a2.5 2.5 0 1 1-5 0"/><path d="M6.7 16.7a2.5 2.5 0 1 1-5 0"/><path d="M22 2L2 22"/></svg>`, 
        wind_direction: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${LOGO_COLORS.RED}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 6h8L12 2zM12 22l4-4H8l4 4zM2 12l4 4V8L2 12zM22 12l-4-4v8l4-4z"/></svg>`, 
        rain: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${LOGO_COLORS.RED}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/></svg>`, 
        battery: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${LOGO_COLORS.GOLD}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/></svg>`, 
        default: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` 
    };
    const translations: { [key: string]: { [key: string]: string } } = {
        en: { weatherDashboard: "Weather Dashboard", device: "Device", chartStyle: "Chart Style", line: "Line", bar: "Bar", dateRange: "Date Range", today: "Today", last6Hours: "Last 6 Hours", last12Hours: "Last 12 Hours", last24Hours: "Last 24 Hours", last7Days: "Last 7 Days", last30Days: "Last 30 Days", loading: "Loading...", failedToFetch: "Failed to fetch data:", noDataFound: "No data found for the selected device and time range. Please try a different selection.", latestConditions: "Latest Conditions", noRecentData: "No recent data available.", batteryStatus: "Battery Status", temperature: "Temperature", relativeHumidity: "Relative Humidity", windrose: "Windrose", noWindData: "No wind data available.", barometricPressure: "Barometric Pressure", windSpeed: "Wind Speed", windDirection: "Wind Direction", gustSpeed: "Gust Speed", rainfall: "Rainfall", accumulatedRain: "Accumulated Rain", dewPoint: "Dew Point", batteryHistory: "Battery History", airTemperature: "Air Temperature", noDataFor: "No data for", currentWind: "Current Wind" },
        my: { weatherDashboard: "ရာသီဥတု ဒက်ရှ်ဘုတ်", device: "စက်ပစ္စည်း", chartStyle: "ဇယားပုံစံ", line: "လိုင်း", bar: "ဘား", dateRange: "ရက်စွဲအပိုင်းအခြား", today: "ယနေ့", last6Hours: "နောက်ဆုံး ၆ နာရီ", last12Hours: "နောက်ဆုံး ၁၂ နာရီ", last24Hours: "နောက်ဆုံး ၂၄ နာရီ", last7Days: "နောက်ဆုံး ၇ ရက်", last30Days: "နောက်ဆုံး ရက် ၃၀", loading: "တင်နေသည်...", failedToFetch: "ဒေတာရယူရန် မအောင်မြင်ပါ:", noDataFound: "ရွေးချယ်ထားသော စက်နှင့် အချိန်အတွက် ဒေတာမတွေ့ပါ။ ကျေးဇူးပြု၍ အခြားတစ်ခုကို ရွေးချယ်စမ်းကြည့်ပါ။", latestConditions: "နောက်ဆုံးအခြေအနေများ", noRecentData: "လတ်တလောဒေတာမရှိပါ။", batteryStatus: "ဘက်ထရီအခြေအနေ", temperature: "အပူချိန်", relativeHumidity: "စိုထိုင်းဆ", windrose: "လေညွှန်ကားချပ်", noWindData: "လေဒေတာမရှိပါ။", barometricPressure: "လေဖိအား", windSpeed: "လေတိုက်နှုန်း", windDirection: "လေညွှန်", gustSpeed: "လေပြင်းတိုက်နှုန်း", rainfall: "မိုးရေချိန်", accumulatedRain: "စုစုပေါင်းမိုးရေချိန်", dewPoint: "နှင်းရည်မှတ်", batteryHistory: "ဘက်ထရီမှတ်တမ်း", airTemperature: "လေထုအပူချိန်", noDataFor: "အတွက် ဒေတာမရှိပါ", currentWind: "လက်ရှိလေ" }
    };

    const t = (key: string) => translations[currentLanguage]?.[key] || key;
    
    const formatDateTimeForAPI = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');
    const formatDateTimeForDisplay = (date: Date) => date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // --- Main Data Fetching Logic ---
    useEffect(() => {
        const fetchAndProcessData = async () => {
            setLoadingData(true);
            setDataError('');

            Object.values(chartInstancesRef.current).forEach(chart => chart.destroy());
            chartInstancesRef.current = {};

            try {
                const startStr = formatDateTimeForAPI(dateRange.start);
                const endStr = formatDateTimeForAPI(dateRange.end);
                const loggerId = LOGGER_IDS[selectedLogger];
                const url = `https://api.licor.cloud/v1/data?loggers=${loggerId}&start_date_time=${encodeURIComponent(startStr)}&end_date_time=${encodeURIComponent(endStr)}`;
                
                const response = await fetch(url, {
                    headers: { 'accept': 'application/json', 'Authorization': `Bearer TaCLCz6BCUhEmxbJXYBvcnvTLAu7whJn3Fg3X1Bu8O3EuMtS` }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
                }

                const rawData = (await response.json()).data;
                if (!Array.isArray(rawData)) throw new Error('API response data is not an array.');

                const processedData: { [key: string]: WeatherDataPoint } = {};
                rawData.forEach(item => {
                    const timestamp = item.timestamp;
                    if (!processedData[timestamp]) processedData[timestamp] = { timestamp: timestamp };
                    const key = SENSOR_TYPE_MAP[item.sensor_measurement_type];
                    if (key) {
                        processedData[timestamp][key] = item.value;
                    }
                });
                
                const sortedData = Object.values(processedData).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                setWeatherData((prev: WeatherDataState) => ({ ...prev, [loggerId]: sortedData }));

            } catch (err: any) {
                setDataError(`${t('failedToFetch')} ${err.message}`);
            } finally {
                setLoadingData(false);
            }
        };

        fetchAndProcessData();
    }, [selectedLogger, dateRange, currentLanguage]);

    // --- Handlers for UI controls ---
    const handlePresetClick = (preset: string) => {
        const end = new Date();
        let start = new Date();
        switch (preset) {
            case 'today': start.setHours(0, 0, 0, 0); break;
            case 'last6Hours': start.setHours(start.getHours() - 6); break;
            case 'last12Hours': start.setHours(start.getHours() - 12); break;
            case 'last24Hours': start.setHours(start.getHours() - 24); break;
            case 'last7Days': start.setDate(start.getDate() - 7); break;
            case 'last30Days': start.setDate(start.getDate() - 30); break;
        }
        setDateRange({ start, end });
    };

    // --- Render Functions ---
    useEffect(() => {
        const data: WeatherDataPoint[] = weatherData[LOGGER_IDS[selectedLogger]] || [];
        if (loadingData || dataError || data.length === 0) return;

        const createChart = (containerId: string, config: ChartConfiguration) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            const canvas = container.querySelector('canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            if (chartInstancesRef.current[containerId]) {
                chartInstancesRef.current[containerId].destroy();
            }
            chartInstancesRef.current[containerId] = new Chart(ctx, config);
        };

        const renderWeatherChart = (containerId: string, titleKey: string, dataKey: string, color: string) => {
            const relevantData = data.filter((d: WeatherDataPoint) => d[dataKey] !== undefined && d[dataKey] !== null);
            const container = document.getElementById(containerId);
            if (!container) return;

            if (relevantData.length === 0) {
                 container.innerHTML = `<div class="bg-white p-6 rounded-xl shadow-lg flex items-center justify-center h-full"><h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">${t(titleKey)}</h3><p class="text-gray-500">${t('noDataFor')} ${t(titleKey)}.</p></div>`;
                 return;
            }
             container.innerHTML = `<h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">${t(titleKey)}</h3><div class="chart-container"><canvas></canvas></div>`;

            const dataTimestamps = relevantData.map((d: WeatherDataPoint) => new Date(d.timestamp).getTime());
            const timeSpanHours = (Math.max(...dataTimestamps) - Math.min(...dataTimestamps)) / (1000 * 60 * 60);

            createChart(containerId, {
                type: selectedChartStyle,
                data: {
                    labels: relevantData.map((d: WeatherDataPoint) => new Date(d.timestamp)),
                    datasets: [{ label: t(titleKey), data: relevantData.map((d: WeatherDataPoint) => d[dataKey]), borderColor: color, backgroundColor: selectedChartStyle === 'bar' ? color + '80' : color, fill: selectedChartStyle === 'line' ? false : true, tension: 0.2, pointRadius: 2, pointBackgroundColor: color, pointHoverRadius: 6, borderWidth: 2 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: { 
                        x: { type: 'time', time: { unit: timeSpanHours <= 2 ? 'minute' : timeSpanHours <= 48 ? 'hour' : 'day', tooltipFormat: 'MMM d, yyyy, h:mm:ss a', displayFormats: { minute: 'h:mm a', hour: 'h a', day: 'MMM d' } }, ticks: { autoSkip: true, maxTicksLimit: 12, maxRotation: 45, minRotation: 0 } }, 
                        y: { beginAtZero: ['wind_speed', 'gust_speed', 'rain', 'accumulated_rain'].includes(dataKey) } 
                    },
                    plugins: { legend: { display: false }, tooltip: { callbacks: { title: (ctx: any) => new Date(ctx[0].parsed.x).toLocaleString() } } }
                }
            });
        };
        
        const renderThermometerGauge = (containerId: string, data: WeatherDataPoint[]) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            const latestReading = data.filter(d => d.air_temperature !== undefined).slice(-1)[0];
            const temp = latestReading ? latestReading.air_temperature : 0;
            const minT = -10, maxT = 50;
            const range = maxT - minT;
            const percentage = Math.max(0, Math.min(100, ((temp - minT) / range) * 100));

            container.innerHTML = `
                <h3 class="text-xl font-semibold text-gray-800 mb-4">${t('temperature')}</h3>
                <div class="thermometer-container-custom">
                    <div class="thermometer">
                        <div class="thermometer-level" style="height: ${percentage}%;"></div>
                        <div class="thermometer-bulb"></div>
                    </div>
                </div>
                 <p class="mt-8 text-3xl font-bold text-gray-800">${temp.toFixed(1)} °C</p>`;
        };

        const renderRadialGauge = (containerId: string, data: WeatherDataPoint[]) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            const latestReading = data.filter(d => d.relative_humidity !== undefined).slice(-1)[0];
            const rh = latestReading ? latestReading.relative_humidity : 0;
            
            container.innerHTML = `
                <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">${t('relativeHumidity')}</h3>
                <div class="chart-container" style="height: 220px;"><canvas id="rh-gauge-chart"></canvas></div>`;
            
            createChart('rh-gauge-container', {
                type: 'doughnut',
                data: { datasets: [{ data: [rh, 100 - rh], backgroundColor: [LOGO_COLORS.GOLD, '#e0e0e0'], borderWidth: 0, circumference: 180, rotation: 270 }] },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    cutout: '80%', 
                    plugins: { tooltip: { enabled: false }, legend: { display: false } }, 
                    elements: { 
                        center: { 
                            text: `${rh.toFixed(1)}%`, 
                            color: '#333', 
                            fontStyle: 'bold', 
                            sidePadding: 20 
                        } 
                    } 
                } as any, // This 'as any' cast resolves the TypeScript build error
                plugins: [{
                    id: 'doughnut-center-text',
                    beforeDraw: function(chart: any) {
                        const { width, height, ctx } = chart;
                        const { center } = chart.options.elements;
                        ctx.restore();
                        ctx.font = `30px ${center.fontStyle || 'Arial'}`;
                        ctx.textBaseline = 'middle';
                        const textX = Math.round((width - ctx.measureText(center.text).width) / 2);
                        ctx.fillText(center.text, textX, height / 1.5);
                        ctx.save();
                    }
                }]
            });
        };

        const renderWindDirectionGauge = (containerId: string, data: WeatherDataPoint[]) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            const latestReading = data.filter(d => d.wind_direction !== undefined).slice(-1)[0];
            const direction = latestReading ? latestReading.wind_direction : 0;
            const cardinal = degreesToCardinal(direction);

            container.innerHTML = `
                <h3 class="text-xl font-semibold text-gray-800 mb-4">${t('currentWind')}</h3>
                <div class="wind-gauge">
                    <div class="wind-gauge-pointer" style="transform: rotate(${direction}deg);"></div>
                    <div class="wind-gauge-center"></div>
                    <span class="wind-gauge-label label-n">N</span>
                    <span class="wind-gauge-label label-s">S</span>
                    <span class="wind-gauge-label label-e">E</span>
                    <span class="wind-gauge-label label-w">W</span>
                </div>
                <p class="mt-4 text-2xl font-bold text-gray-800">${direction.toFixed(0)}°</p>
                <p class="text-lg font-medium text-gray-600">${cardinal}</p>`;
        };

        const renderBatteryStatus = (containerId: string, data: WeatherDataPoint[]) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            const latestReading = data.filter(d => d.battery !== undefined).slice(-1)[0];
            const voltage = latestReading ? latestReading.battery : 0;
            const minV = 3.5, maxV = 4.2;
            const percentage = Math.max(0, Math.min(100, ((voltage - minV) / (maxV - minV)) * 100));
            const levelColor = percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-red-500';

            container.innerHTML = `
                <h3 class="text-xl font-semibold text-gray-800 mb-4">${t('batteryStatus')}</h3>
                <div class="battery-container">
                    <div class="battery-body">
                        <div class="battery-level ${levelColor}" style="height: ${percentage}%;"></div>
                    </div>
                    <p class="mt-4 text-2xl font-bold text-gray-800">${voltage.toFixed(2)} V</p>
                    <p class="text-lg font-medium text-gray-600">(${percentage.toFixed(0)}%)</p>
                </div>`;
        };

        const renderWindroseChart = (containerId: string, data: WeatherDataPoint[]) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            const windData = data.filter((d: WeatherDataPoint) => d.wind_direction !== undefined && d.wind_speed !== undefined);

            if (windData.length === 0) {
                container.innerHTML = `<div class="bg-white p-6 rounded-xl shadow-lg flex items-center justify-center h-full"><p class="text-gray-500">${t('noWindData')}</p></div>`;
                return;
            }
            container.innerHTML = `<h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">${t('windrose')}</h3><div class="chart-container"><canvas id="windrose-chart"></canvas></div>`;

            const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            const speedBins: { [key: string]: any } = {
                '0-2 m/s': { min: 0, max: 2, color: '#a7f3d0', data: Array(16).fill(0) },
                '2-4 m/s': { min: 2, max: 4, color: LOGO_COLORS.GOLD, data: Array(16).fill(0) },
                '4-6 m/s': { min: 4, max: 6, color: '#fbbf24', data: Array(16).fill(0) },
                '>6 m/s': { min: 6, max: Infinity, color: LOGO_COLORS.RED, data: Array(16).fill(0) },
            };
            windData.forEach((d: WeatherDataPoint) => {
                const dirIndex = Math.round(d.wind_direction / 22.5) % 16;
                for (const binName in speedBins) {
                    if (d.wind_speed >= speedBins[binName].min && d.wind_speed < speedBins[binName].max) {
                        speedBins[binName].data[dirIndex]++;
                        break;
                    }
                }
            });
            const datasets = Object.keys(speedBins).map(binName => ({ label: binName, data: speedBins[binName].data, backgroundColor: speedBins[binName].color, borderColor: '#fff', borderWidth: 1 }));
            createChart('windrose-container', { type: 'polarArea', data: { labels: directions, datasets: datasets }, options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } } });
        };
        
        // Call all render functions
        if (selectedLogger !== 'MFSD Thaton Barometric') {
            renderThermometerGauge('thermometer-container', data);
            renderRadialGauge('rh-gauge-container', data);
            renderWindDirectionGauge('wind-direction-gauge-container', data);
            renderWindroseChart('windrose-container', data);
        }
        renderBatteryStatus('battery-status-container', data);

        renderWeatherChart('temperature-chart-container', 'airTemperature', 'air_temperature', LOGO_COLORS.RED);
        renderWeatherChart('pressure-chart-container', 'barometricPressure', 'barometric_pressure', LOGO_COLORS.RED);
        renderWeatherChart('wind-speed-chart-container', 'windSpeed', 'wind_speed', LOGO_COLORS.GOLD);
        renderWeatherChart('wind-direction-chart-container', 'windDirection', 'wind_direction', LOGO_COLORS.RED);
        renderWeatherChart('gust-speed-chart-container', 'gustSpeed', 'gust_speed', LOGO_COLORS.GOLD);
        renderWeatherChart('dew-point-chart-container', 'dewPoint', 'dew_point', LOGO_COLORS.RED);
        renderWeatherChart('rain-chart-container', 'rainfall', 'rain', LOGO_COLORS.RED);
        renderWeatherChart('accumulated-rain-chart-container', 'accumulatedRain', 'accumulated_rain', LOGO_COLORS.RED);
        renderWeatherChart('battery-chart-container', 'batteryHistory', 'battery', LOGO_COLORS.GOLD);

    }, [weatherData, selectedChartStyle, currentLanguage, loadingData, dataError]);

    const renderLatestReadings = () => {
        const data = weatherData[LOGGER_IDS[selectedLogger]] || [];
        const latestData: { [key: string]: any } = {};
        Object.keys(SENSOR_TYPE_MAP).forEach(sensorName => {
            const key = SENSOR_TYPE_MAP[sensorName];
            const relevantData = data.filter((d: any) => d[key] !== undefined && d[key] !== null).slice(-1)[0];
            if (relevantData) latestData[key] = { value: relevantData[key], timestamp: relevantData.timestamp };
        });

        if (Object.keys(latestData).length === 0) {
            return <li className="text-gray-500">{t('noRecentData')}</li>;
        }

        let keysToRender = Object.keys(latestData);
        if (selectedLogger === 'MFSD Thaton Barometric') {
            keysToRender = ['barometric_pressure', 'battery'];
        }

        return keysToRender.map(key => {
            const reading = latestData[key];
            if (!reading) return null;
            const formattedKey = t(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            const unit = key === 'air_temperature' || key === 'dew_point' ? '°C' : key === 'relative_humidity' ? '%' : key === 'barometric_pressure' ? ' hPa' : key === 'wind_speed' || key === 'gust_speed' ? ' m/s' : key === 'wind_direction' ? '°' : key === 'rain' || key === 'accumulated_rain' ? ' mm' : key === 'battery' ? ' V' : '';
            return (
                <li key={key} data-sensor-key={key} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <div className="flex items-center space-x-3" dangerouslySetInnerHTML={{ __html: SENSOR_ICONS[key] || SENSOR_ICONS.default }}></div>
                    <span className="font-medium text-gray-700 ml-2">{formattedKey}</span>
                    <div className="text-right ml-auto">
                        <span className="font-bold text-gray-800">{parseFloat(reading.value).toFixed(2)}{unit}</span>
                        <p className="text-xs text-gray-500">{new Date(reading.timestamp).toLocaleString()}</p>
                    </div>
                </li>
            );
        });
    };

    const FullDashboard = () => (
        <div id="dashboard-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="md:col-span-2 lg:col-span-4 bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex-shrink-0">{t('latestConditions')}</h3>
                <ul className="space-y-3 overflow-y-auto flex-grow" style={{maxHeight: '280px'}}>
                    {renderLatestReadings()}
                </ul>
            </div>

            <div id="thermometer-container" className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center h-full"></div>
            <div id="rh-gauge-container" className="bg-white p-6 rounded-xl shadow-lg h-full"></div>
            <div id="wind-direction-gauge-container" className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center h-full"></div>
            <div id="battery-status-container" className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center h-full"></div>
            <div id="windrose-container" className="md:col-span-2 lg:col-span-4 bg-white p-6 rounded-xl shadow-lg h-full"></div>
            
            <div id="temperature-chart-container" className="md:col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full"></div>
            <div id="pressure-chart-container" className="md:col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full"></div>
            <div id="wind-speed-chart-container" className="md:col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full"></div>
            <div id="wind-direction-chart-container" className="md:col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full"></div>
            <div id="gust-speed-chart-container" className="md:col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full"></div>
            <div id="dew-point-chart-container" className="md:col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full"></div>
            <div id="rain-chart-container" className="md:col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full"></div>
            <div id="accumulated-rain-chart-container" className="md:col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full"></div>
            <div id="battery-chart-container" className="md:col-span-2 lg:col-span-4 bg-white p-6 rounded-xl shadow-lg h-full"></div>
        </div>
    );

    const BarometricDashboard = () => (
         <div id="dashboard-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex-shrink-0">{t('latestConditions')}</h3>
                <ul className="space-y-3 overflow-y-auto flex-grow" style={{maxHeight: '280px'}}>
                    {renderLatestReadings()}
                </ul>
            </div>
            <div id="battery-status-container" className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center h-full"></div>
            <div id="pressure-chart-container" className="md:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full"></div>
            <div id="battery-chart-container" className="md:col-span-2 bg-white p-6 rounded-xl shadow-lg h-full"></div>
        </div>
    );
    
    return (
        <div className={`bg-gray-100 p-4 sm:p-6 ${currentLanguage === 'my' ? 'font-padauk' : 'font-inter'}`}>
             <Head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Padauk&display=swap" rel="stylesheet" />
                <style>{`
                    .chart-container { position: relative; height: 300px; width: 100%; }
                    .thermometer-container-custom { display: flex; align-items: center; justify-content: center; }
                    .thermometer { width: 30px; height: 180px; background: #e0e0e0; border-radius: 20px 20px 0 0; position: relative; border: 2px solid #bbb; box-shadow: 0 0 10px rgba(0,0,0,0.1) inset; }
                    .thermometer-level { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, #FDB813, #C8102E); border-radius: 20px 20px 0 0; transition: height 0.5s ease-out; }
                    .thermometer-bulb { position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); width: 50px; height: 50px; background: linear-gradient(to top, #FDB813, #C8102E); border-radius: 50%; border: 2px solid #bbb; }
                    .battery-container { width: 120px; height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                    .battery-body { width: 80px; height: 150px; border: 5px solid #333; border-radius: 10px; position: relative; background-color: #f0f0f0; }
                    .battery-body::before { content: ''; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 30px; height: 5px; background-color: #333; border-radius: 3px 3px 0 0; }
                    .battery-level { position: absolute; bottom: 0; left: 0; right: 0; border-radius: 5px; transition: height 0.5s ease-out; }
                    .wind-gauge { position: relative; width: 150px; height: 150px; border-radius: 50%; border: 2px solid #e0e0e0; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
                    .wind-gauge-pointer { width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 70px solid #C8102E; position: absolute; top: 5px; left: 50%; transform-origin: bottom center; transition: transform 0.5s ease-out; margin-left: -10px; }
                    .wind-gauge-center { width: 15px; height: 15px; background: #fff; border: 2px solid #333; border-radius: 50%; z-index: 10; }
                    .wind-gauge-label { position: absolute; font-size: 12px; font-weight: 600; color: #666; }
                    .label-n { top: 0; } .label-s { bottom: 0; } .label-e { right: 0; } .label-w { left: 0; }
                `}</style>
            </Head>

            <div className="bg-white p-4 rounded-xl shadow-md mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium text-black">{t('device')}</label>
                        <select value={selectedLogger} onChange={e => setSelectedLogger(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-black">
                            {Object.keys(LOGGER_IDS).map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-black">{t('chartStyle')}</label>
                        <select value={selectedChartStyle} onChange={e => setSelectedChartStyle(e.target.value as 'line' | 'bar')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-black">
                            <option value="line">{t('line')}</option>
                            <option value="bar">{t('bar')}</option>
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="text-sm font-medium text-black">{t('dateRange')}</label>
                        <div className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-black">
                            {`${formatDateTimeForDisplay(dateRange.start)} to ${formatDateTimeForDisplay(dateRange.end)}`}
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {['today', 'last6Hours', 'last12Hours', 'last24Hours', 'last7Days', 'last30Days'].map(p => 
                        <button key={p} onClick={() => handlePresetClick(p)} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium hover:bg-red-200">{t(p)}</button>
                    )}
                </div>
            </div>

            {loadingData && <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div><p className="ml-4">{t('loading')}</p></div>}
            {dataError && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert"><p>{dataError}</p></div>}
            {!loadingData && !dataError && (!weatherData[LOGGER_IDS[selectedLogger]] || weatherData[LOGGER_IDS[selectedLogger]].length === 0) && <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 text-center rounded-lg" role="alert"><h3 className="font-bold text-lg">{t('noDataFound')}</h3></div>}
            
            {!loadingData && !dataError && weatherData[LOGGER_IDS[selectedLogger]]?.length > 0 && (
                selectedLogger === 'MFSD Thaton Barometric' ? <BarometricDashboard /> : <FullDashboard />
            )}
        </div>
    );
};

export default Dashboard;
   