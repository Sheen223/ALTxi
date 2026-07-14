const API_BASE_URL = 'https://altxi-production.up.railway.app';
// Hardcoded mock data and SVGs removed.
// Homepage featured flags dynamically inserted via API/CDN.


// ========== RENDER FEATURED MATCH FLAGS ==========
function renderFeaturedFlags() {
  const arg = document.getElementById('flag-argentina-featured');
  const bra = document.getElementById('flag-brazil-featured');
  if (arg) arg.innerHTML = '<img src="https://flagcdn.com/w160/ar.png" style="width:100%;height:100%;object-fit:contain;" />';
  if (bra) bra.innerHTML = '<img src="https://flagcdn.com/w160/br.png" style="width:100%;height:100%;object-fit:contain;" />';
}


// ========== COUNTDOWN TIMER ==========
function startCountdown() {
  // Set countdown to 45 minutes and 32 seconds from now
  let totalSeconds = 0 * 3600 + 45 * 60 + 32;

  function updateTimer() {
    if (totalSeconds <= 0) {
      totalSeconds = 0;
    }

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const hrsEl = document.getElementById('countdown-hrs');
    const minsEl = document.getElementById('countdown-mins');
    const secsEl = document.getElementById('countdown-secs');

    if (hrsEl) hrsEl.textContent = String(hrs).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');

    if (totalSeconds > 0) {
      totalSeconds--;
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}


// ========== RENDER MATCH CARDS ==========
async function renderMatchCards() {
  const grid = document.getElementById('matches-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="color: rgba(255,255,255,0.6); padding: 40px; text-align: center; grid-column: 1 / -1;">Loading live TxLINE fixtures...</div>';

  try {
    const res = await fetch(`${API_BASE_URL}/api/matches`);
    const matchesList = await res.json();
    
    if (!matchesList || matchesList.length === 0) {
      grid.innerHTML = '<div style="color: rgba(255,255,255,0.6); padding: 40px; text-align: center; grid-column: 1 / -1;">No matches currently scheduled.</div>';
      return;
    }

    grid.innerHTML = matchesList.slice(0, 4).map(match => {
      const isLive = match.status === 'live';

      return `
        <a href="match-briefing.html?match=${match.id}" class="match-card ${isLive ? 'match-card--live' : ''}" style="text-decoration:none;">
          <div class="match-card__status match-card__status--${match.status}">
            ${isLive ? '<span class="match-card__status-dot"></span>' : ''}
            ${isLive ? 'LIVE' : 'UPCOMING'}
          </div>

          <div class="match-card__teams">
            <div class="match-card__team">
              <img src="${match.team1.logo}" class="pm-card__logo-img" style="width: 42px; height: 42px; object-fit: contain; border-radius: 4px;" />
              <span class="match-card__team-name">${match.team1.name}</span>
            </div>

            <span class="match-card__vs">VS</span>

            <div class="match-card__team">
              <img src="${match.team2.logo}" class="pm-card__logo-img" style="width: 42px; height: 42px; object-fit: contain; border-radius: 4px;" />
              <span class="match-card__team-name">${match.team2.name}</span>
            </div>
          </div>

          ${isLive ? `
            <div class="match-card__score">
              <span class="match-card__score-text">${match.score}</span>
            </div>
            <div class="match-card__minute">Live</div>
          ` : `
            <div class="match-card__time">${match.time}</div>
          `}
        </a>
      `;
    }).join('');
  } catch(err) {
    console.error("ALTIX DEBUG: Failed to fetch API", err);
    grid.innerHTML = '<div style="color: #ff0033; padding: 40px; text-align: center; grid-column: 1 / -1;">Failed to load match schedules from backend.</div>';
  }
}


// ========== NAVBAR SCROLL EFFECT ==========
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}


// ========== MATCH CARD HOVER TILT EFFECT ==========
function initCardTilt() {
  const cards = document.querySelectorAll('.match-card, .featured-match__card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 25;
      const rotateY = (centerX - x) / 25;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}


// ========== MATCH CAROUSEL NAV ==========
function initMatchNav() {
  const prevBtn = document.getElementById('matches-prev');
  const nextBtn = document.getElementById('matches-next');
  const grid = document.getElementById('matches-grid');

  if (!prevBtn || !nextBtn || !grid) return;

  let page = 0;

  nextBtn.addEventListener('click', () => {
    page = Math.min(page + 1, 1);
    grid.style.transform = `translateX(-${page * 50}%)`;
    grid.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
  });

  prevBtn.addEventListener('click', () => {
    page = Math.max(page - 1, 0);
    grid.style.transform = `translateX(-${page * 50}%)`;
    grid.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
  });
}


// ========== LIVE SCORE SIMULATION ==========
function simulateLiveScores() {
  if (typeof matches === 'undefined') return;
  const liveMatches = matches.filter(m => m.status === 'live');

  setInterval(() => {
    liveMatches.forEach(match => {
      // Increment minute
      const currentMin = parseInt(match.minute);
      if (currentMin < 90) {
        match.minute = `${currentMin + 1}'`;
        const minuteEl = document.querySelector(`#match-card-${match.id} .match-card__minute`);
        if (minuteEl) {
          minuteEl.textContent = match.minute;
          minuteEl.style.color = '#c8ff00';
          setTimeout(() => {
            minuteEl.style.color = '';
          }, 500);
        }
      }
    });
  }, 60000); // Every 60 seconds, tick a minute
}


// ========== CTA BUTTON RIPPLE ==========
function initRippleEffect() {
  const cta = document.getElementById('btn-coach');
  if (!cta) return;

  cta.addEventListener('click', (e) => {
    const rect = cta.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out forwards;
      pointer-events: none;
    `;

    cta.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  // Add ripple animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(2.5);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}


// ========== PARALLAX ON HERO ==========
function initParallax() {
  const heroImg = document.querySelector('.hero__bg-image');
  const glow = document.querySelector('.hero__glow');

  if (!heroImg) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const rate = scrollY * 0.3;
    heroImg.style.transform = `translateY(${rate}px) scale(1.05)`;
    if (glow) {
      glow.style.transform = `translateY(${scrollY * 0.15}px)`;
    }
  });
}

// ========== SCROLL REVEAL FOR HOW IT WORKS ==========
function initScrollReveal() {
  const steps = document.querySelectorAll('.how-it-works__step');
  if (!steps.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger each card's appearance
        const index = Array.from(steps).indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
          entry.target.style.transition = `opacity 0.6s ease-out, transform 0.6s ease-out`;
        }, index * 150);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  steps.forEach(step => observer.observe(step));
}
// ========== BASE58 ENCODER FOR SOLANA KEYS/SIGNATURES ==========
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function encodeBase58(buffer) {
  let carry;
  let digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let val = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      val += digits[j] << 8;
      digits[j] = val % 58;
      val = Math.floor(val / 58);
    }
    while (val > 0) {
      digits.push(val % 58);
      val = Math.floor(val / 58);
    }
  }
  let string = '';
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    string += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    string += BASE58_ALPHABET[digits[i]];
  }
  return string;
}

// ========== WALLET MODAL LOGIC ==========
function initModal() {
  const modalOverlay = document.getElementById('wallet-modal');
  const btnConnectNav = document.getElementById('btn-connect-wallet-nav');
  const btnCoach = document.getElementById('btn-coach');
  const btnClose = document.getElementById('close-wallet-modal');
  const btnConnect = document.getElementById('btn-connect-wallet');

  if (!modalOverlay) return;

  function openModal(e) {
    if (e) e.preventDefault();
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (btnConnectNav) btnConnectNav.addEventListener('click', openModal);
  if (btnCoach) btnCoach.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);

  // Close on outside click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Connect button logic with Solana cryptographic verification
  if (btnConnect) {
    btnConnect.addEventListener('click', () => {
      // 1. Resolve Phantom provider (checking window.phantom.solana specifically to avoid conflicts)
      const provider = window.phantom && window.phantom.solana && window.phantom.solana.isPhantom ? window.phantom.solana : null;

      if (!provider) {
        alert("Phantom Wallet not detected! Please install the Phantom Wallet extension on your browser to sign in.");
        return;
      }

      // 2. Call connect() synchronously within the click event tick! No await before this call.
      btnConnect.disabled = true;
      btnConnect.textContent = 'Connecting...';

      provider.connect()
        .then(async (resp) => {
          const walletAddress = resp.publicKey.toString();
          console.log("ALTIX DEBUG: Target Solana wallet public key:", walletAddress);
          btnConnect.textContent = 'Fetching Nonce...';

          // 3. Fetch nonce from backend
          const nonceRes = await fetch(`${API_BASE_URL}/api/auth/nonce?wallet=${walletAddress}`);
          if (!nonceRes.ok) {
            throw new Error('Failed to retrieve authentication nonce from server');
          }
          const { nonce } = await nonceRes.json();
          console.log("ALTIX DEBUG: Retrieved auth nonce:", nonce);

          btnConnect.textContent = 'Signing Nonce...';

          // 4. Sign nonce cryptographically using the real Phantom Wallet provider
          const messageText = `ALTix Sign-In Nonce: ${nonce}`;
          const messageBytes = new TextEncoder().encode(messageText);
          const signed = await provider.signMessage(messageBytes, "utf8");
          const signatureBase58 = encodeBase58(signed.signature);

          console.log("ALTIX DEBUG: Cryptographic signature generated:", signatureBase58);
          btnConnect.textContent = 'Verifying...';

          // 5. Submit signature to login API
          const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallet: walletAddress,
              signature: signatureBase58,
              nonce
            })
          });

          if (!loginRes.ok) {
            const errData = await loginRes.json();
            throw new Error(errData.error || 'Server login verification failed');
          }

          const authData = await loginRes.json();
          console.log("ALTIX DEBUG: Cryptographic login successful. Session profiles:", authData);

          // 6. Save session token
          localStorage.setItem('altix_session_token', authData.token);
          localStorage.setItem('altix_wallet_address', walletAddress);

          btnConnect.textContent = 'CONNECTED ✓';
          btnConnect.style.background = '#c8ff00';
          btnConnect.style.color = '#0a0e14';

          setTimeout(() => {
            closeModal();
            window.location.href = 'pick-match.html';
          }, 1000);
        })
        .catch((err) => {
          console.error("ALTIX DEBUG Wallet connection error:", err);
          btnConnect.textContent = 'AUTH FAILED';
          btnConnect.style.background = '#ff0033';
          btnConnect.style.color = '#fff';
          btnConnect.disabled = false;
          
          setTimeout(() => {
            btnConnect.textContent = 'Connect';
            btnConnect.style.background = '';
            btnConnect.style.color = '';
          }, 3000);
        });
    });
  }
}

// ========== MATCH BRIEFING LOGIC ==========
async function initMatchBriefing() {
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('match');
  
  if (!document.querySelector('.page-briefing')) return;

  const leagueEl = document.getElementById('briefing-league');
  const homeLogo = document.getElementById('briefing-logo-home');
  const homeName = document.getElementById('briefing-name-home');
  const awayLogo = document.getElementById('briefing-logo-away');
  const awayName = document.getElementById('briefing-name-away');
  const descTitle = document.getElementById('briefing-desc-title');
  const acceptBtn = document.querySelector('.briefing-modal__btn');
  const countdownEl = document.getElementById('briefing-countdown');
  
  const btnHome = document.getElementById('btn-select-home');
  const btnAway = document.getElementById('btn-select-away');

  let selectedTeam = 'home';
  let matchData = null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
    if (!res.ok) throw new Error('Match not found');
    matchData = await res.json();

    leagueEl.textContent = matchData.league;
    homeLogo.src = matchData.team1.logo;
    homeName.textContent = matchData.team1.name;
    awayLogo.src = matchData.team2.logo;
    awayName.textContent = matchData.team2.name;

    if (btnHome) btnHome.textContent = matchData.team1.name;
    if (btnAway) btnAway.textContent = matchData.team2.name;

    // Countdown Logic
    if (countdownEl) {
      if (matchData.status === 'live') {
        countdownEl.textContent = "MATCH IS LIVE";
        countdownEl.style.color = "var(--accent-red)";
      } else if (matchData.timestamp) {
        setInterval(() => {
          const diff = matchData.timestamp - Date.now();
          if (diff <= 0) {
            countdownEl.textContent = "MATCH IS LIVE";
            countdownEl.style.color = "var(--accent-red)";
            return;
          }
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          countdownEl.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }, 1000);
      } else {
        countdownEl.textContent = "TBD";
      }
    }

  } catch (err) {
    console.error("ALTIX DEBUG: Failed to load match briefing data:", err);
  }

  function updateSelection() {
    if (selectedTeam === 'home') {
      if (btnHome) {
        btnHome.style.background = 'var(--accent-green)';
        btnHome.style.color = '#000';
        btnHome.style.border = 'none';
      }
      if (btnAway) {
        btnAway.style.background = 'rgba(255,255,255,0.1)';
        btnAway.style.color = '#fff';
        btnAway.style.border = '1px solid rgba(255,255,255,0.2)';
      }
      if (matchData) descTitle.textContent = `Can you coach ${matchData.team1.name} better today?`;
    } else {
      if (btnAway) {
        btnAway.style.background = 'var(--accent-green)';
        btnAway.style.color = '#000';
        btnAway.style.border = 'none';
      }
      if (btnHome) {
        btnHome.style.background = 'rgba(255,255,255,0.1)';
        btnHome.style.color = '#fff';
        btnHome.style.border = '1px solid rgba(255,255,255,0.2)';
      }
      if (matchData) descTitle.textContent = `Can you coach ${matchData.team2.name} better today?`;
    }
    
    if (acceptBtn) {
      acceptBtn.href = `formation-builder.html?match=${matchId}&team=${selectedTeam}`;
    }
  }

  if (btnHome) btnHome.addEventListener('click', () => { selectedTeam = 'home'; updateSelection(); });
  if (btnAway) btnAway.addEventListener('click', () => { selectedTeam = 'away'; updateSelection(); });
  
  updateSelection();
}

// ========== FORMATION BUILDER LOGIC ==========
async function initFormationBuilder() {
  const container = document.querySelector('.page-builder');
  if (!container) return;

  console.log("ALTIX DEBUG: initFormationBuilder started");

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('match') || '1';
  const teamSide = urlParams.get('team') || 'home';

  // Set Back / Continue URLs
  const backBtn = document.getElementById('btn-builder-back');
  const continueBtn = document.getElementById('btn-builder-continue');
  if (backBtn) backBtn.href = `match-briefing.html?match=${matchId}`;
  if (continueBtn) continueBtn.href = `game-plan.html?match=${matchId}&team=${teamSide}`;

  // Declare elements at the top
  const dropdown = document.getElementById('formation-dropdown');
  const dropdownSelected = dropdown ? dropdown.querySelector('.custom-dropdown__selected') : null;
  const selectedValSpan = document.getElementById('selected-formation-val');
  const optionsList = document.getElementById('formation-options');
  const canvas = document.getElementById('players-canvas');
  const pitch = document.getElementById('pitch-tactical');
  const roleListContainer = document.getElementById('role-selector-list');
  const generateBtn = document.getElementById('btn-generate-pitch');

  if (!canvas || !pitch || !roleListContainer || !generateBtn) {
    console.error("ALTIX DEBUG Error: Required sidebar or canvas elements not found.");
    return;
  }

  // Jersey SVGs
  const outfieldJersey = `
    <svg viewBox="0 0 100 100" class="player-jersey">
      <path d="M 28,12 L 8,24 L 20,40 L 32,28 Z" fill="#2a303c"/>
      <path d="M 72,12 L 92,24 L 80,40 L 68,28 Z" fill="#2a303c"/>
      <path d="M 28,12 L 72,12 L 72,90 L 28,90 Z" fill="#1b222c"/>
      <rect x="28" y="12" width="44" height="78" fill="#1b222c"/>
      <path d="M 40,12 Q 50,22 60,12 Z" fill="#0c1d33"/>
      <rect x="35" y="80" width="30" height="2" fill="var(--accent-green)" opacity="0.8"/>
    </svg>
  `;

  const gkJersey = `
    <svg viewBox="0 0 100 100" class="player-jersey">
      <path d="M 28,12 L 8,24 L 20,40 L 32,28 Z" fill="#1b222c"/>
      <path d="M 72,12 L 92,24 L 80,40 L 68,28 Z" fill="#1b222c"/>
      <path d="M 28,12 L 72,12 L 72,90 L 28,90 Z" fill="#1b222c"/>
      <path d="M 40,12 Q 50,22 60,12 Z" fill="#000"/>
      <rect x="35" y="24" width="30" height="2" fill="#c8ff00" opacity="0.4"/>
    </svg>
  `;

  // Players
  let players = [
    { name: 'Goalkeeper', role: 'GK', gk: true },
    { name: 'Def Left', role: 'LB' },
    { name: 'Def Center', role: 'CB' },
    { name: 'Def Center', role: 'CB' },
    { name: 'Def Right', role: 'RB' },
    { name: 'Mid Left', role: 'LCM' },
    { name: 'Mid Center', role: 'CM' },
    { name: 'Mid Right', role: 'RCM' },
    { name: 'Fwd Left', role: 'LW' },
    { name: 'Fwd Center', role: 'CF' },
    { name: 'Fwd Right', role: 'RW' }
  ];

  try {
    const squadRes = await fetch(`${API_BASE_URL}/api/matches/${matchId}/squad`);
    if (squadRes.ok) {
      const lineups = await squadRes.json();
      if (lineups && lineups.length > 0) {
        
        // Find the team name the user selected from the Briefing screen
        let targetTeamName = '';
        try {
          const matchRes = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
          if (matchRes.ok) {
            const matchData = await matchRes.json();
            targetTeamName = teamSide === 'away' ? matchData.team2.name : matchData.team1.name;
          }
        } catch (e) {}

        // Look for the lineup that matches our target team name, fallback to 0
        let targetLineup = lineups[0];
        if (targetTeamName) {
          const exactMatch = lineups.find(l => 
            l.team.name.toLowerCase().includes(targetTeamName.toLowerCase()) || 
            targetTeamName.toLowerCase().includes(l.team.name.toLowerCase())
          );
          if (exactMatch) targetLineup = exactMatch;
        } else {
          const teamIndex = teamSide === 'away' ? 1 : 0;
          targetLineup = lineups[teamIndex] || lineups[0];
        }

        const targetXI = targetLineup.startXI; 
        
        if (targetXI && targetXI.length === 11) {
          players = targetXI.map((item, index) => {
            return {
              name: item.player.name,
              role: item.player.pos, // API-Football uses G, D, M, F
              gk: item.player.pos === 'G' || index === 0
            };
          });
        }
      }
    }
  } catch (err) {
    console.error("ALTIX DEBUG: Failed to load squad from API-Football", err);
  }

  // Coordinates for formations: { name: [ [x, y], [x, y], ... ] }
  const coordinates = {
    '4-3-3': [
      [50, 88], // Martinez
      [15, 68], // Acuña
      [38, 70], // Otamendi
      [62, 70], // Romero
      [85, 68], // Montiel
      [30, 48], // Enzo
      [50, 52], // Mac Allister
      [70, 48], // De Paul
      [20, 22], // Diaz
      [80, 22], // Messi (starts as Right Forward by default)
      [50, 15]  // Alvarez (starts as Center Forward by default)
    ],
    '4-4-2': [
      [50, 88], // Martinez
      [15, 68], // Acuña
      [38, 70], // Otamendi
      [62, 70], // Romero
      [85, 68], // Montiel
      [18, 45], // Diaz (LM)
      [38, 48], // Enzo (LCM)
      [62, 48], // De Paul (RCM)
      [82, 45], // Alvarez (RM)
      [40, 20], // Mac Allister (SS)
      [60, 20]  // Messi (CF)
    ],
    '3-5-2': [
      [50, 88], // Martinez
      [28, 70], // Otamendi
      [50, 72], // Romero
      [72, 70], // Montiel
      [12, 45], // Acuña (LWB)
      [35, 54], // Enzo (DM)
      [50, 38], // Mac Allister (AM)
      [65, 54], // De Paul (DM)
      [88, 45], // Alvarez (RWB)
      [35, 18], // Diaz (CF)
      [65, 18]  // Messi (CF)
    ],
    '5-3-2': [
      [50, 88], // Martinez
      [12, 60], // Acuña (LWB)
      [30, 70], // Otamendi (LCB)
      [50, 72], // Romero (CB)
      [70, 70], // Montiel (RCB)
      [88, 60], // Alvarez (RWB)
      [30, 44], // Enzo (LCM)
      [50, 46], // Mac Allister (CM)
      [70, 44], // De Paul (RCM)
      [38, 20], // Diaz (CF)
      [62, 20]  // Messi (CF)
    ],
    '4-2-3-1': [
      [50, 88], // Martinez
      [15, 68], // Acuña
      [38, 70], // Otamendi
      [62, 70], // Romero
      [85, 68], // Montiel
      [35, 54], // Enzo (LDM)
      [65, 54], // De Paul (RDM)
      [22, 32], // Diaz (LAM)
      [50, 32], // Mac Allister (CAM)
      [78, 32], // Alvarez (RAM)
      [50, 14]  // Messi (ST)
    ]
  };

  // Position Labels mapped to coordinates index for each formation
  const positionNames = {
    '4-3-3': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LCM', 'CM', 'RCM', 'LW', 'RW', 'CF'],
    '4-4-2': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LM', 'LCM', 'RCM', 'RM', 'SS', 'CF'],
    '3-5-2': ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'LDM', 'AM', 'RDM', 'RWB', 'LCF', 'RCF'],
    '5-3-2': ['GK', 'LWB', 'LCB', 'CB', 'RCB', 'RWB', 'LCM', 'CM', 'RCM', 'LCF', 'RCF'],
    '4-2-3-1': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LDM', 'RDM', 'LAM', 'CAM', 'RAM', 'ST']
  };

  let playerAssignments = [];

  function loadAssignments(formation) {
    const saved = localStorage.getItem(`altix_assignments_${matchId}_${formation}`);
    if (saved && saved !== 'null') {
      try {
        playerAssignments = JSON.parse(saved);
        if (!Array.isArray(playerAssignments) || playerAssignments.length !== 11) {
          console.warn("ALTIX DEBUG: Invalid assignments array size/type. Resetting.");
          playerAssignments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        }
      } catch (err) {
        console.error("ALTIX DEBUG Error loading assignments JSON:", err);
        playerAssignments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      }
    } else {
      playerAssignments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }
  }

  function saveAssignments(formation) {
    localStorage.setItem(`altix_assignments_${matchId}_${formation}`, JSON.stringify(playerAssignments));
  }

  // Render players on the pitch (static visualization only)
  function renderPlayers(formation) {
    canvas.innerHTML = '';
    const coords = coordinates[formation] || coordinates['4-3-3'];

    players.forEach((player, index) => {
      // Find the slot this player index is assigned to
      const slotIndex = playerAssignments.indexOf(index);
      const coord = coords[slotIndex] || coords[0];

      const playerNode = document.createElement('div');
      playerNode.className = 'player-node';
      playerNode.style.left = `${coord[0]}%`;
      playerNode.style.top = `${coord[1]}%`;
      playerNode.setAttribute('data-index', index);
      playerNode.setAttribute('data-slot', slotIndex);

      playerNode.innerHTML = `
        <div class="player-jersey-wrapper">
          ${player.gk ? gkJersey : outfieldJersey}
        </div>
        <div class="player-name">${player.name}</div>
      `;

      canvas.appendChild(playerNode);
    });

    console.log("ALTIX DEBUG: player count", document.querySelectorAll(".player-node").length);
  }

  // Rebuild the Step 2 sidebar selectors
  function renderRoleSelectors(formation) {
    roleListContainer.innerHTML = '';
    const labels = positionNames[formation] || positionNames['4-3-3'];

    for (let s = 0; s < 11; s++) {
      const roleRow = document.createElement('div');
      roleRow.className = 'role-row';

      const badge = document.createElement('span');
      badge.className = 'role-badge';
      badge.textContent = labels[s];

      const selectWrapper = document.createElement('div');
      selectWrapper.className = 'role-select-wrapper';

      const select = document.createElement('select');
      select.className = 'role-select';
      select.setAttribute('data-slot', s);

      // Populate players
      players.forEach((p, pIndex) => {
        const option = document.createElement('option');
        option.value = pIndex;
        option.textContent = `${p.name} (${p.role})`;
        
        // Select the player currently assigned to this slot
        if (playerAssignments[s] === pIndex) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      // Handle selector change to swap duplicate assignments
      select.addEventListener('change', (e) => {
        const newPlayerIdx = parseInt(e.target.value);
        const currentSlot = s;
        const oldPlayerIdx = playerAssignments[currentSlot];
        
        // Find which slot the new player was previously assigned to
        const prevSlotForNewPlayer = playerAssignments.indexOf(newPlayerIdx);

        if (prevSlotForNewPlayer !== -1) {
          // Swap: Assign the old player to the new player's previous slot
          playerAssignments[prevSlotForNewPlayer] = oldPlayerIdx;
        }

        // Assign the new player to the current slot
        playerAssignments[currentSlot] = newPlayerIdx;

        console.log(`ALTIX DEBUG: Swapped assignments between slot ${currentSlot} and slot ${prevSlotForNewPlayer}`);
        
        // Re-render the selectors to display the correct updated state
        renderRoleSelectors(formation);
      });

      selectWrapper.appendChild(select);
      roleRow.appendChild(badge);
      roleRow.appendChild(selectWrapper);
      roleListContainer.appendChild(roleRow);
    }
  }

  // Initial load
  const initialFormation = localStorage.getItem(`altix_match_${matchId}_formation`) || '4-3-3';
  if (selectedValSpan) selectedValSpan.textContent = initialFormation;
  
  loadAssignments(initialFormation);
  renderRoleSelectors(initialFormation);
  renderPlayers(initialFormation);

  // Step 3 Generate Pitch button listener
  generateBtn.addEventListener('click', () => {
    const formation = selectedValSpan ? selectedValSpan.textContent : '4-3-3';
    saveAssignments(formation);
    
    // Animate pitch generation
    pitch.style.transform = 'rotateX(0deg) scale(0.95)';
    setTimeout(() => {
      renderPlayers(formation);
      pitch.style.transform = 'rotateX(20deg) scale(1)';
    }, 250);

    generateBtn.textContent = 'TACTICAL BOARD GENERATED ✓';
    generateBtn.style.borderColor = 'var(--accent-green)';
    generateBtn.style.background = 'rgba(200, 255, 0, 0.15)';

    setTimeout(() => {
      generateBtn.textContent = 'Step 3: Generate Pitch';
      generateBtn.style.background = '';
    }, 1500);

    console.log("ALTIX DEBUG: Pitch visualization generated for formation:", formation);
  });

  // Custom Dropdown logic for Step 1
  if (dropdown && dropdownSelected && optionsList && selectedValSpan) {
    dropdownSelected.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    optionsList.querySelectorAll('li').forEach(item => {
      item.addEventListener('click', () => {
        const value = item.getAttribute('data-value');
        selectedValSpan.textContent = value;
        
        optionsList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        item.classList.add('active');
        dropdown.classList.remove('active');

        // Load or initialize assignments for the new formation
        loadAssignments(value);

        // Rebuild selector dropdowns for the new formation roles
        renderRoleSelectors(value);

        // Instantly render default pitch visualization for new formation
        renderPlayers(value);

        // Save selected formation
        localStorage.setItem(`altix_match_${matchId}_formation`, value);
      });
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
    });
  }
}

// ========== GAME PLAN LOGIC ==========
async function initGamePlan() {
  const container = document.querySelector('.page-gameplan');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('match') || '1';
  const teamSide = urlParams.get('team') || 'home';

  // Set Back URL
  const backBtn = document.getElementById('btn-gameplan-back');
  if (backBtn) backBtn.href = `formation-builder.html?match=${matchId}&team=${teamSide}`;

  const playerDropdownIds = ['captain-select', 'taker-penalties', 'taker-corners-l', 'taker-corners-r', 'taker-freekicks'];

  try {
    const squadRes = await fetch(`${API_BASE_URL}/api/matches/${matchId}/squad`);
    if (squadRes.ok) {
      const lineups = await squadRes.json();
      if (lineups && lineups.length > 0) {
        
        let targetTeamName = '';
        try {
          const matchRes = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
          if (matchRes.ok) {
            const matchData = await matchRes.json();
            targetTeamName = teamSide === 'away' ? matchData.team2.name : matchData.team1.name;
          }
        } catch (e) {}

        let targetLineup = lineups[0];
        if (targetTeamName) {
          const exactMatch = lineups.find(l => 
            l.team.name.toLowerCase().includes(targetTeamName.toLowerCase()) || 
            targetTeamName.toLowerCase().includes(l.team.name.toLowerCase())
          );
          if (exactMatch) targetLineup = exactMatch;
        } else {
          const teamIndex = teamSide === 'away' ? 1 : 0;
          targetLineup = lineups[teamIndex] || lineups[0];
        }

        let targetXI = null;
        if (targetLineup && targetLineup.startXI) {
           targetXI = targetLineup.startXI; 
        }
        
        let finalPlayers = [];
        if (targetXI && targetXI.length === 11) {
          finalPlayers = targetXI.map(item => item.player.name);
        } else {
          finalPlayers = ['Goalkeeper', 'Def Left', 'Def Center 1', 'Def Center 2', 'Def Right', 'Mid Left', 'Mid Center', 'Mid Right', 'Fwd Left', 'Fwd Center', 'Fwd Right'];
        }

        playerDropdownIds.forEach(id => {
          const selectEl = document.getElementById(id);
          if (!selectEl) return;
          const optionsBlock = selectEl.querySelector('.tactic-select__options');
          const valBlock = selectEl.querySelector('.tactic-select__val');
          
          if (optionsBlock && valBlock) {
            optionsBlock.innerHTML = '';
            finalPlayers.forEach((playerName, index) => {
              const li = document.createElement('li');
              li.setAttribute('data-value', playerName);
              li.textContent = playerName;
              if (index === 0) {
                li.classList.add('active');
                valBlock.innerHTML = `${playerName} <span class="tactic-select__arrow">▼</span>`;
              }
              optionsBlock.appendChild(li);
            });
          }
        });

      }
    } else {
      throw new Error("Squad fetch failed");
    }
  } catch (err) {
    console.error("ALTIX DEBUG: Failed to load squad for Game Plan, using fallbacks", err);
    const finalPlayers = ['Goalkeeper', 'Def Left', 'Def Center 1', 'Def Center 2', 'Def Right', 'Mid Left', 'Mid Center', 'Mid Right', 'Fwd Left', 'Fwd Center', 'Fwd Right'];
    playerDropdownIds.forEach(id => {
      const selectEl = document.getElementById(id);
      if (!selectEl) return;
      const optionsBlock = selectEl.querySelector('.tactic-select__options');
      const valBlock = selectEl.querySelector('.tactic-select__val');
      
      if (optionsBlock && valBlock) {
        optionsBlock.innerHTML = '';
        finalPlayers.forEach((playerName, index) => {
          const li = document.createElement('li');
          li.setAttribute('data-value', playerName);
          li.textContent = playerName;
          if (index === 0) {
            li.classList.add('active');
            valBlock.innerHTML = `${playerName} <span class="tactic-select__arrow">▼</span>`;
          }
          optionsBlock.appendChild(li);
        });
      }
    });
  }

  // Interactive selectors
  const selects = document.querySelectorAll('.tactic-select');

  selects.forEach(select => {
    const valBlock = select.querySelector('.tactic-select__val');
    const optionsBlock = select.querySelector('.tactic-select__options');

    if (!optionsBlock) return;
    const isStatic = optionsBlock.classList.contains('static-options');

    if (!isStatic && valBlock) {
      valBlock.addEventListener('click', (e) => {
        e.stopPropagation();
        selects.forEach(s => {
          if (s !== select) {
            const opt = s.querySelector('.tactic-select__options');
            if (opt && !opt.classList.contains('static-options')) {
              s.classList.remove('active');
            }
          }
        });
        select.classList.toggle('active');
      });
    }

    // Handle option click via delegation on the optionsBlock
    optionsBlock.addEventListener('click', (e) => {
      const item = e.target.closest('li');
      if (!item) return;
      e.stopPropagation();
      
      const value = item.getAttribute('data-value');
      if (valBlock) {
        valBlock.innerHTML = `${value} <span class="tactic-select__arrow">▼</span>`;
      }

      optionsBlock.querySelectorAll('li').forEach(li => li.classList.remove('active'));
      item.classList.add('active');

      if (!isStatic) {
        select.classList.remove('active');
      }

      const tacticId = select.id;
      localStorage.setItem(`altix_match_${matchId}_tactic_${tacticId}`, value);
    });
  });

  // Close non-static dropdowns on outside click
  document.addEventListener('click', () => {
    selects.forEach(select => {
      const optionsBlock = select.querySelector('.tactic-select__options');
      if (optionsBlock && !optionsBlock.classList.contains('static-options')) {
        select.classList.remove('active');
      }
    });
  });

  // Continue triggers Ready Room modal
  const continueBtn = document.getElementById('btn-gameplan-continue');
  const simModal = document.getElementById('simulation-modal');
  const startSimBtn = document.getElementById('btn-start-simulation');
  
  let readyRoomInterval = null;

  if (continueBtn && simModal) {
    continueBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      simModal.classList.add('active');

      // Populate Tactics Recap
      const formation = localStorage.getItem(`altix_match_${matchId}_formation`) || '4-3-3';
      
      const mentalityVal = document.querySelector('#mentality-select .tactic-select__val');
      const captainVal = document.querySelector('#captain-select .tactic-select__val');
      
      const mentality = mentalityVal ? mentalityVal.textContent.replace('▼', '').trim() : 'Balanced';
      const captain = captainVal ? captainVal.textContent.replace('▼', '').trim() : 'Captain';
      
      // Save the final locked-in tactics for the Post-Match Screen
      localStorage.setItem(`altix_match_${matchId}_final_mentality`, mentality);
      localStorage.setItem(`altix_match_${matchId}_final_captain`, captain);

      const modalFormation = document.getElementById('modal-formation');
      const modalMentality = document.getElementById('modal-mentality');
      const modalCaptain = document.getElementById('modal-captain');
      
      if (modalFormation) modalFormation.textContent = formation;
      if (modalMentality) modalMentality.textContent = mentality;
      if (modalCaptain) modalCaptain.textContent = captain;

      const countdownEl = document.getElementById('modal-countdown');
      
      if (readyRoomInterval) clearInterval(readyRoomInterval);

      try {
        const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
        if (!res.ok) throw new Error('Match not found');
        const matchData = await res.json();

        function updateCountdown() {
          if (!countdownEl || !startSimBtn) return;
          
          if (matchData.timestamp) {
            const diff = matchData.timestamp - Date.now();
            if (diff <= 0) {
              countdownEl.textContent = "00:00:00";
              startSimBtn.disabled = false;
              startSimBtn.style.opacity = '1';
              startSimBtn.style.cursor = 'pointer';
              startSimBtn.textContent = 'Start Simulation';
              if (readyRoomInterval) clearInterval(readyRoomInterval);
              return;
            }
            
            startSimBtn.disabled = true;
            startSimBtn.style.opacity = '0.5';
            startSimBtn.style.cursor = 'not-allowed';
            startSimBtn.textContent = 'Awaiting Kickoff...';

            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            countdownEl.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
          } else {
            countdownEl.textContent = "TBD";
          }
        }

        updateCountdown();
        readyRoomInterval = setInterval(updateCountdown, 1000);

      } catch (err) {
        console.error("ALTIX DEBUG: Failed to fetch match for Ready Room:", err);
      }
    });
  }

  if (startSimBtn) {
    startSimBtn.addEventListener('click', () => {
      startSimBtn.disabled = true;
      startSimBtn.textContent = 'Launching Engine...';

      // Send frontend tactics to backend for the AI prompt
      const tacticsPayload = {
        formation: localStorage.getItem(`altix_match_${matchId}_formation`) || '4-3-3',
        mentality: localStorage.getItem(`altix_match_${matchId}_tactic_mentality-select`) || 'Balanced',
        buildup: localStorage.getItem(`altix_match_${matchId}_tactic_buildup-select`) || 'Mixed',
        defline: localStorage.getItem(`altix_match_${matchId}_tactic_defline-select`) || 'Normal',
        passing: localStorage.getItem(`altix_match_${matchId}_tactic_passing-select`) || 'Mixed',
        tempo: localStorage.getItem(`altix_match_${matchId}_tactic_tempo-select`) || 'Normal',
        captain: localStorage.getItem(`altix_match_${matchId}_captain`) || 'Captain'
      };

      fetch(`${API_BASE_URL}/api/matches/${matchId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tacticsPayload)
      })
      .then(() => {
        simModal.classList.remove('active');
        window.location.href = `simulation.html?match=${matchId}`;
      })
      .catch((err) => {
        console.error("ALTIX DEBUG Error triggering simulation on backend:", err);
        simModal.classList.remove('active');
        window.location.href = `simulation.html?match=${matchId}`;
      });
    });
  }
}

