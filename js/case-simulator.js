// CS2 Case Simulator Logic

const API_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json';

// Game State
let state = {
    balance: parseInt(localStorage.getItem('csai_balance')) || 1000,
    cases: [],
    currentCase: null,
    isOpening: false,
    inventory: JSON.parse(localStorage.getItem('csai_inventory')) || []
};

// DOM Elements
const balanceEl = document.getElementById('balance-display');
const casesGrid = document.getElementById('cases-grid');
const rouletteContainer = document.getElementById('roulette-container');
const rouletteTrack = document.getElementById('roulette-track');
const openBtn = document.getElementById('open-btn');
const winnerModal = document.getElementById('winner-modal');
const winnerInfo = document.getElementById('winner-info');
const winnerImage = document.getElementById('winner-image');
const closeModalBtn = document.getElementById('close-modal');

// Probability Weights (Standard Valve Odds)
const ODDS = {
    'Mil-Spec Grade': 0.7992,
    'Restricted': 0.1598,
    'Classified': 0.0320,
    'Covert': 0.0064,
    'Special': 0.0026
};

// Rarity Colors
const RARITY_COLORS = {
    'Mil-Spec Grade': '#4b69ff',   // Blue
    'Restricted': '#8847ff',       // Purple
    'Classified': '#d32ce6',       // Pink
    'Covert': '#eb4b4b',           // Red
    'Special': '#ffd700',          // Gold
    'Base Grade': '#b0c3d9'        // Common
};

const emptyInventoryMsg = document.getElementById('empty-inventory-msg');
const inventoryGrid = document.getElementById('inventory-grid');
const inventoryModal = document.getElementById('inventory-modal');
const openInventoryBtn = document.getElementById('open-inventory-btn');
const closeInventoryBtn = document.getElementById('close-inventory-btn');

// AUDIO SYSTEM (Realistic Mechanics)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Create white noise buffer for mechanical clicks
const bufferSize = audioCtx.sampleRate * 2.0; // 2 seconds
const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
const output = noiseBuffer.getChannelData(0);
for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
}

function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;

    // 1. The "Click" - High-pitched sharp pop
    const oscClick = audioCtx.createOscillator();
    const gainClick = audioCtx.createGain();
    oscClick.type = 'square';
    oscClick.frequency.setValueAtTime(1200, now);
    oscClick.connect(gainClick);
    gainClick.connect(audioCtx.destination);
    gainClick.gain.setValueAtTime(0, now);
    gainClick.gain.linearRampToValueAtTime(0.05, now + 0.001);
    gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    oscClick.start(now);
    oscClick.stop(now + 0.015);

    // 2. The "Tok" - Deep muffled burst
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    const noiseGain = audioCtx.createGain();

    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(400, now);
    noiseFilter.Q.value = 5; // Resonant thud

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noiseSource.start(now);
    noiseSource.stop(now + 0.1);
}

// Win sound using real audio file (Gun Hammer Click - CC0 from Freesound)
const winSoundUrl = 'https://cdn.freesound.org/previews/523/523087_11537497-lq.mp3';
let winSoundBuffer = null;

// Preload win sound for instant playback
fetch(winSoundUrl)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
    .then(buffer => { winSoundBuffer = buffer; })
    .catch(err => console.log('Win sound preload failed, will use fallback'));

function playWinSound(rarity) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (winSoundBuffer) {
        // Play preloaded audio buffer
        const source = audioCtx.createBufferSource();
        const gainNode = audioCtx.createGain();
        source.buffer = winSoundBuffer;
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.value = 1.0; // Full volume
        source.start(0);
    } else {
        // Fallback: use HTML5 Audio
        const audio = new Audio(winSoundUrl);
        audio.volume = 1.0;
        audio.play().catch(e => console.log('Audio play failed'));
    }
}


// Initialization
async function init() {
    updateBalanceDisplay();
    renderInventory();
    await fetchCases();
    renderCases();
}

// Data Fetching
async function fetchCases() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        // Filter for actual weapon cases (avoiding pins, sticker capsules for now for simpler logic, or include all)
        // Filtering for items that have 'type': 'Case'
        state.cases = data.filter(item => item.type === 'Case' && item.contains && item.contains.length > 0).slice(0, 50); // Limit to 50 for performance
    } catch (error) {
        console.error('Failed to load cases:', error);
        // Fallback or error message
        casesGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">Failed to load market data. Please refresh.</p>';
    }
}

// Actions
function updateBalanceDisplay() {
    balanceEl.textContent = state.balance.toLocaleString();
    const mainBalanceEl = document.getElementById('csai-balance-display-main');
    if (mainBalanceEl) mainBalanceEl.textContent = state.balance.toLocaleString();
    localStorage.setItem('csai_balance', state.balance);
}

