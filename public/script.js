/**
 * SunKey Frontend JavaScript
 * Handles form submission, API calls, and rendering results
 */

// DOM Elements
const inputSection = document.getElementById('input-section');
const resultsSection = document.getElementById('results-section');
const birthForm = document.getElementById('birth-form');
const backBtn = document.getElementById('back-btn');
const loading = document.getElementById('loading');
const errorOverlay = document.getElementById('error');
const errorText = document.getElementById('error-text');
const errorClose = document.getElementById('error-close');
const birthPlaceInput = document.getElementById('birth-place');
const citySuggestions = document.getElementById('city-suggestions');

// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// State
let currentResult = null;

/**
 * Initialize the application
 */
function init() {
    // Set up event listeners
    birthForm.addEventListener('submit', handleFormSubmit);
    backBtn.addEventListener('click', showInputSection);
    errorClose.addEventListener('click', hideError);
    birthPlaceInput.addEventListener('input', handleCityInput);
    birthPlaceInput.addEventListener('blur', () => {
        setTimeout(() => citySuggestions.classList.remove('active'), 200);
    });
}

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(birthForm);
    const date = formData.get('date');
    const time = formData.get('time');
    const place = formData.get('place');

    // Validate inputs
    if (!date || !time || !place) {
        showError('Please fill in all fields');
        return;
    }

    try {
        // Show loading
        showLoading();

        // Call API
        const response = await fetch(
            `${API_BASE_URL}/sunkey?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&place=${encodeURIComponent(place)}`
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to calculate Sun Key');
        }

        const result = await response.json();
        currentResult = result;

        // Display results
        displayResults(result);

        // Load and render the wheel
        await loadAndRenderWheel(result.geneKey);

        // Hide loading and show results
        hideLoading();
        showResultsSection();

    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showError(error.message || 'An error occurred. Please try again.');
    }
}

/**
 * Display calculation results
 * @param {Object} result - API result object
 */
function displayResults(result) {
    // Update Gene Key number
    document.getElementById('result-number').textContent = result.geneKey;
    document.getElementById('detail-number').textContent = result.geneKey;

    // Display hexagram
    if (result.hexagram) {
        displayHexagram(result.hexagram);
    }

    // Update birth information
    document.getElementById('result-date').textContent = result.birthDate.date;
    document.getElementById('result-time').textContent = result.birthDate.time;
    document.getElementById('result-timezone').textContent = result.birthDate.timezone || result.location?.timezone || '';
    document.getElementById('result-place').textContent = result.birthDate.place;

    if (result.location) {
        const coords = `${result.location.latitude.toFixed(4)}\u00b0, ${result.location.longitude.toFixed(4)}\u00b0`;
        document.getElementById('result-coords').textContent = coords;
    }

    document.getElementById('result-longitude').textContent = result.sunLongitude.toFixed(4);
    document.getElementById('result-zodiac').textContent = result.zodiacSign;
    document.getElementById('result-accuracy').textContent = result.accuracy || 'Standard calculation';

    // Update spectrum (Shadow, Gift, Siddhi)
    document.getElementById('result-shadow').textContent = result.shadow;
    document.getElementById('result-gift').textContent = result.gift;
    document.getElementById('result-siddhi').textContent = result.siddhi;
}

/**
 * Display I-Ching hexagram
 * @param {Object} hexagram - Hexagram data with lines array
 */
function displayHexagram(hexagram) {
    const container = document.getElementById('hexagram-display');
    container.innerHTML = '';

    // Display lines from bottom to top (traditional I-Ching order)
    for (let i = hexagram.lines.length - 1; i >= 0; i--) {
        const line = document.createElement('div');
        line.className = hexagram.lines[i] === 1 ? 'hexagram-line solid' : 'hexagram-line broken';
        container.appendChild(line);
    }

    // Display hexagram name and Chinese character
    document.getElementById('hexagram-name').textContent = hexagram.name;
    document.getElementById('iching-character').textContent = hexagram.iching;
}

/**
 * Load wheel data and render the SVG wheel
 * @param {number} highlightGeneKey - Gene Key to highlight
 */
async function loadAndRenderWheel(highlightGeneKey) {
    try {
        const response = await fetch(`${API_BASE_URL}/wheel`);
        if (!response.ok) {
            throw new Error('Failed to load wheel data');
        }

        const data = await response.json();
        renderWheel(data.segments, highlightGeneKey);

    } catch (error) {
        console.error('Error loading wheel:', error);
        document.getElementById('wheel-container').innerHTML =
            '<p style="color: var(--text-secondary);">Unable to load wheel visualization</p>';
    }
}

/**
 * Render the 64-segment Gene Keys wheel
 * @param {Array} segments - Array of segment data
 * @param {number} highlightGeneKey - Gene Key to highlight
 */