// ========== DYNAMIC NAVBAR WALLET PROFILE ==========
function updateNavbarWallet() {
  const walletAddress = localStorage.getItem('altix_wallet_address');
  if (!walletAddress) return;

  const formatted = walletAddress.length > 8 
    ? `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`
    : walletAddress;

  const walletEl = document.querySelector('.navbar__wallet');
  const avatarEl = document.querySelector('.navbar__avatar');

  if (walletEl) walletEl.textContent = formatted;
  if (avatarEl) avatarEl.textContent = walletAddress.substring(0, 2).toUpperCase();

  // On index.html, replace navbar connect button with user profile block
  const btnConnectNav = document.getElementById('btn-connect-wallet-nav');
  if (btnConnectNav) {
    const parent = btnConnectNav.parentNode;
    if (parent) {
      parent.innerHTML = `
        <div class="navbar__profile" style="cursor: pointer; display: flex; align-items: center; gap: 12px;" id="btn-disconnect-wallet">
          <div class="navbar__avatar" style="width: 32px; height: 32px; border-radius: 50%; background: #c8ff00; color: #0a0e14; display: flex; align-items: center; justify-content: center; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 800;">${walletAddress.substring(0, 2).toUpperCase()}</div>
          <span class="navbar__wallet" style="font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; color: #fff;">${formatted}</span>
        </div>
      `;

      document.getElementById('btn-disconnect-wallet').addEventListener('click', () => {
        if (confirm("Do you want to disconnect your wallet?")) {
          localStorage.removeItem('altix_session_token');
          localStorage.removeItem('altix_wallet_address');
          window.location.reload();
        }
      });
    }
  }
}