function selectCase(caseId) {
    state.currentCase = state.cases.find(c => c.id === caseId);

    // Update UI to show selected case details
    document.getElementById('selected-case-name').textContent = state.currentCase.name;
    document.getElementById('selected-case-img').src = state.currentCase.image;
    document.getElementById('selected-case-img').classList.remove('hidden');

    // Reset Roulette
    rouletteTrack.innerHTML = '';
    rouletteTrack.style.transition = 'none';
    rouletteTrack.style.transform = 'translateX(0)';

    // Enable Open Button if enough balance
    openBtn.disabled = state.balance < 100;

    // Scroll to simulator section
    document.getElementById('simulator-section').scrollIntoView({ behavior: 'smooth' });
}

function determineRarity() {
    const rand = Math.random();
    let cumulative = 0;
    for (const [rarity, chance] of Object.entries(ODDS)) {
        cumulative += chance;
        if (rand <= cumulative) return rarity;
    }
    return 'Mil-Spec Grade';
}

function getWeightedItem(crate) {
    const targetRarity = determineRarity();

    // Filter items by rarity
    let possibleItems = crate.contains.filter(item => item.rarity.name === targetRarity);

    // Fallback if rarity doesn't exist in case (e.g. some cases don't have special items listed in 'contains' sometimes)
    if (possibleItems.length === 0) {
        // Fallback to purely random or common
        possibleItems = crate.contains;
    }

    return possibleItems[Math.floor(Math.random() * possibleItems.length)];
}

function openCase() {
    if (state.isOpening || state.balance < 100 || !state.currentCase) return;

    // Start Audio Context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Deduct Balance
    state.balance -= 100;
    updateBalanceDisplay();
    state.isOpening = true;
    openBtn.disabled = true;
    openBtn.textContent = "OPENING...";

    const winningItem = getWeightedItem(state.currentCase);

    // Generate Tape
    const WIN_INDEX = 35;
    const TOTAL_ITEMS = 45;
    const CARD_WIDTH = 160;
    const tapeItems = [];

    for (let i = 0; i < TOTAL_ITEMS; i++) {
        if (i === WIN_INDEX) {
            tapeItems.push(winningItem);
        } else {
            const randomItem = state.currentCase.contains[Math.floor(Math.random() * state.currentCase.contains.length)];
            tapeItems.push(randomItem);
        }
    }

    // --- IMAGE PRELOADING FOR STABILITY ---
    const preloadImages = items => {
        items.forEach(item => {
            const img = new Image();
            img.src = item.image;
        });
    };
    preloadImages(tapeItems);

    renderTape(tapeItems);

    // --- RESET ANIMATION STATE ---
    rouletteTrack.style.transition = 'none';
    rouletteTrack.style.transform = 'translateX(0)';
    void rouletteTrack.offsetWidth;

    // --- ANIMATION START ---

    // We need to track the position for audio.
    // Since we are using CSS transition, we can't easily get the exact JS position per frame without getComputedStyle which is expensive.
    // OPTIMIZATION: Use requestAnimationFrame to poll position. 
    // The visual animation is handled by CSS, we just read it to play sound.

    const containerWidth = rouletteContainer.offsetWidth; // Needed? No, track moves relative to itself.
    // The "center line" is at padding-left (which is 50% of container). 
    // The track starts at 0. Items move LEFT. 
    // Item 0 starts at center. Item 1 is at 160px.
    // As track moves -160px, Item 1 hits center.
    // So every multiple of 160px (CARD_WIDTH) crossing the "current scroll" is a click.

    let lastScrollPos = 0;
    const winnerCenterFromStart = (WIN_INDEX * 160) + 80;
    const finishPosition = -1 * winnerCenterFromStart;

    // Animate
    setTimeout(() => {
        rouletteTrack.style.transition = 'transform 6s cubic-bezier(0.15, 0.25, 0.05, 1)';
        rouletteTrack.style.transform = `translateX(${finishPosition}px)`;

        // Start Audio Loop
        const startTime = Date.now();
        const duration = 6000;

        function trackAudio() {
            if (!state.isOpening) return;

            // Get current transform value
            // Getting it from computed style is the only accurate way for CSS transitions
            const style = window.getComputedStyle(rouletteTrack);
            const matrix = new DOMMatrix(style.transform);
            const currentTranslateX = matrix.m41; // Current X position (negative value)

            // We are moving from 0 to finishPosition (e.g. -5000)
            // Distance traveled = Math.abs(currentTranslateX)
            const dist = Math.abs(currentTranslateX);

            // Current boundary crossing
            // Cards are 160px wide. Item 0 is centered at 0.
            // Boundaries are at 80, 240, 400... 
            // So we click when we cross (dist + 80) / 160
            const currentIndex = Math.floor((dist + 80) / CARD_WIDTH);
            const lastIndex = Math.floor((Math.abs(lastScrollPos) + 80) / CARD_WIDTH);

            if (currentIndex > lastIndex) {
                playClickSound();
            }

            lastScrollPos = currentTranslateX;

            if (Date.now() - startTime < duration) {
                requestAnimationFrame(trackAudio);
            }
        }

        requestAnimationFrame(trackAudio);

    }, 50);

    // Show Result
    setTimeout(() => {
        state.isOpening = false;
        openBtn.disabled = false;
        openBtn.textContent = "OPEN ANOTHER (100 CSAI)";

        playClickSound(); // Final settling click
        playWinSound(winningItem.rarity.name); // Pass rarity for specific sound
        showWinner(winningItem);

        // Add to inventory
        state.inventory.unshift(winningItem);
        localStorage.setItem('csai_inventory', JSON.stringify(state.inventory));
        renderInventory(); // Update inventory view
    }, 6500);
}