function renderWheel(segments, highlightGeneKey) {
    const container = document.getElementById('wheel-container');
    const size = 500;
    const center = size / 2;
    const outerRadius = 220;
    const innerRadius = 80;
    const segmentAngle = (2 * Math.PI) / 64;

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

    // Create gradient definitions
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Normal segment gradient
    const normalGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    normalGradient.setAttribute('id', 'normalGradient');
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#FFF4E6');
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#FFE8B8');
    normalGradient.appendChild(stop1);
    normalGradient.appendChild(stop2);

    // Highlighted segment gradient
    const highlightGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    highlightGradient.setAttribute('id', 'highlightGradient');
    const hStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    hStop1.setAttribute('offset', '0%');
    hStop1.setAttribute('stop-color', '#FFB800');
    const hStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    hStop2.setAttribute('offset', '100%');
    hStop2.setAttribute('stop-color', '#FF8C42');
    highlightGradient.appendChild(hStop1);
    highlightGradient.appendChild(hStop2);

    defs.appendChild(normalGradient);
    defs.appendChild(highlightGradient);
    svg.appendChild(defs);

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'wheel-tooltip';
    document.body.appendChild(tooltip);

    // Draw segments
    segments.forEach((segment, index) => {
        const startAngle = segment.start * (Math.PI / 180) - Math.PI / 2;
        const endAngle = segment.end * (Math.PI / 180) - Math.PI / 2;
        const midAngle = (startAngle + endAngle) / 2;

        // Calculate path for the segment
        const x1 = center + innerRadius * Math.cos(startAngle);
        const y1 = center + innerRadius * Math.sin(startAngle);
        const x2 = center + outerRadius * Math.cos(startAngle);
        const y2 = center + outerRadius * Math.sin(startAngle);
        const x3 = center + outerRadius * Math.cos(endAngle);
        const y3 = center + outerRadius * Math.sin(endAngle);
        const x4 = center + innerRadius * Math.cos(endAngle);
        const y4 = center + innerRadius * Math.sin(endAngle);

        const pathData = `
            M ${x1} ${y1}
            L ${x2} ${y2}
            A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3}
            L ${x4} ${y4}
            A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1}
            Z
        `;

        // Create segment path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'wheel-segment');

        const isHighlighted = segment.geneKey === highlightGeneKey;
        path.setAttribute('fill', isHighlighted ? 'url(#highlightGradient)' : 'url(#normalGradient)');
        path.setAttribute('stroke', '#FFFFFF');
        path.setAttribute('stroke-width', '1');

        if (isHighlighted) {
            path.classList.add('highlighted');
        }

        // Add hover effects
        path.addEventListener('mouseenter', (e) => {
            const rect = e.target.getBoundingClientRect();
            tooltip.innerHTML = `
                <strong>Gene Key ${segment.geneKey}</strong><br>
                Shadow: ${segment.shadow}<br>
                Gift: ${segment.gift}<br>
                Siddhi: ${segment.siddhi}
            `;
            tooltip.style.left = rect.left + rect.width / 2 + 'px';
            tooltip.style.top = rect.top - 10 + 'px';
            tooltip.style.transform = 'translate(-50%, -100%)';
            tooltip.classList.add('active');
        });

        path.addEventListener('mouseleave', () => {
            tooltip.classList.remove('active');
        });

        svg.appendChild(path);

        // Add text label (Gene Key number)
        const textRadius = (innerRadius + outerRadius) / 2;
        const textX = center + textRadius * Math.cos(midAngle);
        const textY = center + textRadius * Math.sin(midAngle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('class', 'wheel-text');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', isHighlighted ? '#FFFFFF' : '#2C2C2C');
        text.textContent = segment.geneKey;

        svg.appendChild(text);
    });

    // Add center circle
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', center);
    centerCircle.setAttribute('cy', center);
    centerCircle.setAttribute('r', innerRadius);
    centerCircle.setAttribute('fill', 'url(#highlightGradient)');
    centerCircle.setAttribute('stroke', '#FFFFFF');
    centerCircle.setAttribute('stroke-width', '2');
    svg.appendChild(centerCircle);

    // Add center text
    const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerText.setAttribute('x', center);
    centerText.setAttribute('y', center);
    centerText.setAttribute('text-anchor', 'middle');
    centerText.setAttribute('dominant-baseline', 'middle');
    centerText.setAttribute('font-size', '36');
    centerText.setAttribute('font-weight', 'bold');
    centerText.setAttribute('fill', '#FFFFFF');
    centerText.textContent = highlightGeneKey;
    svg.appendChild(centerText);

    // Clear and append
    container.innerHTML = '';
    container.appendChild(svg);
}

/**
 * Handle city input and show autocomplete suggestions
 */
let citySearchTimeout;
async function handleCityInput(e) {
    const query = e.target.value;

    if (query.length < 2) {
        citySuggestions.classList.remove('active');
        return;
    }

    clearTimeout(citySearchTimeout);

    citySearchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/cities/search?q=${encodeURIComponent(query)}&limit=10`);
            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();

            citySuggestions.innerHTML = '';

            if (data.cities && data.cities.length > 0) {
                data.cities.forEach(city => {
                    const item = document.createElement('div');
                    item.className = 'city-suggestion-item';
                    item.innerHTML = `<strong>${city.city}</strong>, <small>${city.country}</small>`;
                    item.addEventListener('click', () => {
                        birthPlaceInput.value = city.label;
                        citySuggestions.classList.remove('active');
                    });
                    citySuggestions.appendChild(item);
                });
                citySuggestions.classList.add('active');
            } else {
                citySuggestions.classList.remove('active');
            }
        } catch (error) {
            console.error('City search error:', error);
            citySuggestions.classList.remove('active');
        }
    }, 300);
}

/**
 * Show loading overlay
 */
function showLoading() {
    loading.classList.add('active');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    loading.classList.remove('active');
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorText.textContent = message;
    errorOverlay.classList.add('active');
}

/**
 * Hide error message
 */
function hideError() {
    errorOverlay.classList.remove('active');
}

/**
 * Show input section
 */
function showInputSection() {
    resultsSection.classList.remove('active');
    inputSection.classList.add('active');

    // Clean up tooltip if it exists
    const existingTooltip = document.querySelector('.wheel-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
}

/**
 * Show results section
 */
function showResultsSection() {
    inputSection.classList.remove('active');
    resultsSection.classList.add('active');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