// ========== DYNAMIC PICK MATCH FIXTURES LIST ==========
function initPickMatchPage() {
  const container = document.querySelector('.page-pick-match');
  if (!container) return;

  // Render wallet address in navbar
  updateNavbarWallet();

  const listContainer = document.getElementById('pick-match-list');
  if (!listContainer) return;

  const txlineOrigin = window.TXLINE_ORIGIN || 'https://txline.txodds.com';

  async function refreshTxLineJwt() {
    const startRes = await fetch(`${txlineOrigin}/auth/guest/start`, { method: 'POST' });
    if (!startRes.ok) throw new Error('Failed to refresh TxLINE guest JWT');
    const startData = await startRes.json();
    localStorage.setItem('txline_jwt', startData.token);
    return startData.token;
  }

  function toBase64(bytes) {
    if (window.Buffer) {
      return window.Buffer.from(bytes).toString('base64');
    }
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  // TxLINE Activation Flow has been removed to backend

  listContainer.innerHTML = '<div style="color: rgba(255,255,255,0.6); padding: 40px; font-family: sans-serif; text-align: center;">Loading fixtures...</div>';

  async function fetchMatches() {
    return await fetch(`${API_BASE_URL}/api/matches`);
  }

  fetchMatches()
    .then(res => res.json())
    .then(matchesList => {
      listContainer.innerHTML = '';
      if (matchesList.length === 0) {
        listContainer.innerHTML = '<div style="color: rgba(255,255,255,0.6); padding: 40px; text-align: center;">No matches currently scheduled.</div>';
        return;
      }

      listContainer.innerHTML = matchesList.map(match => {
        let cardModifierClass = 'pm-card--upcoming';
        let badgeClass = 'pm-card__badge--upcoming';
        let badgeText = 'Upcoming';

        if (match.status === 'live' || match.status === 'simulating') {
          cardModifierClass = 'pm-card--ongoing';
          badgeClass = 'pm-card__badge--ongoing';
          badgeText = match.status === 'simulating' ? 'Simulating' : 'Live';
        } else if (match.status === 'locked') {
          cardModifierClass = 'pm-card--upcoming';
          badgeClass = 'pm-card__badge--ongoing';
          badgeText = 'Tactics Locked';
        } else if (match.status === 'completed') {
          cardModifierClass = 'pm-card--completed';
          badgeClass = 'pm-card__badge--upcoming';
          badgeText = 'Completed';
        }

        return `
          <a href="match-briefing.html?match=${match.id}" class="pm-card ${cardModifierClass}" id="pm-card-${match.id}">
            <div class="pm-card__top">
              <span class="pm-card__league">${match.league}</span>
              <span class="pm-card__badge ${badgeClass}">${badgeText}</span>
            </div>
            
            <div class="pm-card__body">
              <div class="pm-card__team">
                <img src="${match.team1.logo}" alt="${match.team1.name}" class="pm-card__logo-img" style="width: 42px; height: 42px; object-fit: contain; border-radius: 4px;" />
                <span class="pm-card__team-name">${match.team1.name}</span>
              </div>
              
              <div class="pm-card__score-area">
                <span class="pm-card__matchday">${match.matchday}</span>
                <div class="pm-card__score">${match.score}</div>
                <span class="pm-card__time">${match.time}</span>
              </div>
              
              <div class="pm-card__team">
                <img src="${match.team2.logo}" alt="${match.team2.name}" class="pm-card__logo-img" style="width: 42px; height: 42px; object-fit: contain; border-radius: 4px;" />
                <span class="pm-card__team-name">${match.team2.name}</span>
              </div>
            </div>
            
            ${match.status === 'live' || match.status === 'simulating' ? '<div class="pm-card__tab"></div>' : ''}
          </a>
        `;
      }).join('');
    })
    .catch(err => {
      console.error("ALTIX DEBUG Error loading matches:", err);
      listContainer.innerHTML = '<div style="color: #ff0033; padding: 40px; text-align: center; font-family: sans-serif;">Failed to load match schedules from backend.</div>';
    });
}

// ========== PICK MATCH NOTIFICATION ==========
function initPickMatchNotification() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('sim') === 'started') {
    const matchId = urlParams.get('match') || '1';
    
    // Create a beautiful notification banner
    const notification = document.createElement('div');
    notification.className = 'sim-notification';
    notification.innerHTML = `
      <div class="sim-notification__content">
        <span class="sim-notification__icon">⚙️</span>
        <span class="sim-notification__text">Simulation Initiated! Running alternate reality tactics engine for Match #${matchId}...</span>
      </div>
      <button class="sim-notification__close">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add banner CSS inline
    notification.style.cssText = `
      position: fixed;
      top: 90px;
      right: 24px;
      background: rgba(15, 22, 33, 0.95);
      border: 1px solid var(--accent-green);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(200, 255, 0, 0.25);
      z-index: 1000;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      animation: slideInNotification 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      max-width: 420px;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInNotification {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutNotification {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
      }
      .sim-notification__content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .sim-notification__icon {
        font-size: 22px;
        animation: spinGear 3s linear infinite;
        display: inline-block;
      }
      @keyframes spinGear {
        to { transform: rotate(360deg); }
      }
      .sim-notification__text {
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        font-weight: 500;
        color: #fff;
        line-height: 1.4;
      }
      .sim-notification__close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        font-size: 20px;
        cursor: pointer;
        transition: color 0.2s;
        padding: 0 4px;
        font-family: Arial, sans-serif;
      }
      .sim-notification__close:hover {
        color: #fff;
      }
    `;
    document.head.appendChild(style);
    
    // Close button logic
    notification.querySelector('.sim-notification__close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutNotification 0.5s ease-in forwards';
        setTimeout(() => notification.remove(), 500);
      }
    }, 6000);
  }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  try { renderFeaturedFlags(); } catch(e) { console.error("ALTIX DEBUG Error renderFeaturedFlags:", e); }
  try { startCountdown(); } catch(e) { console.error("ALTIX DEBUG Error startCountdown:", e); }
  try { renderMatchCards(); } catch(e) { console.error("ALTIX DEBUG Error renderMatchCards:", e); }
  try { initNavbarScroll(); } catch(e) { console.error("ALTIX DEBUG Error initNavbarScroll:", e); }
  try { initRippleEffect(); } catch(e) { console.error("ALTIX DEBUG Error initRippleEffect:", e); }
  try { initParallax(); } catch(e) { console.error("ALTIX DEBUG Error initParallax:", e); }
  try { simulateLiveScores(); } catch(e) { console.error("ALTIX DEBUG Error simulateLiveScores:", e); }
  try { initScrollReveal(); } catch(e) { console.error("ALTIX DEBUG Error initScrollReveal:", e); }
  try { initModal(); } catch(e) { console.error("ALTIX DEBUG Error initModal:", e); }
  try { initMatchBriefing(); } catch(e) { console.error("ALTIX DEBUG Error initMatchBriefing:", e); }
  try { initFormationBuilder(); } catch(e) { console.error("ALTIX DEBUG Error initFormationBuilder:", e); }
  try { initGamePlan(); } catch(e) { console.error("ALTIX DEBUG Error initGamePlan:", e); }
  try { initPickMatchNotification(); } catch(e) { console.error("ALTIX DEBUG Error initPickMatchNotification:", e); }
  try { initPickMatchPage(); } catch(e) { console.error("ALTIX DEBUG Error initPickMatchPage:", e); }
  try { updateNavbarWallet(); } catch(e) { console.error("ALTIX DEBUG Error updateNavbarWallet:", e); }

  // Defer tilt effect slightly to let cards render
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try { initCardTilt(); } catch(e) { console.error("ALTIX DEBUG Error initCardTilt:", e); }
      try { initMatchNav(); } catch(e) { console.error("ALTIX DEBUG Error initMatchNav:", e); }
    });
  });
});

// ========== SIMULATION DASHBOARD LOGIC ==========
function initSimulation() {
  const container = document.querySelector('.page-simulation');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('match') || '1';

  // Terminal logic
  const terminal = document.getElementById('sim-terminal-output');
  
  function addTerminalLine(text, type = 'system-line') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    terminal.appendChild(line);
    
    // Typewriter effect
    let i = 0;
    line.innerHTML = '<span class="text"></span><span class="typewriter-cursor"></span>';
    const textSpan = line.querySelector('.text');
    
    function typeChar() {
      if (i < text.length) {
        textSpan.textContent += text.charAt(i);
        i++;
        terminal.scrollTop = terminal.scrollHeight;
        setTimeout(typeChar, 30);
      } else {
        const cursor = line.querySelector('.typewriter-cursor');
        if (cursor) cursor.remove();
      }
    }
    typeChar();
  }

  const canvas = document.getElementById('live-pitch-canvas');
  if (!canvas) return;
  
  // Load Team Names for Scoreboard
  fetch(`${API_BASE_URL}/api/matches/${matchId}`)
    .then(res => res.json())
    .then(data => {
      const homeName = document.getElementById('sim-home-name');
      const awayName = document.getElementById('sim-away-name');
      if (homeName && data.team1) homeName.textContent = data.team1.name;
      if (awayName && data.team2) awayName.textContent = data.team2.name;
    })
    .catch(err => console.error("Failed to load match data for scoreboard", err));
    
  const ctx = canvas.getContext('2d');
  
  const pitchWidth = canvas.width;
  const pitchHeight = canvas.height;
  
  function drawPitch() {
    ctx.clearRect(0, 0, pitchWidth, pitchHeight);
    // Grass
    ctx.fillStyle = '#223322';
    ctx.fillRect(0, 0, pitchWidth, pitchHeight);
    
    // Lines
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, pitchWidth - 20, pitchHeight - 20); // Border
    ctx.beginPath();
    ctx.moveTo(pitchWidth / 2, 10);
    ctx.lineTo(pitchWidth / 2, pitchHeight - 10); // Center line
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pitchWidth / 2, pitchHeight / 2, 40, 0, Math.PI * 2); // Center circle
    ctx.stroke();
    
    // Penalty boxes
    ctx.strokeRect(10, pitchHeight/2 - 75, 75, 150);
    ctx.strokeRect(pitchWidth - 85, pitchHeight/2 - 75, 75, 150);
  }

  let ball = { x: pitchWidth / 2, y: pitchHeight / 2 };

  function drawFrame() {
    drawPitch();
    // Draw players (just a few static dots for now)
    ctx.fillStyle = 'var(--accent-green)';
    ctx.beginPath(); ctx.arc(150, 150, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(150, 250, 6, 0, Math.PI * 2); ctx.fill();
    
    ctx.fillStyle = '#ff3366';
    ctx.beginPath(); ctx.arc(450, 150, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(450, 250, 6, 0, Math.PI * 2); ctx.fill();
    
    // Draw ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawFrame();

  // SSE Stream
  setTimeout(() => {
    addTerminalLine('[SYSTEM] Opening secure SSE tunnel to ALTIX Simulation Engine...', 'system-line');
    
    const es = new EventSource(`${API_BASE_URL}/api/matches/${matchId}/stream`);
    
    es.onopen = () => {
      addTerminalLine('[SYSTEM] Stream connected. Listening for events...', 'system-line');
    };
    
    let currentHomeScore = 0;
    let currentAwayScore = 0;
    
    es.onmessage = (e) => {
      try {
        if (e.data === 'ping') return;
        const payload = JSON.parse(e.data);
        if (payload.narrative) {
          addTerminalLine(payload.narrative, 'narrative-line');
        }
        if (payload.match_time) {
          const elSimMinute = document.getElementById('sim-minute');
          if (elSimMinute) elSimMinute.textContent = payload.match_time;
        }
        if (payload.score) {
          currentHomeScore = payload.score.home !== undefined ? payload.score.home : currentHomeScore;
          currentAwayScore = payload.score.away !== undefined ? payload.score.away : currentAwayScore;
          
          const elHomeScore = document.getElementById('sim-home-score');
          const elAwayScore = document.getElementById('sim-away-score');
          if (elHomeScore) elHomeScore.textContent = currentHomeScore;
          if (elAwayScore) elAwayScore.textContent = currentAwayScore;
        }
        if (payload.animation) {
          // Rudimentary ball animation logic
          const targetX = payload.animation.zone_to && payload.animation.zone_to.includes('box') ? 450 : 150;
          const targetY = 200;
          // Simple tween
          let steps = 0;
          const interval = setInterval(() => {
            ball.x += (targetX - ball.x) * 0.1;
            ball.y += (targetY - ball.y) * 0.1;
            drawFrame();
            steps++;
            if (steps > 20) clearInterval(interval);
          }, 50);
        }
        
        if (payload.status === 'completed') {
          es.close();
          localStorage.setItem(`altix_match_${matchId}_final_narrative`, payload.narrative || "The simulation concluded successfully.");
          localStorage.setItem(`altix_match_${matchId}_final_score_home`, currentHomeScore);
          localStorage.setItem(`altix_match_${matchId}_final_score_away`, currentAwayScore);
          
          setTimeout(() => {
            addTerminalLine('[SYSTEM] FULL TIME. Simulation Complete.', 'system-line');
            
            // Show View Match Report Button
            const btnContainer = document.createElement('div');
            btnContainer.style.textAlign = 'center';
            btnContainer.style.marginTop = '20px';
            
            const btn = document.createElement('a');
            btn.href = `post-match.html?match=${matchId}`;
            btn.textContent = 'View Match Report';
            btn.className = 'gameplan-btn gameplan-btn--continue';
            btn.style.display = 'inline-block';
            btn.style.width = '100%';
            
            btnContainer.appendChild(btn);
            terminal.appendChild(btnContainer);
            terminal.scrollTop = terminal.scrollHeight;
            
          }, 3000); // give the final narrative time to type out
        }
      } catch (err) {
        console.error("Failed to parse SSE payload", err);
      }
    };
    
    es.onerror = (e) => {
      console.error("SSE Error", e);
    };
  }, 1000);
}

// ========== POST MATCH LOGIC ==========
function initPostMatch() {
  const container = document.querySelector('.page-postmatch');
  if (!container) return;
  
  try { updateNavbarWallet(); } catch(e) { console.error("ALTIX DEBUG Error updateNavbarWallet:", e); }

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('match') || '1';

  // Load Tactics
  const formation = localStorage.getItem(`altix_match_${matchId}_formation`) || '4-3-3';
  const mentality = localStorage.getItem(`altix_match_${matchId}_final_mentality`) || 'Balanced';
  const captain = localStorage.getItem(`altix_match_${matchId}_final_captain`) || 'Captain';
  
  const elFormation = document.getElementById('pm-formation');
  const elMentality = document.getElementById('pm-mentality');
  const elCaptain = document.getElementById('pm-captain');
  if (elFormation) elFormation.textContent = formation;
  if (elMentality) elMentality.textContent = mentality;
  if (elCaptain) elCaptain.textContent = captain;

  // Load Final Score
  const finalHomeScore = localStorage.getItem(`altix_match_${matchId}_final_score_home`) || '0';
  const finalAwayScore = localStorage.getItem(`altix_match_${matchId}_final_score_away`) || '0';
  const elHomeScore = document.getElementById('pm-home-score');
  const elAwayScore = document.getElementById('pm-away-score');
  if (elHomeScore) elHomeScore.textContent = finalHomeScore;
  if (elAwayScore) elAwayScore.textContent = finalAwayScore;

  // Load Narrative
  const finalNarrative = localStorage.getItem(`altix_match_${matchId}_final_narrative`);
  const elAnalysis = document.getElementById('pm-analysis');
  if (elAnalysis && finalNarrative) {
    elAnalysis.innerHTML = `<p>${finalNarrative}</p>`;
  }

  // Load Team Names
  fetch(`${API_BASE_URL}/api/matches/${matchId}`)
    .then(res => res.json())
    .then(data => {
      const homeName = document.getElementById('pm-home-name');
      const awayName = document.getElementById('pm-away-name');
      if (homeName && data.team1) homeName.textContent = data.team1.name;
      if (awayName && data.team2) awayName.textContent = data.team2.name;
    })
    .catch(err => console.error("Failed to load match data for post-match", err));


}

document.addEventListener('DOMContentLoaded', () => {
  initSimulation();
  initPostMatch();
});
