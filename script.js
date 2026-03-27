const textarea = document.getElementById('namesTextarea');
const wheel = document.getElementById('wheel');
const wheelLabels = document.getElementById('wheel-labels');
const wheelSvgText = document.querySelector('.wheel-svg-text');
const entriesCount = document.getElementById('entriesCount');
const resultsCount = document.getElementById('resultsCount');

const winnerModal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const removeWinnerBtn = document.getElementById('removeWinnerBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

let names = [];
let results = [];
let removedCount = 0;
// Darker/vibrant colors that pop on the dark theme
const colors = [
    '#3369e8', '#d50f25', '#eeb211', '#009925', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899'
];

let currentRotation = 0;
let isSpinning = false;
let currentWinnerIndex = -1;

textarea.addEventListener('input', updateNamesFromTextarea);

let inputTimeout;
function updateNamesFromTextarea() {
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(() => {
        const text = textarea.value;
        names = text.split('\n').map(n => n.trim()).filter(n => n !== '');
        entriesCount.textContent = names.length;
        renderWheel();
    }, 150); // Small 150ms debounce
}

function renderWheel() {
    if (names.length === 0) {
        wheel.style.background = '#1d1d1d';
        wheelLabels.innerHTML = '';
        return;
    }

    // 1. Generate conic gradient
    const slicePercentage = 100 / names.length;
    let gradientParts = [];
    for (let i = 0; i < names.length; i++) {
        const color = colors[i % colors.length];
        const startPercent = i * slicePercentage;
        const endPercent = (i + 1) * slicePercentage;
        gradientParts.push(`${color} ${startPercent.toFixed(2)}% ${endPercent.toFixed(2)}%`);
    }
    wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;

    // 2. Add labels
    wheelLabels.innerHTML = '';
    const sliceAngle = 360 / names.length;
    
    let fontSize = Math.max(16, Math.min(42, Math.floor(1200 / names.length)));
    
    names.forEach((name, i) => {
        const labelAngle = (i * sliceAngle) + (sliceAngle / 2);
        
        const label = document.createElement('div');
        label.className = 'name-label';
        
        // Exact mathematical fix:
        // transform-origin is 0 0. Rotate first to point down the spoke.
        // Then translate 60px outward along spoke, and -50% perpendicular to center it on the spoke line.
        label.style.transform = `rotate(${labelAngle - 90}deg) translate(60px, -50%)`;
        label.style.fontSize = `${fontSize}px`;
        
        // Dynamic string truncation 
        const maxLen = Math.max(10, Math.floor(650 / fontSize));
        label.textContent = name.length > maxLen ? name.substring(0, maxLen - 2) + '...' : name;
        wheelLabels.appendChild(label);
    });
}

// Idle Animation Loop
let idleAnimationId;
function startIdle() {
    if (isSpinning) return;
    currentRotation += 0.15; // Slow spin pace
    if (currentRotation >= 360) currentRotation -= 360;
    
    wheel.style.transition = 'none';
    wheel.style.transform = `rotate(${currentRotation}deg)`;
    
    idleAnimationId = requestAnimationFrame(startIdle);
}

function stopIdle() {
    cancelAnimationFrame(idleAnimationId);
}

function spinWheel() {
    if (names.length === 0 || isSpinning) return;
    
    stopIdle();
    isSpinning = true;
    
    // Fade out tap-to-spin instructions
    if (wheelSvgText.style.opacity !== '0') {
        wheelSvgText.style.transition = 'opacity 0.5s ease';
        wheelSvgText.style.opacity = '0';
    }
    
    const spinRotations = Math.floor(Math.random() * 5) + 5;
    const sliceAngleDeg = 360 / names.length;
    
    let winningIndex = Math.floor(Math.random() * names.length);
    
    // Rigged Logic
    if (removedCount === 0 && names.length > 1) {
        while (names[winningIndex].toLowerCase() === 'sravan') {
            winningIndex = Math.floor(Math.random() * names.length);
        }
    }
    if (removedCount === 1) {
        const sravanIndex = names.findIndex(n => n.toLowerCase() === 'sravan');
        if (sravanIndex !== -1) {
            winningIndex = sravanIndex;
        }
    }
    
    // Pointer is strictly at 3 o'clock natively.
    // However, SVG "Tap to spin" overlay doesn't rotate with the wheel. 
    // Wait, the wheel is rotated. If we rotate the wheel, does the SVG rotate?
    // YES, because we rotate the `.wheel` container itself. So the text will spin too, 
    // which exactly matches the reference behavior.
    
    const sliceCenter = (winningIndex * sliceAngleDeg) + (sliceAngleDeg / 2);
    const targetBaseRotation = 90 - sliceCenter;
    const sliceOffset = (Math.random() - 0.5) * (sliceAngleDeg * 0.8);
    const finalTargetAngle = targetBaseRotation + sliceOffset;
    
    const baseCurrent = currentRotation % 360;
    const diffToZero = 360 - baseCurrent;
    let totalRotation = currentRotation + diffToZero + (spinRotations * 360) + finalTargetAngle;
    
    // MUST restore transition before setting the transform!
    wheel.style.transition = 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)';
    // Force a browser reflow so the transition is picked up
    void wheel.offsetWidth;
    
    wheel.style.transform = `rotate(${totalRotation}deg)`;
    currentRotation = totalRotation;
    currentWinnerIndex = winningIndex;
    
    setTimeout(() => {
        showWinner(winningIndex);
    }, 5100);
}

function showWinner(index) {
    winnerText.textContent = names[index];
    winnerModal.classList.add('show');
    
    // Fire confetti poppers
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            zIndex: 4000 // Over the modal
        });
    }
}

removeWinnerBtn.onclick = () => {
    winnerModal.classList.remove('show');
    const winner = names[currentWinnerIndex];
    
    results.push(winner);
    resultsCount.textContent = results.length;
    
    const text = textarea.value.split('\n').map(n => n.trim()).filter(n => n !== '');
    text.splice(currentWinnerIndex, 1);
    textarea.value = text.join('\n');
    
    removedCount++;
    isSpinning = false;
    resetWheelInstantly();
};

closeModalBtn.onclick = () => {
    winnerModal.classList.remove('show');
    isSpinning = false;
};

function resetWheelInstantly() {
    // Retain current visual rotation when stopping
    currentRotation = currentRotation % 360;
    wheel.style.transition = 'none';
    wheel.style.transform = `rotate(${currentRotation}deg)`;
    
    updateNamesFromTextarea();
    startIdle(); // Resume idle spin seamlessly
}

// Utilities (Shuffle / Sort)
document.getElementById('shuffleBtn').onclick = () => {
    const lines = textarea.value.split('\n').filter(n => n.trim() !== '');
    for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    textarea.value = lines.join('\n');
    updateNamesFromTextarea();
};

document.getElementById('sortBtn').onclick = () => {
    const lines = textarea.value.split('\n').filter(n => n.trim() !== '');
    lines.sort((a, b) => a.localeCompare(b));
    textarea.value = lines.join('\n');
    updateNamesFromTextarea();
};

// Initial state
textarea.value = "Ali\nBeatriz\nCharles\nDiya\nEric\nFatima\nGabriel\nHanna\nSravan";
updateNamesFromTextarea();
removedCount = 0;
startIdle(); // Start animation on load
