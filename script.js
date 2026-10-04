// =============================================
// CONFIGURAÇÕES (JÁ PREENCHIDAS COM SEUS DADOS)
const TURNSTILE_SITE_KEY = '0x4AAAAAADhe9cpabGDf6_Ge';
const BACKEND_URL = 'https://presente.rogeralbuquerque58.workers.dev';
// =============================================

const giftBox = document.getElementById('giftBox');
const loadingOverlay = document.getElementById('loadingOverlay');
const sparkleContainer = document.getElementById('sparkleContainer');
const confettiContainer = document.getElementById('confettiContainer');
const openFlash = document.getElementById('openFlash');

let turnstileWidgetId = null;
let isOpening = false;

// ========== PARTÍCULAS DE FUNDO ==========
const canvas = document.getElementById('particlesCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const PARTICLE_COUNT = 70;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2.5 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3 - 0.2;
    this.opacity = Math.random() * 0.6 + 0.2;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) {
      this.y = canvas.height;
      this.x = Math.random() * canvas.width;
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${this.opacity})`;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

for (let i = 0; i < PARTICLE_COUNT; i++) {
  particles.push(new Particle());
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ========== PARTÍCULAS ORBITAIS ==========
function createOrbitalSparkles() {
  sparkleContainer.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const spark = document.createElement('div');
    spark.className = 'orbital-spark';
    spark.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: gold;
      border-radius: 50%;
      box-shadow: 0 0 12px gold;
      opacity: 0;
      animation: orbitFloat ${2 + Math.random() * 2}s ease-in-out infinite;
      animation-delay: ${Math.random() * 2}s;
    `;
    sparkleContainer.appendChild(spark);
  }
}
createOrbitalSparkles();

const orbitalStyle = document.createElement('style');
orbitalStyle.textContent = `
  @keyframes orbitFloat {
    0% { transform: translate(-50%, -50%) rotate(0deg) translateX(140px) rotate(0deg); opacity: 0; }
    30% { opacity: 1; }
    70% { opacity: 0.8; }
    100% { transform: translate(-50%, -50%) rotate(360deg) translateX(140px) rotate(-360deg); opacity: 0; }
  }
`;
document.head.appendChild(orbitalStyle);

// ========== TURNSTILE ==========
function onTurnstileLoad() {
  turnstileWidgetId = turnstile.render('#giftBox', {
    sitekey: TURNSTILE_SITE_KEY,
    callback: handleVerificationSuccess,
    'error-callback': () => {
      alert('Falha na verificação de segurança. Recarregue a página.');
      resetAll();
    },
    theme: 'dark',
    size: 'invisible'
  });
}

// ========== ANIMAÇÃO INICIAL ==========
function startImmediateAnimation() {
  giftBox.style.transform = 'scale(0.9)';
  giftBox.style.filter = 'brightness(1.4) drop-shadow(0 0 30px gold)';
  giftBox.classList.add('opening');

  const lid = document.querySelector('.gift-lid');
  lid.style.transition = 'transform 0.05s';
  let count = 0;
  const vibrate = setInterval(() => {
    lid.style.transform = `translateX(${count % 2 === 0 ? 4 : -4}px)`;
    count++;
    if (count > 5) {
      clearInterval(vibrate);
      lid.style.transform = '';
      lid.style.transition = 'transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
  }, 50);

  loadingOverlay.style.display = 'flex';
}

// ========== SUCESSO NA VERIFICAÇÃO ==========
async function handleVerificationSuccess(token) {
  if (isOpening) return;
  isOpening = true;

  loadingOverlay.style.display = 'none';

  giftBox.classList.add('lid-off');
  giftBox.classList.add('flash');
  spawnConfetti();

  try {
    const response = await fetch(`${BACKEND_URL}/get-redirect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!response.ok) throw new Error('Verificação falhou');

    const data = await response.json();
    if (data.success && data.redirect_url) {
      if (typeof gtag === 'function') {
        gtag('event', 'redirect_telegram', {
          event_category: 'conversao',
          event_label: 'site_fadinha'
        });
      }
      if (typeof fbq === 'function') {
        fbq('trackCustom', 'RedirecionamentoTelegram', { destino: 'telegram' });
      }

      await sleep(200);
      window.location.href = data.redirect_url;
    } else {
      throw new Error('Resposta inválida');
    }
  } catch (error) {
    console.error(error);
    alert('Ocorreu um erro. Tente novamente.');
    resetAll();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== CONFETES ==========
function spawnConfetti() {
  const colors = ['#f1c40f', '#e74c3c', '#8e44ad', '#2ecc71', '#f39c12', '#d946ef'];
  for (let i = 0; i < 70; i++) {
    const confetti = document.createElement('div');
    const size = Math.random() * 10 + 5;
    confetti.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size * 0.6}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
      opacity: 1;
      border-radius: 2px;
      pointer-events: none;
      animation: confetti-fall ${1.5 + Math.random() * 2}s ease-out forwards;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    confettiContainer.appendChild(confetti);
  }

  setTimeout(() => {
    confettiContainer.innerHTML = '';
  }, 3000);
}

const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
  @keyframes confetti-fall {
    0% {
      transform: translate(-50%, -50%) rotate(0deg) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(calc(-50% + ${Math.random() * 400 - 200}px), calc(-50% + 600px)) rotate(${Math.random() * 720}deg) scale(0.5);
      opacity: 0;
    }
  }
`;
document.head.appendChild(confettiStyle);

// ========== RESET ==========
function resetAll() {
  isOpening = false;
  giftBox.classList.remove('opening', 'lid-off', 'flash');
  giftBox.style.transform = '';
  giftBox.style.filter = '';
  loadingOverlay.style.display = 'none';
  confettiContainer.innerHTML = '';
  if (turnstileWidgetId) turnstile.reset(turnstileWidgetId);
}

// ========== CLIQUE ==========
giftBox.addEventListener('click', () => {
  if (isOpening) return;
  startImmediateAnimation();
});
