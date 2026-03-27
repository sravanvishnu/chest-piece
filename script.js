const nameInput = document.getElementById('nameInput');
const addNameBtn = document.getElementById('addNameBtn');
const namesList = document.getElementById('namesList');
const nameCount = document.getElementById('nameCount');
const spinBtn = document.getElementById('spinBtn');
const wheelCanvas = document.getElementById('wheelCanvas');
const ctx = wheelCanvas.getContext('2d');
const winnerModal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const closeModalBtn = document.getElementById('closeModalBtn');

let names = [];
let removedCount = 0;
const colors = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7', 
    '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
    '#06b6d4', '#14b8a6', '#10b981', '#22c55e',
    '#84cc16', '#eab308', '#f59e0b', '#f97316'
];

let currentRotation = 0;
let isSpinning = false;
let wheelRadius = wheelCanvas.width / 2;
let centerX = wheelCanvas.width / 2;
let centerY = wheelCanvas.height / 2;

function resizeCanvas() {
    const container = document.querySelector('.wheel-container');
    const size = Math.min(container.clientWidth, 500); // Max 500px, but shrinks on mobile
    if (size > 0) {
        const dpr = window.devicePixelRatio || 1;
        const targetWidth = Math.floor(size * dpr);
        
        if (wheelCanvas.width !== targetWidth || wheelCanvas.style.width !== `${size}px`) {
            wheelCanvas.width = targetWidth;
            wheelCanvas.height = targetWidth;
            wheelCanvas.style.width = `${size}px`;
            wheelCanvas.style.height = `${size}px`;
            
            ctx.scale(dpr, dpr);
            
            wheelRadius = size / 2;
            centerX = size / 2;
            centerY = size / 2;
            if (!isSpinning) drawWheel();
        }
    }
}
window.addEventListener('resize', resizeCanvas);

// Add Name Event
addNameBtn.addEventListener('click', addName);
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addName();
});

function addName() {
    const name = nameInput.value.trim();
    if (name) {
        names.push(name);
        nameInput.value = '';
        updateNamesList();
        drawWheel();
        updateSpinBtn();
    }
}

function removeName(index) {
    if (isSpinning) return; // Prevent removal while spinning
    names.splice(index, 1);
    updateNamesList();
    drawWheel();
    updateSpinBtn();
}

function updateNamesList() {
    namesList.innerHTML = '';
    nameCount.textContent = names.length;
    
    names.forEach((name, index) => {
        const li = document.createElement('li');
        li.className = 'name-item';
        
        const span = document.createElement('span');
        span.textContent = name;
        
        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.innerHTML = '✖';
        btn.onclick = () => removeName(index);
        
        li.appendChild(span);
        li.appendChild(btn);
        namesList.appendChild(li);
    });
}

function updateSpinBtn() {
    spinBtn.disabled = names.length === 0 || isSpinning;
}

function drawWheel() {
    // Clear Canvas
    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    
    if (names.length === 0) {
        // Draw empty placeholder
        ctx.beginPath();
        ctx.arc(centerX, centerY, wheelRadius - 10, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        const emptyFontSize = Math.max(16, Math.floor((wheelRadius * 2 / 500) * 24));
        ctx.font = `${emptyFontSize}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Add names to start', centerX, centerY);
        return;
    }
    
    const sliceAngle = (2 * Math.PI) / names.length;
    
    for (let i = 0; i < names.length; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, wheelRadius - 10, startAngle, endAngle);
        ctx.closePath();
        
        // Fill color
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        
        // Border
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
        
        // Draw Text
        ctx.save();
        ctx.translate(centerX, centerY);
        // Rotate to the middle of the slice
        ctx.rotate(startAngle + sliceAngle / 2);
        
        ctx.fillStyle = '#ffffff';
        const fontSize = Math.max(12, Math.floor((wheelRadius * 2 / 500) * 20));
        ctx.font = `bold ${fontSize}px Inter`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        // Position text near the edge
        const textRadius = wheelRadius - 30;
        
        // Truncate long names slightly if needed, but standard fillText is fine for simple view
        let text = names[i];
        if (text.length > 20) text = text.substring(0, 17) + '...';
        
        ctx.fillText(text, textRadius, 0);
        ctx.restore();
    }
    
    // Draw Center Dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
}

spinBtn.addEventListener('click', () => {
    if (names.length === 0 || isSpinning) return;
    
    isSpinning = true;
    updateSpinBtn();
    
    // Calculate winning index and angles
    const spinRotations = Math.floor(Math.random() * 5) + 5; // 5 to 9 extra rotations
    const sliceAngleDeg = 360 / names.length;
    
    // Pick a random winner
    let winningIndex = Math.floor(Math.random() * names.length);
    
    // Rig the spinner: prevent Sravan from being removed first, keep him for the second spin
    if (removedCount === 0 && names.length > 1) {
        while (names[winningIndex].toLowerCase().trim() === 'sravan') {
            winningIndex = Math.floor(Math.random() * names.length);
        }
    }
    
    // Rig the spinner: the second person removed will be "sravan" if he is in the list
    if (removedCount === 1) { // One person already removed means this is the 2nd removal
        const sravanIndex = names.findIndex(n => n.toLowerCase().trim() === 'sravan');
        if (sravanIndex !== -1) {
            winningIndex = sravanIndex;
        }
    }
    
    // We want the winning slice to end up at 0 degrees (pointing right).
    // The middle of slice i is initially at: i * sliceAngleDeg + (sliceAngleDeg / 2)
    // To get it to 0 degrees (i.e., 360), we need to rotate it by:
    // 360 - (i * sliceAngleDeg + (sliceAngleDeg / 2))
    
    // Let's also add a small random offset within the slice so it doesn't always point perfectly to the middle.
    const sliceOffset = (Math.random() - 0.5) * (sliceAngleDeg * 0.8);
    
    const targetAngle = 360 - (winningIndex * sliceAngleDeg + (sliceAngleDeg / 2)) + sliceOffset;
    
    // Total rotation to apply
    const totalRotation = (currentRotation % 360) > 0 ? 
        currentRotation + (360 - (currentRotation % 360)) + (spinRotations * 360) + targetAngle : 
        (spinRotations * 360) + targetAngle;
    
    // Animate via CSS
    wheelCanvas.style.transition = 'transform 5s cubic-bezier(0.25, 1, 0.25, 1)';
    wheelCanvas.style.transform = `rotate(${totalRotation}deg)`;
    
    currentRotation = totalRotation;
    
    // Wait for animation to finish
    setTimeout(() => {
        showWinner(winningIndex);
    }, 5100);
});

function showWinner(index) {
    const winner = names[index];
    winnerText.textContent = winner;
    
    // Show modal
    winnerModal.classList.add('show');
    
    // Setup close callback
    closeModalBtn.onclick = () => {
        winnerModal.classList.remove('show');
        isSpinning = false;
        
        // Remove winner from list
        names.splice(index, 1);
        removedCount++;
        updateNamesList();
        
        // Redraw wheel instantly with old rotation or reset rotation?
        // Resetting rotation to 0 smoothly isn't ideal, let's just reset instantly and draw without transition.
        wheelCanvas.style.transition = 'none';
        wheelCanvas.style.transform = 'rotate(0deg)';
        currentRotation = 0;
        
        drawWheel();
        updateSpinBtn();
    };
}

// Init
resizeCanvas();
updateNamesList();
updateSpinBtn();
drawWheel();