// Rendering
function renderCases() {
    casesGrid.innerHTML = state.cases.map(c => `
        <div class="glass-premium p-4 rounded-xl cursor-pointer hover:scale-105 transition-transform duration-300 flex flex-col items-center" 
             onclick="selectCase('${c.id}')">
            <img src="${c.image}" alt="${c.name}" loading="lazy" class="w-32 h-24 object-contain mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <h3 class="font-bold text-center text-sm truncate w-full">${c.name}</h3>
            <span class="text-xs text-gray-400 mt-1">100 CSAI</span>
        </div>
    `).join('');
}

function renderInventory() {
    if (state.inventory.length === 0) {
        if (emptyInventoryMsg) emptyInventoryMsg.style.display = 'block';
        return;
    }

    if (emptyInventoryMsg) emptyInventoryMsg.style.display = 'none';

    // We'll just prepend new items or re-render. Since logic is simple, re-render first 12 items.
    // Or render ALL items.
    inventoryGrid.innerHTML = state.inventory.slice(0, 24).map(item => {
        const color = RARITY_COLORS[item.rarity.name] || '#b0c3d9';
        return `
        <div class="glass p-3 rounded-xl flex flex-col items-center relative overflow-hidden group hover:bg-white/5 transition">
             <div class="absolute inset-0 opacity-10 bg-gradient-to-b from-transparent to-[${color}]"></div>
            <img src="${item.image}" loading="lazy" class="w-24 h-16 object-contain mb-2 z-10">
            <h3 class="font-bold text-center text-xs truncate w-full" style="color: ${color}">${item.name}</h3>
             <span class="text-[10px] text-gray-500">${item.rarity.name}</span>
        </div>
    `}).join('');
}

function renderTape(items) {
    rouletteTrack.innerHTML = items.map(item => {
        const color = RARITY_COLORS[item.rarity.name] || '#b0c3d9';
        return `
        <div class="flex-shrink-0 w-[150px] h-[150px] mx-[5px] glass border-b-4 flex flex-col items-center justify-center relative overflow-hidden group"
             style="border-color: ${color};">
             
            <!-- Rarity Glow Background -->
            <div class="absolute inset-0 opacity-10 bg-gradient-to-b from-transparent to-[${color}]"></div>
            
            <img src="${item.image}" class="w-28 h-20 object-contain z-10 relative" alt="${item.name}">
            
            <div class="absolute bottom-2 w-full text-center px-1">
                <p class="text-[10px] text-gray-300 truncate">${item.name.split('|')[0]}</p>
                <p class="text-xs font-bold truncate" style="color: ${color}">${item.name.split('|')[1] || item.name}</p>
            </div>
        </div>
    `}).join('');
}

function showWinner(item) {
    const color = RARITY_COLORS[item.rarity.name] || '#b0c3d9';
    winnerInfo.innerHTML = `
        <h2 class="text-2xl font-bold mb-2 text-white">YOU WON!</h2>
        <h3 class="text-xl font-bold mb-4" style="color: ${color}; text-shadow: 0 0 20px ${color}">${item.name}</h3>
        <p class="text-gray-400 text-sm mb-6">${item.rarity.name}</p>
    `;
    winnerImage.src = item.image;
    winnerModal.classList.remove('hidden');
    winnerModal.classList.add('flex');
}

// Event Listeners
openBtn.addEventListener('click', openCase);
closeModalBtn.addEventListener('click', () => {
    winnerModal.classList.add('hidden');
    winnerModal.classList.remove('flex');
});

// Inventory Modal Controls
openInventoryBtn.addEventListener('click', () => {
    inventoryModal.classList.remove('hidden');
    inventoryModal.classList.add('flex');
    renderInventory();
});

closeInventoryBtn.addEventListener('click', () => {
    inventoryModal.classList.add('hidden');
    inventoryModal.classList.remove('flex');
});

// Run
init();
