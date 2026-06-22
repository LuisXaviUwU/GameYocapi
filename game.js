      /* ============================================================
         CAPIBARA RUNNER - lógica del juego
         ============================================================ */

      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const GROUND_Y = H - 80;

      const SPRITE_COLORS = {
        '.': null,
        'b': '#000',
        'd': '#6e4a28',
        'm': '#9c6b3e',
        'l': '#e8c79a',
        'r': '#5a5045',
        'R': '#7a7065',
        'w': '#3a2c1d',
        'W': '#6e4a28',
        'c': '#ffffff',
        'C': '#f4f4f4',
        'S': '#d6d6d6',
        'g': '#71aa34',
        'G': '#5a8f4f',
        'D': '#7e5233'
      };

      const CLOUD_SPRITE = [
        "............cccc........",
        "..........ccCCCCcc......",
        "........ccCCCCCCCCcc....",
        ".......cCCCCCCCCCCCCc...",
        ".....ccCCCCCCCCCCCCCCcc.",
        "...ccCCCCCCCCCCCCCCCCCCc",
        "..cCCCCCCCCCCCCCCCCCCCCc",
        ".cCCCCCCCCCCCCCCCCCCCCCc",
        "cCCCCCCCCCCCCCCCCCCCCCCS",
        "cCSSSSSSSSSSSSSSSSSSSSSS",
        ".cSSSSSSSSSSSSSSSSSSSSS.",
        "..cccccccccccccccccccc.."
      ];

      const GRASS_SPRITE = [
        "gGgGGgGg",
        "GgGggGgG",
        "ddDddDdd",
        "dDddDddD"
      ];

      const CAPI_F1 = [
        ".......ddddd....",
        ".....ddmmmmmd...",
        "....dmmmmmmmmdb.",
        "...dmmmmmmmmmmmb",
        "..dmmmmmmmmmmmmb",
        "..dmmmmmmmmmmmmf",
        "..dmmmmmmmmmmmmd",
        "..dlllllllllllmd",
        "...dllllllllllmd",
        "...ddlllddllldd.",
        "....dd....dd....",
        "....dd....dd...."
      ];

      const CAPI_F2 = [
        ".......ddddd....",
        ".....ddmmmmmd...",
        "....dmmmmmmmmdb.",
        "...dmmmmmmmmmmmb",
        "..dmmmmmmmmmmmmb",
        "..dmmmmmmmmmmmmf",
        "..dmmmmmmmmmmmmd",
        "..dlllllllllllmd",
        "...dllllllllllmd",
        "...ddlllddllldd.",
        ".....dd....dd...",
        "....dd......dd.."
      ];

      const CAPI_JUMP = [
        ".......ddddd....",
        ".....ddmmmmmd...",
        "....dmmmmmmmmdb.",
        "...dmmmmmmmmmmmb",
        "..dmmmmmmmmmmmmb",
        "..dmmmmmmmmmmmmf",
        "..dmmmmmmmmmmmmd",
        "..dlllllllllllmd",
        "...dllllllllllmd",
        "...ddlllddllldd.",
        "..dd......dd....",
        "..dd......dd...."
      ];

      const CAPI_DUCK = [
        "................",
        "................",
        ".......ddddd....",
        ".....ddmmmmmd...",
        "....dmmmmmmmmdb.",
        "...dmmmmmmmmmmmb",
        "..dmmmmmmmmmmmmb",
        "..dmmmmmmmmmmmmf",
        "..dlllllllllllmd",
        "...ddlllddllldd.",
        "....dd....dd....",
        "................"
      ];

      const ROCK_SPRITE = [
        "....rrrr....",
        "..rrRRRRrr..",
        ".rRRRRRRRRr.",
        "rRRrrRRRRRRr",
        "rRRRRRRrrRRr",
        "rRRRRRRRRRRr",
        "rRRRRRRRRRRr",
        "rrRRRRRRRRrr",
        ".rrRRRRRRrr.",
        "..rrrrrrrr.."
      ];

      const LOG_SPRITE = [
        "...wwwwwwwwww...",
        "..wWWWWWWWWWWw..",
        ".wWWWWWWWWWWWWw.",
        "wWwWWWWWWWWWWwWw",
        "wWWwWWWWWWWWwWWw",
        "wWWWWWWWWWWWWWWw",
        ".wWWWWWWWWWWWWw.",
        "..wwwwwwwwwwww.."
      ];

      function drawSprite(ctx, spriteArr, x, y, w, h) {
        const rows = spriteArr.length;
        const cols = spriteArr[0].length;
        const pw = w / cols;
        const ph = h / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const color = SPRITE_COLORS[spriteArr[r][c]];
            if (color) {
              ctx.fillStyle = color;
              ctx.fillRect(x + c * pw, y + r * ph, pw + 0.5, ph + 0.5);
            }
          }
        }
      }

      // ---------- imágenes powerup ----------
      const POWERUP_IMGS = {};
      (function () {
        const map = {
          doubleJump: 'assets/jump.png',
          multi: 'assets/x2.png',
          magnet: 'assets/iman.png',
          coin: 'assets/coin.png',
          shield: 'assets/inmortal.png'
        };
        for (const [key, src] of Object.entries(map)) {
          const img = new Image();
          img.src = src;
          POWERUP_IMGS[key] = img;
        }
      })();

      const PALETTE = {
        bg1: '#bfe8e3',
        bg2: '#7fc8c2',
        ground: '#d9b475',
        groundLine: '#b8895a',
        capiBody: '#9c6b3e',
        capiDark: '#6e4a28',
        capiBelly: '#e8c79a',
        obstacle: '#5a8f4f',
        obstacleRock: '#7a7065',
        shield: '#7fd6ff',
        multi: '#f2b705',
        slow: '#e3000b',
        magnet: '#ff6b6b',
        coin: '#00c896'
      };

      // ---------- estado del juego ----------
      let state = 'idle'; // idle | countdown | playing | dead
      let score = 0;
      let speed = 0;
      let frame = 0;
      let multiplier = 1;
      let scoreLog = []; // eventos para validar en backend
      let sessionCoins = 0;
      let totalCoins = 0;
      let playerInventory = { shield: 0, doubleJump: 0, magnet: 0, multi: 0, multi4: 0, multi6: 0 };
      let globalFrame = 0; // Para el ciclo día/noche continuo

      // ---------- Audio ----------
      const lobbyTracks = ['music/lobby.mp3','music/lobby2.mp3','music/lobby3.mp3','music/lobby4.mp3'];
      let currentAudio = null;
      let lobbyQueue = [];     // cola aleatoria de pistas del lobby
      let lobbyActive = false; // true cuando estamos en modo lobby
      let audioUnlocked = false;

      // Volúmenes independientes (0-1)
      let menuVolume = 0.45;
      let gameVolume  = 0.45;

      // Genera una cola aleatoria con todas las pistas (Fisher-Yates)
      function buildLobbyQueue() {
        lobbyQueue = [...lobbyTracks];
        for (let i = lobbyQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lobbyQueue[i], lobbyQueue[j]] = [lobbyQueue[j], lobbyQueue[i]];
        }
      }

      // Música de juego (loop)
      function playMusic(src) {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          currentAudio.onended = null;
        }
        currentAudio = new Audio(src);
        currentAudio.loop = true;
        currentAudio.volume = gameVolume;
        currentAudio.play().catch(() => {});
      }

      // Reproduce la siguiente pista del lobby en cadena
      function playNextLobbyTrack() {
        if (!lobbyActive) return;
        if (lobbyQueue.length === 0) buildLobbyQueue();
        const track = lobbyQueue.shift();
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          currentAudio.onended = null;
        }
        currentAudio = new Audio(track);
        currentAudio.volume = menuVolume;
        currentAudio.loop = false;
        currentAudio.onended = playNextLobbyTrack;
        currentAudio.play().catch(() => {});
      }

      function playLobbyMusic() {
        lobbyActive = true;
        buildLobbyQueue();
        playNextLobbyTrack();
      }

      function stopMusic() {
        lobbyActive = false;
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          currentAudio.onended = null;
          currentAudio = null;
        }
      }

      // --- Intentar autoplay inmediato al cargar la página ---
      // Los navegadores modernos permiten autoplay si el usuario ya interactuó antes
      // con el sitio. Si está bloqueado, se activa en el primer clic/tecla.
      function tryStartLobbyMusic() {
        if (audioUnlocked || state !== 'idle') return;
        playLobbyMusic();
        // Verificar si realmente empezó a sonar
        if (currentAudio) {
          currentAudio.play().then(() => {
            audioUnlocked = true;
          }).catch(() => {
            // Autoplay bloqueado → esperar primera interacción
            stopMusic();
          });
        }
      }

      function unlockAudio() {
        if (audioUnlocked) return;
        audioUnlocked = true;
        if (state === 'idle' && !currentAudio) playLobbyMusic();
      }

      // Intentar inmediatamente al cargar
      document.addEventListener('DOMContentLoaded', () => setTimeout(tryStartLobbyMusic, 200));
      // Fallback: primera interacción del usuario
      ['click','keydown','touchstart'].forEach(ev =>
        document.addEventListener(ev, unlockAudio, { passive: true })
      );

      // --- Sliders de volumen ---
      document.getElementById('volMenu').addEventListener('input', function() {
        menuVolume = this.value / 100;
        if (lobbyActive && currentAudio) currentAudio.volume = menuVolume;
      });
      document.getElementById('volGame').addEventListener('input', function() {
        gameVolume = this.value / 100;
        if (!lobbyActive && currentAudio) currentAudio.volume = gameVolume;
      });

      let bgProps = [];
      let stars = [];

      function initBgEnv() {
        bgProps = [
          { type: 'tree', x: 50 },
          { type: 'tree', x: 150 },
          { type: 'house', x: 300 },
          { type: 'tree', x: 550 },
          { type: 'windmill', x: 700 },
          { type: 'tree', x: 900 }
        ];
        stars = [];
        for (let i = 0; i < 40; i++) {
          stars.push({
            x: Math.random() * W,
            y: Math.random() * (GROUND_Y - 100),
            size: Math.random() < 0.5 ? 2 : 4
          });
        }
      }

      // --- curva de dificultad: progresiva y suave ---
      const BASE_SPEED = 7.0;       // velocidad inicial
      const MAX_SPEED_ADD = 6.0;    // techo de velocidad extra ganada con el tiempo
      const RAMP_FRAMES = 2400;     // frames (a 60fps ≈ 40s) para llegar al techo de velocidad

      let player, obstacles, powerups, particles, clouds, nextObstacleIn, nextPowerupIn;
      let activeBuffs = {}; // {shield: framesLeft, multi: framesLeft, slow: framesLeft, magnet: framesLeft, doubleJump: framesLeft}

      function resetGame() {
        score = 0;
        speed = BASE_SPEED;
        frame = 0;
        multiplier = 1;
        scoreLog = [{ t: 0, ev: 'start' }];
        sessionCoins = 0;
        document.getElementById('sessionCoinsDisplay').innerHTML = '<img src="assets/coin.png" style="width:36px; vertical-align:middle; margin-top:-4px; margin-right:4px;"> 0';
        activeBuffs = {};
        obstacles = [];
        powerups = [];
        clouds = [];
        particles = [];
        initBgEnv();

        nextObstacleIn = 90;
        nextPowerupIn = 300; // primer powerup a los 5 segundos aprox
        clouds = [];
        for (let i = 0; i < 4; i++) {
          let nx, ny, nw, nh, overlap;
          let tries = 0;
          do {
            nx = Math.random() * W;
            ny = 10 + Math.random() * 110;
            nw = 100 + Math.random() * 50;
            nh = 50 + Math.random() * 25;
            overlap = clouds.some(c => Math.abs(c.x - nx) < c.w * 0.8 + nw * 0.8 && Math.abs(c.y - ny) < c.h * 0.8 + nh * 0.8);
            tries++;
          } while (overlap && tries < 10);

          if (!overlap) {
            clouds.push({ x: nx, y: ny, w: nw, h: nh, speedMult: 0.1 + Math.random() * 0.15 });
          }
        }
        player = {
          x: W * 0.08, y: GROUND_Y - 48, w: 52, h: 48,
          vy: 0, jumping: false, ducking: false,
          jumpsLeft: 1, baseJumps: 1,
          legFrame: 0
        };
      }

      // ---------- input ----------
      function jump() {
        if (state !== 'playing') return;
        if (player.jumpsLeft > 0) {
          player.vy = -14.5;
          player.jumping = true;
          player.jumpsLeft--;
        }
      }
      function duckStart() {
        if (state !== 'playing') return;
        player.ducking = true;
        // Si está en el aire, la caída es inmediata (vuelve al suelo rápido)
        if (player.jumping || player.vy < 0) {
          player.vy = 8; // impulso hacia abajo
        }
      }
      function duckEnd() { player.ducking = false; }

      window.addEventListener('keydown', e => {
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
        if (e.code === 'ArrowDown') { e.preventDefault(); duckStart(); }
        if (state === 'playing') {
          if (e.code === 'Digit1' || e.code === 'Numpad1') useItem('shield', 10);
          if (e.code === 'Digit2' || e.code === 'Numpad2') useItem('doubleJump', 15);
          if (e.code === 'Digit3' || e.code === 'Numpad3') useItem('magnet', 15);
          if (e.code === 'Digit4' || e.code === 'Numpad4') useItem('multi', 15);
          if (e.code === 'Digit5' || e.code === 'Numpad5') useItem('multi4', 15);
          if (e.code === 'Digit6' || e.code === 'Numpad6') useItem('multi6', 15);
        }
      });
      window.addEventListener('keyup', e => {
        if (e.code === 'ArrowDown') duckEnd();
      });

      // Mobile: el canvas solo registra toque para desbloquear audio
      canvas.addEventListener('touchstart', e => { e.preventDefault(); }, { passive: false });
      canvas.addEventListener('mousedown', jump);

      // --- Botones dedicados para móvil ---
      const btnJump = document.getElementById('btnJump');
      const btnDuck = document.getElementById('btnDuck');

      // Botón SALTAR
      btnJump.addEventListener('touchstart', e => {
        e.preventDefault();
        btnJump.classList.add('pressed');
        jump();
      }, { passive: false });
      btnJump.addEventListener('touchend', e => {
        e.preventDefault();
        btnJump.classList.remove('pressed');
      }, { passive: false });

      // Botón AGACHARSE (mantener presionado = agachado, soltar = derecho)
      btnDuck.addEventListener('touchstart', e => {
        e.preventDefault();
        btnDuck.classList.add('pressed');
        duckStart();
      }, { passive: false });
      btnDuck.addEventListener('touchend', e => {
        e.preventDefault();
        btnDuck.classList.remove('pressed');
        duckEnd();
      }, { passive: false });
      btnDuck.addEventListener('touchcancel', e => {
        btnDuck.classList.remove('pressed');
        duckEnd();
      });

      document.getElementById('startBtn').addEventListener('click', startGame);

      // --- Cuenta regresiva ---
      let countdownValue = 0;   // 3, 2, 1
      let countdownTimer = 0;   // frames por cada número
      const COUNTDOWN_FPS = 60; // 1 segundo por número

      function startGame() {
        document.getElementById('gameWrap').classList.add('is-playing');
        resetGame();
        state = 'countdown';
        countdownValue = 3;
        countdownTimer = COUNTDOWN_FPS;
        document.getElementById('overlay').classList.add('hidden');
        // Detener lobby y arrancar música de juego al terminar el countdown
      }

      function beginPlay() {
        state = 'playing';
        document.getElementById('inventoryHud').style.display = 'flex';
        stopMusic();
        playMusic('music/musicnormal.mp3');
      }

      function startRun() {
        document.getElementById('gameWrap').classList.add('is-playing');
        resetGame();
        state = 'countdown';
        countdownValue = 3;
        countdownTimer = COUNTDOWN_FPS;
        document.getElementById('overlay').classList.add('hidden');
      }

      function endGame() {
        state = 'dead';
        document.getElementById('inventoryHud').style.display = 'none';
        document.getElementById('gameWrap').classList.remove('is-playing');
        scoreLog.push({ t: frame, ev: 'end', score: Math.floor(score) });
        showGameOver();
        sendScoreToBackend(scoreLog, Math.floor(score));
        if (sessionCoins > 0) syncWallet(sessionCoins);
        stopMusic();
        playLobbyMusic();
      }

      function showGameOver() {
        const overlay = document.getElementById('overlay');
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
    <h2>GAME OVER</h2>
    <div class="bigscore">PUNTOS: ${Math.floor(score)}</div>
    <div style="font-size:16px; margin:10px 0;">Monedas ganadas: 🟢 ${sessionCoins}</div>
    <div class="menu-buttons">
      <button class="menu-btn" onclick="startRun()">🔄 JUGAR DE NUEVO</button>
      <button class="menu-btn" onclick="returnToMenu()">🏠 MENÚ PRINCIPAL</button>
    </div>
  `;
      }

      function returnToMenu() {
        state = 'idle';
        document.getElementById('inventoryHud').style.display = 'none';
        document.getElementById('gameWrap').classList.remove('is-playing');
        resetGame();
        ctx.fillStyle = '#7fc8c2';
        ctx.fillRect(0, 0, W, H);
        const overlay = document.getElementById('overlay');
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
          <img src="assets/logo_capi.png" class="logo" alt="Capibara Logo" onerror="this.style.display='none'">
          <h2>CAPI RUN</h2>
          <div class="menu-buttons">
            <button id="startBtn" class="menu-btn" onclick="startGame()">▶️ START GAME</button>
            <button class="menu-btn" onclick="openModal('storeModal')">🛒 STORE</button>
            <button class="menu-btn" onclick="openModal('leaderboardModal')">🏆 LEADERBOARD</button>
            <button class="menu-btn" onclick="openModal('authModal')">⚙️ ACCOUNT</button>
          </div>
        `;
      }

      // ---------- spawns ----------
      function maybeSpawnObstacle() {
        nextObstacleIn--;
        if (nextObstacleIn <= 0) {
          const type = Math.random() < 0.4 ? 'log' : 'rock';
          if (type === 'rock') {
            const isLarge = Math.random() < 0.4;
            const count = Math.floor(Math.random() * 3) + 1; // 1, 2 o 3 rocas juntas
            const singleW = isLarge ? 42 : 28;
            const singleH = isLarge ? 46 : 30;
            obstacles.push({
              x: W + 20, y: GROUND_Y - singleH,
              w: singleW * count, h: singleH,
              type: 'rock',
              count: count,
              singleW: singleW
            });
          } else {
            obstacles.push({
              x: W + 20, y: GROUND_Y - 30, w: 56, h: 30,
              type: 'log'
            });
          }

          // Calcular el siguiente spawn. A más velocidad, menos frames pero la misma distancia en píxeles.
          const minFrames = Math.max(30, 90 - speed * 4); // gap mínimo
          const maxFrames = minFrames + 40 + Math.random() * 50; // gap máximo variable
          nextObstacleIn = Math.floor(minFrames + Math.random() * (maxFrames - minFrames));
        }
      }

      // Sistema de rareza ponderada para powerups
      // coin=40%, magnet=25%, doubleJump=18%, shield=12%, multi=5%
      function pickPowerupType() {
        const roll = Math.random() * 100;
        if (roll < 40) return 'coin';       // comun
        if (roll < 65) return 'magnet';     // raro
        if (roll < 83) return 'doubleJump'; // mas raro
        if (roll < 95) return 'shield';     // aun mas raro
        return 'multi';                     // el mas dificil
      }

      function maybeSpawnPowerup() {
        nextPowerupIn--;
        if (nextPowerupIn <= 0) {

          // El slow aparece con 8% de probabilidad y solo cuando la pista está despejada
          const isSlow = Math.random() < 0.08;
          const type = isSlow ? 'slow' : pickPowerupType();

          // Zona de altura segura: entre 60px y 130px sobre el suelo
          const minY = GROUND_Y - 130;
          const maxY = GROUND_Y - 70;
          const py = minY + Math.random() * (maxY - minY);

          const travelFrames = W / speed;
          const projectedX = player.x + 30;
          const nearObstacle = obstacles.some(o => {
            const futureX = o.x - speed * (travelFrames * 0.5);
            return Math.abs(futureX - projectedX) < (o.w + 80);
          });

          if (isSlow && nearObstacle) {
            nextPowerupIn = 60;
            return;
          }

          powerups.push({ x: W + 20, y: py, w: 48, h: 48, type });

          // Gap mayor: powerups menos frecuentes para que tengan valor
          const minGap = Math.max(220, 380 - speed * 8);
          nextPowerupIn = Math.floor(minGap + Math.random() * 140);
        }
      }

      // ---------- update ----------
      function update() {
        frame++;

        // velocidad: rampa progresiva y suave hasta un techo, sin picos bruscos
        const ramp = Math.min(1, frame / RAMP_FRAMES);
        const targetSpeed = BASE_SPEED + ramp * MAX_SPEED_ADD;
        speed += (targetSpeed - speed) * 0.02; // suaviza el cambio frame a frame
        if (activeBuffs.slow) speed *= 0.55;

        // score & multiplier
        multiplier = activeBuffs.multi6 ? 6 : (activeBuffs.multi4 ? 4 : (activeBuffs.multi ? 2 : 1));
        score += 0.12 * speed * multiplier;

        // buffs countdown
        for (const k in activeBuffs) {
          activeBuffs[k]--;
          if (activeBuffs[k] <= 0) delete activeBuffs[k];
        }

        // player physics
        player.vy += 0.85; // gravedad
        player.y += player.vy;
        if (player.y > GROUND_Y - player.h) {
          player.y = GROUND_Y - player.h;
          player.vy = 0;
          player.jumping = false;
          player.jumpsLeft = activeBuffs.doubleJump ? 2 : 1;
        }
        player.legFrame += 0.3;

        // spawn
        maybeSpawnObstacle();
        maybeSpawnPowerup();

        if (frame % 80 === 0 && Math.random() < 0.8) {
          const nw = 100 + Math.random() * 50;
          const nh = 50 + Math.random() * 25;
          const ny = 10 + Math.random() * 110;
          const nx = W + 20;
          const overlap = clouds.some(c => Math.abs(c.x - nx) < c.w * 0.8 + nw * 0.8 && Math.abs(c.y - ny) < c.h * 0.8 + nh * 0.8);
          if (!overlap) {
            clouds.push({ x: nx, y: ny, w: nw, h: nh, speedMult: 0.1 + Math.random() * 0.15 });
          }
        }

        for (const c of clouds) c.x -= speed * c.speedMult;
        clouds = clouds.filter(c => c.x + c.w > -50);

        for (const p of bgProps) p.x -= speed * 0.3; // parallax lento

        // move obstacles
        for (const o of obstacles) o.x -= speed;
        obstacles = obstacles.filter(o => o.x + o.w > -10);

        // move powerups (magnet attracts)
        for (const p of powerups) {
          p.x -= speed;
          if (activeBuffs.magnet) {
            const dx = (player.x - p.x), dy = (player.y - p.y);
            const dist = Math.hypot(dx, dy);
            if (dist < 200) { p.x += dx * 0.08; p.y += dy * 0.08; }
          }
        }
        powerups = powerups.filter(p => p.x > -30);

        // collisions: obstacles
        const hitboxH = player.ducking ? player.h * 0.55 : player.h;
        const hitboxY = player.ducking ? player.y + player.h * 0.45 : player.y;

        // Margen de error (hitbox más pequeña que el dibujo para que el salto no sea tan estricto)
        const mx = 12; // margen horizontal
        const my = 8;  // margen vertical

        for (const o of obstacles) {
          if (rectsOverlap(player.x + mx, hitboxY + my, player.w - mx * 2, hitboxH - my * 2, o.x, o.y, o.w, o.h)) {
            if (activeBuffs.shield) {
              obstacles = obstacles.filter(x => x !== o);
              score += 5;
              spawnParticles(o.x, o.y, PALETTE.shield);
            } else {
              endGame();
              return;
            }
          }
        }

        // collisions: powerups
        for (const p of powerups) {
          if (rectsOverlap(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
            applyPowerup(p.type);
            spawnParticles(p.x, p.y, colorForPower(p.type));
            powerups = powerups.filter(x => x !== p);
          }
        }

        // particles
        for (const pt of particles) { pt.x += pt.vx; pt.y += pt.vy; pt.life--; }
        particles = particles.filter(p => p.life > 0);

        // log evento de muestreo cada ~2s para validación backend
        if (frame % 120 === 0) {
          scoreLog.push({ t: frame, ev: 'checkpoint', score: Math.floor(score), buffs: Object.keys(activeBuffs) });
        }
      }

      function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
      }

      function applyPowerup(type) {
        scoreLog.push({ t: frame, ev: 'powerup', type });
        switch (type) {
          case 'shield': activeBuffs.shield = 600; break; // 10s a 60fps
          case 'multi': activeBuffs.multi = 600; break;
          case 'slow': activeBuffs.slow = 300; break; // 5s
          case 'magnet': activeBuffs.magnet = 480; break; // 8s
          case 'doubleJump': activeBuffs.doubleJump = 600; player.jumpsLeft = 2; break;
          case 'coin':
            sessionCoins += 10;
            document.getElementById('sessionCoinsDisplay').innerHTML = '<img src="assets/coin.png" style="width:36px; vertical-align:middle; margin-top:-4px; margin-right:4px;"> ' + sessionCoins;
            break;
        }
        updateBuffsHud();
      }

      function colorForPower(type) {
        return {
          shield: PALETTE.shield, multi: PALETTE.multi, slow: PALETTE.slow,
          magnet: PALETTE.magnet, doubleJump: '#6ee7b7', coin: PALETTE.coin
        }[type];
      }

      function spawnParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
          particles.push({
            x, y, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 4,
            life: 26, color
          });
        }
      }

      // ---------- HUD ----------
      
      function updateInventoryHud() {
         const ids = ['shield', 'doubleJump', 'magnet', 'multi', 'multi4', 'multi6'];
         ids.forEach(id => {
            const el = document.getElementById('inv-' + id);
            if (el) {
               const qty = playerInventory[id] || 0;
               el.querySelector('.inv-qty').textContent = 'x' + qty;
               if (qty > 0) {
                  el.style.opacity = '1';
               } else {
                  el.style.opacity = '0.5';
               }
            }
         });
      }

      async function useItem(type, seconds) {
        if (!playerInventory[type] || playerInventory[type] <= 0) return;
        
        // Consumir
        playerInventory[type]--;
        updateInventoryHud();
        
        // Activar
        const frames = seconds * 60;
        activeBuffs[type] = (activeBuffs[type] || 0) + frames;
        if (type === 'doubleJump') player.jumpsLeft = 2;
        updateBuffsHud();
        
        // Guardar en nube silenciosamente
        await syncWallet(0, true);
      }

      function updateBuffsHud() {
        const box = document.getElementById('buffs');
        const labels = {
          shield: '🛡 ESCUDO', multi: '✖2 PUNTOS', multi4: '✖4 PUNTOS', multi6: '✖6 PUNTOS', slow: '🐢 LENTO',
          magnet: '🧲 IMÁN', doubleJump: '⭐ DOBLE SALTO'
        };
        box.innerHTML = Object.keys(activeBuffs).map(k => {
          const secs = Math.ceil(activeBuffs[k] / 60);
          return `<div class="buff-pill">${labels[k] || k} ${secs}s</div>`;
        }).join('');
      }

      // ---------- ciclo dia/noche ----------
      function lerpColor(a, b, amount) {
        const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
        const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
        const rr = Math.round(ar + amount * (br - ar));
        const rg = Math.round(ag + amount * (bg - ag));
        const rb = Math.round(ab + amount * (bb - ab));
        return `#${(1 << 24 | rr << 16 | rg << 8 | rb).toString(16).slice(1)}`;
      }

      function getSkyColor(cycleProgress) {
        const stops = [
          { p: 0.00, c: '#30264f' }, // medianoche
          { p: 0.20, c: '#30264f' }, // noche
          { p: 0.30, c: '#ff9a76' }, // amanecer
          { p: 0.40, c: '#87ceeb' }, // dia
          { p: 0.70, c: '#87ceeb' }, // tarde
          { p: 0.85, c: '#fd5e53' }, // atardecer
          { p: 1.00, c: '#30264f' }  // medianoche
        ];
        for (let i = 0; i < stops.length - 1; i++) {
          if (cycleProgress >= stops[i].p && cycleProgress <= stops[i + 1].p) {
            const t = (cycleProgress - stops[i].p) / (stops[i + 1].p - stops[i].p);
            return lerpColor(stops[i].c, stops[i + 1].c, t);
          }
        }
        return stops[0].c;
      }

      // ---------- dibujo pixel art ----------
      function drawBackground() {
        const CYCLE_LENGTH = 7000; // frames por ciclo completo (~116 segs)
        const cycleProgress = (globalFrame % CYCLE_LENGTH) / CYCLE_LENGTH;
        const currentSky = getSkyColor(cycleProgress);

        // Cielo dinámico
        ctx.fillStyle = currentSky;
        ctx.fillRect(0, 0, W, GROUND_Y);

        // Nubes de fondo silueteadas
        ctx.fillStyle = '#3f3266';
        ctx.beginPath();
        ctx.arc(100, GROUND_Y, 80, 0, Math.PI * 2);
        ctx.arc(250, GROUND_Y, 120, 0, Math.PI * 2);
        ctx.arc(450, GROUND_Y, 90, 0, Math.PI * 2);
        ctx.arc(700, GROUND_Y, 140, 0, Math.PI * 2);
        ctx.arc(900, GROUND_Y, 100, 0, Math.PI * 2);
        ctx.fill();

        // Estrellas (se ocultan de día)
        const isDay = cycleProgress > 0.3 && cycleProgress < 0.8;
        if (!isDay) {
          ctx.fillStyle = '#fff';
          // desvanecimiento suave al amanecer/atardecer
          let starAlpha = 1;
          if (cycleProgress >= 0.25 && cycleProgress <= 0.35) starAlpha = 1 - (cycleProgress - 0.25) / 0.1;
          if (cycleProgress >= 0.75 && cycleProgress <= 0.85) starAlpha = (cycleProgress - 0.75) / 0.1;

          for (const s of stars) {
            const twinkle = state === 'idle' ? 0.5 + Math.sin(globalFrame * 0.05 + s.x) * 0.5 : 0.8;
            ctx.globalAlpha = starAlpha * twinkle;
            ctx.fillRect(s.x, s.y, s.size, s.size);
          }
          ctx.globalAlpha = 1;
        }

        // Nubes originales
        for (const c of clouds) {
          drawSprite(ctx, CLOUD_SPRITE, c.x, c.y, c.w, c.h);
        }

        // Props (Parallax)
        for (const p of bgProps) {
          const by = GROUND_Y;
          if (p.type === 'tree') {
            ctx.fillStyle = '#3a2e1d'; ctx.fillRect(p.x + 12, by - 40, 8, 40); // tronco
            ctx.fillStyle = '#4a752c'; ctx.fillRect(p.x, by - 80, 32, 40); // hojas
            ctx.fillStyle = '#5c9136'; ctx.fillRect(p.x + 4, by - 84, 24, 8); // tope hojas
          } else if (p.type === 'house') {
            ctx.fillStyle = '#8f683a'; ctx.fillRect(p.x, by - 60, 100, 60); // base
            ctx.fillStyle = '#a67d4a'; ctx.fillRect(p.x + 8, by - 52, 24, 24); // ventana
            ctx.fillStyle = '#a67d4a'; ctx.fillRect(p.x + 68, by - 52, 24, 24); // ventana
            ctx.fillStyle = '#4a3721'; ctx.fillRect(p.x + 38, by - 40, 24, 40); // puerta
            ctx.fillStyle = '#445152'; ctx.beginPath(); ctx.moveTo(p.x - 10, by - 60); ctx.lineTo(p.x + 110, by - 60); ctx.lineTo(p.x + 50, by - 90); ctx.fill(); // techo
            ctx.fillStyle = '#556566'; ctx.fillRect(p.x + 20, by - 95, 12, 30); // chimenea
          } else if (p.type === 'windmill') {
            ctx.fillStyle = '#7a6452'; ctx.beginPath(); ctx.moveTo(p.x, by); ctx.lineTo(p.x + 60, by); ctx.lineTo(p.x + 45, by - 100); ctx.lineTo(p.x + 15, by - 100); ctx.fill(); // torre
            ctx.fillStyle = '#2c221b'; ctx.beginPath(); ctx.arc(p.x + 30, by, 15, Math.PI, 0); ctx.fill(); // puerta
            ctx.save();
            ctx.translate(p.x + 30, by - 80);
            ctx.rotate(state === 'playing' ? globalFrame * 0.05 : globalFrame * 0.01);
            ctx.fillStyle = '#d1ba8e';
            ctx.fillRect(-5, -60, 10, 120);
            ctx.fillRect(-60, -5, 120, 10);
            ctx.fillStyle = '#3a2e1d'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }
        }

        // Base de tierra
        ctx.fillStyle = '#654321'; // marrón más oscuro para coincidir con noche
        ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
        ctx.fillStyle = '#4a752c'; // pasto verde oscuro
        ctx.fillRect(0, GROUND_Y, W, 10);

        // Patrón de tierra profunda
        ctx.fillStyle = '#543619';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(0, GROUND_Y + 28 + i * 14, W, 4);
        }

        // Franja de hierba y tierra superior animada
        const tileW = 40;
        const tileH = 20;
        for (let x = -((frame * speed) % tileW); x < W; x += tileW) {
          drawSprite(ctx, GRASS_SPRITE, x, GROUND_Y, tileW, tileH);
        }
      }

      function drawCapibara() {
        const { x, y, w, h, ducking, jumping } = player;
        const bodyH = ducking ? h * 0.6 : h;
        const by = ducking ? y + h * 0.4 : y;

        ctx.save();
        // sombra
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, GROUND_Y + 6, w * 0.55, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        let spriteToDraw;
        if (ducking) {
          spriteToDraw = CAPI_DUCK;
        } else if (jumping || player.vy !== 0) {
          spriteToDraw = CAPI_JUMP;
        } else {
          const walkCycle = Math.floor(frame * speed * 0.05) % 2;
          spriteToDraw = walkCycle === 0 ? CAPI_F1 : CAPI_F2;
        }

        drawSprite(ctx, spriteToDraw, x, by, w, bodyH);

        // escudo visual
        if (activeBuffs.shield) {
          ctx.strokeStyle = PALETTE.shield;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x + w / 2, by + bodyH / 2, w * 0.85, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      function drawObstacles() {
        for (const o of obstacles) {
          if (o.type === 'rock') {
            for (let i = 0; i < o.count; i++) {
              drawSprite(ctx, ROCK_SPRITE, o.x + i * o.singleW, o.y, o.singleW, o.h);
            }
          } else {
            drawSprite(ctx, LOG_SPRITE, o.x, o.y, o.w, o.h);
          }
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(o.x, o.y + o.h - 6, o.w, 6);
        }
      }

      function drawPowerups() {
        for (const p of powerups) {
          ctx.save();
          const bob = Math.sin(frame * 0.1 + p.x * 0.05) * 5;
          const img = POWERUP_IMGS[p.type];
          const cx = p.x + p.w / 2;
          const cy = p.y + p.h / 2 + bob;
          const r = p.w / 2 + 4;

          if (p.type === 'slow') {
            // Aura roja pulsante
            ctx.fillStyle = '#ff0000';
            ctx.globalAlpha = 0.25 + Math.sin(frame * 0.25) * 0.12;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Círculo rojo con borde amarillo
            ctx.fillStyle = '#e3000b';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Icono ⚠️ pequeño centrado (sin texto extra)
            ctx.font = `${p.w * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠️', cx, cy);
          } else {
            // Aura / fondo circular de color
            ctx.fillStyle = colorForPower(p.type);
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Círculo sólido
            ctx.fillStyle = colorForPower(p.type);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffffcc';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Imagen PNG o fallback emoji
            if (img && img.complete && img.naturalWidth !== 0) {
              const s = p.w * 0.85;
              ctx.drawImage(img, cx - s / 2, cy - s / 2, s, s);
            } else {
              const fallback = { shield: '🛡', multi: 'x2', magnet: '🧲', doubleJump: '⭐', coin: '●' };
              ctx.fillStyle = '#fff';
              ctx.font = `${p.w * 0.6}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(fallback[p.type] || '?', cx, cy);
            }
          }
          ctx.restore();
        }
      }

      function drawParticles() {
        for (const pt of particles) {
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = pt.life / 26;
          ctx.fillRect(pt.x, pt.y, 6, 6);
          ctx.globalAlpha = 1;
        }
      }

      // --- Dibujo de cuenta regresiva pixel art ---
      function drawCountdown() {
        const numStr = String(countdownValue);
        ctx.save();
        // Fondo semitransparente
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, H);
        
        // Número grande con estilo pixel art (bloque de texto)
        const size = 140;
        ctx.font = `bold ${size}px 'Press Start 2P', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Sombra oscura (efecto 3D pixel)
        ctx.fillStyle = '#000';
        ctx.fillText(numStr, W/2 + 6, H/2 + 6);
        
        // Color según número
        const colors = {3:'#ff4444', 2:'#ffaa00', 1:'#44ff44'};
        ctx.fillStyle = colors[countdownValue] || '#fff';
        ctx.fillText(numStr, W/2, H/2);
        
        // Texto pequeño abajo
        ctx.font = "20px 'Press Start 2P', monospace";
        ctx.fillStyle = '#ffffffcc';
        ctx.fillText('LISTO?', W/2, H/2 + 90);
        ctx.restore();
      }

      function draw() {
        drawBackground();
        drawObstacles();
        drawPowerups();
        drawCapibara();
        drawParticles();
        if (state === 'countdown') drawCountdown();
      }

      function updateScoreHud() {
        document.getElementById('score').textContent = `PUNTOS: ${Math.floor(score)}${multiplier > 1 ? ' (x' + multiplier + ')' : ''}`;
      }

      let lastTime = 0;
      const MS_PER_UPDATE = 1000 / 60;
      let accumulator = 0;

      function loop(currentTime) {
        if (lastTime === 0) lastTime = currentTime;
        let dt = currentTime - lastTime;
        lastTime = currentTime;
        if (dt > 250) dt = 250;

        globalFrame++;

        if (state === 'playing') {
          accumulator += dt;
          while (accumulator >= MS_PER_UPDATE) {
            update();
            accumulator -= MS_PER_UPDATE;
          }
          updateScoreHud();
          updateBuffsHud();
        } else if (state === 'countdown') {
          // Avanzar el capibara pero sin obstaculos ni muerte
          accumulator += dt;
          while (accumulator >= MS_PER_UPDATE) {
            frame++;
            player.legFrame += 0.3;
            accumulator -= MS_PER_UPDATE;
            countdownTimer--;
            if (countdownTimer <= 0) {
              countdownValue--;
              if (countdownValue <= 0) {
                beginPlay();
              } else {
                countdownTimer = COUNTDOWN_FPS;
              }
            }
          }
        } else if (state === 'idle' || state === 'dead') {
          // Animar las nubes suavemente en el menú
          frame++;
          if (frame % 120 === 0 && Math.random() < 0.6) {
            const nw = 100 + Math.random() * 50;
            const nh = 50 + Math.random() * 25;
            const ny = 10 + Math.random() * 110;
            clouds.push({ x: W + 20, y: ny, w: nw, h: nh, speedMult: 0.05 + Math.random() * 0.05 });
          }
          for (const c of clouds) c.x -= 1.5 * c.speedMult;
          clouds = clouds.filter(c => c.x + c.w > -50);
        }

        draw();
        requestAnimationFrame(loop);
      }
      resetGame();
      draw();
      requestAnimationFrame(loop);
      // Iniciar música de lobby después de la primera interacción del usuario
      document.addEventListener('click', () => {
        if (!currentAudio) playLobbyMusic();
      }, { once: true });
      document.addEventListener('keydown', () => {
        if (!currentAudio) playLobbyMusic();
      }, { once: true });
      document.addEventListener('touchstart', () => {
        if (!currentAudio) playLobbyMusic();
      }, { once: true });

      /* ============================================================
         INTEGRACIÓN CON SUPABASE - leaderboard semanal + login Twitch
         ============================================================ */

      const SUPABASE_URL = 'https://udzvhvxleujmyyzwfvjc.supabase.co';
      const SUPABASE_ANON_KEY = 'sb_publishable_TehtfAvBQg05hNcaSVdg1Q_E7Nc7ltt';

      const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      let currentUser = null;

      // ---------- Login con Twitch ----------
      document.getElementById('twitchLoginBtn').addEventListener('click', async () => {
        await sb.auth.signInWithOAuth({
          provider: 'twitch',
          options: { redirectTo: window.location.href }
        });
      });

      async function checkSession() {
        const { data: { session } } = await sb.auth.getSession();
        currentUser = session?.user || null;
        updateAuthUI();
      }

      function updateAuthUI() {
        const btn = document.getElementById('twitchLoginBtn');
        const info = document.getElementById('userInfo');
        if (currentUser) {
          const name = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || 'jugador';
          btn.textContent = 'CERRAR SESIÓN';
          btn.onclick = async () => { await sb.auth.signOut(); currentUser = null; updateAuthUI(); };
          info.textContent = `Conectado como ${name}`;
          document.getElementById('storeContent').style.display = 'flex';
          document.getElementById('storeAuthMsg').style.display = 'none';
        } else {
          btn.textContent = 'CONECTAR CON TWITCH';
          btn.onclick = async () => {
            await sb.auth.signInWithOAuth({ provider: 'twitch', options: { redirectTo: window.location.href } });
          };
          info.textContent = '';
          document.getElementById('storeContent').style.display = 'none';
          document.getElementById('storeAuthMsg').style.display = 'block';
        }
      }

      sb.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        updateAuthUI();
        if (currentUser) {
          syncWallet(0);
        }
        loadLeaderboard();
      });

      // ---------- Modals ----------
      function openModal(id) {
        document.getElementById(id).style.display = 'flex';
      }
      
      function showStoreTab(tabId) {
        document.querySelectorAll('.store-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.store-tab-content').forEach(content => content.classList.remove('active'));
        
        document.getElementById('tabBtn-' + tabId).classList.add('active');
        document.getElementById('tab-' + tabId).classList.add('active');
      }

      function closeModal(id) {
        document.getElementById(id).style.display = 'none';
      }

      // ---------- Guardar puntaje ----------
      async function sendScoreToBackend(log, finalScore) {
        if (!currentUser) {
          console.warn('No hay sesión de Twitch, el puntaje no se guarda en el top.');
          return;
        }

        const username = currentUser.user_metadata?.name
          || currentUser.user_metadata?.full_name
          || currentUser.email
          || 'jugador';

        const { error } = await sb.from('scores').insert({
          twitch_user_id: currentUser.id,
          twitch_username: username,
          score: finalScore,
          run_log: log
        });

        if (error) {
          console.error('Error guardando puntaje:', error);
          return;
        }

        loadLeaderboard();
      }

      // ---------- Monedas y Tienda ----------
      async function syncWallet(addedCoins, forceSave = false) {
        if (!currentUser) return;
        const uid = currentUser.id;
        const username = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || currentUser.email || 'jugador';

        // 1. Obtener balance actual e inventario
        const { data: walletData, error: selErr } = await sb
          .from('player_wallets')
          .select('balance, inventory')
          .eq('twitch_user_id', uid)
          .single();

        let currentBalance = 0;
        let isNew = false;
        if (selErr && selErr.code === 'PGRST116') { // No existe fila
          isNew = true;
        } else if (walletData) {
          currentBalance = walletData.balance;
          if (walletData.inventory && (addedCoins === 0 && !forceSave)) {
             // Solo cargar del servidor si no estamos modificando la mochila localmente
             playerInventory = { ...playerInventory, ...walletData.inventory };
          }
        }
        updateInventoryHud();

        const newBalance = currentBalance + addedCoins;
        totalCoins = newBalance;
        document.getElementById('coinBalanceDisplay').textContent = totalCoins;

        // 2. Guardar nuevo balance si hubo un cambio
        if (addedCoins !== 0 || isNew || forceSave) {
          const payload = {
            twitch_user_id: uid,
            twitch_username: username,
            balance: newBalance,
            inventory: playerInventory,
            updated_at: new Date().toISOString()
          };
          if (isNew) {
            await sb.from('player_wallets').insert(payload);
          } else {
            await sb.from('player_wallets').update(payload).eq('twitch_user_id', uid);
          }
        }
      }

      async function buyBuff(type, cost, seconds) {
        if (!currentUser) return alert('Debes iniciar sesión primero.');
        if (totalCoins < cost) {
          return alert('No tienes monedas suficientes.');
        }

        // Descontar visualmente
        totalCoins -= cost;
        document.getElementById('coinBalanceDisplay').textContent = totalCoins;

        // Añadir a inventario en lugar de activar
        playerInventory[type] = (playerInventory[type] || 0) + 1;
        updateInventoryHud();

        // Guardar en DB (usamos syncWallet enviando monedas negativas)
        await syncWallet(-cost, true);
      }

      // ---------- Cargar leaderboard ----------
      function updateWeekRange() {
        const now = new Date();
        const day = (now.getDay() + 6) % 7; // lunes = 0
        const monday = new Date(now); monday.setDate(now.getDate() - day);
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        const fmt = d => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
        document.getElementById('weekRange').textContent = `${fmt(monday)} – ${fmt(sunday)}`;
      }

      async function loadLeaderboard() {
        updateWeekRange();
        const list = document.getElementById('leaderboardList');
        const { data, error } = await sb
          .from('current_week_leaderboard')
          .select('twitch_username, best_score')
          .order('best_score', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error cargando leaderboard:', error);
          list.innerHTML = `<li><span>No se pudo cargar el top</span></li>`;
          return;
        }

        if (!data || data.length === 0) {
          list.innerHTML = `<li><span>Todavía nadie ha jugado esta semana 🐹</span></li>`;
          return;
        }

        list.innerHTML = data.map((row, i) =>
          `<li><span>#${i + 1} ${row.twitch_username}</span><span>${row.best_score}</span></li>`
        ).join('');
      }

      checkSession();
      loadLeaderboard();

      // ---------- Pantalla completa (Fullscreen API nativa) ----------
      const fullscreenBtn = document.getElementById('fullscreenBtn');
      const gameWrap = document.getElementById('gameWrap');
      const gamePanel = document.getElementById('gamePanel');

      function enterFullscreen() {
        const el = gameWrap;
        if (el.requestFullscreen)           return el.requestFullscreen();
        if (el.webkitRequestFullscreen)     return el.webkitRequestFullscreen();
        if (el.mozRequestFullScreen)        return el.mozRequestFullScreen();
        if (el.msRequestFullscreen)         return el.msRequestFullscreen();
        // Fallback CSS si el navegador no soporta la API
        gamePanel.classList.add('fullscreen-mode');
        document.body.style.overflow = 'hidden';
      }

      function exitFullscreen() {
        if (document.exitFullscreen)           return document.exitFullscreen();
        if (document.webkitExitFullscreen)     return document.webkitExitFullscreen();
        if (document.mozCancelFullScreen)      return document.mozCancelFullScreen();
        if (document.msExitFullscreen)         return document.msExitFullscreen();
        // Fallback CSS
        gamePanel.classList.remove('fullscreen-mode');
        document.body.style.overflow = '';
      }

      function isFullscreen() {
        return !!(document.fullscreenElement ||
                  document.webkitFullscreenElement ||
                  document.mozFullScreenElement ||
                  document.msFullscreenElement);
      }

      fullscreenBtn.addEventListener('click', () => {
        if (isFullscreen()) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      });

      // Sincronizar texto del botón con el estado real del fullscreen
      ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','msfullscreenchange']
        .forEach(ev => document.addEventListener(ev, () => {
          const fs = isFullscreen();
          fullscreenBtn.textContent = fs ? '✕ SALIR DE PANTALLA COMPLETA' : '⧆ PANTALLA COMPLETA';
        }));

      // Escape también sale del fullscreen CSS fallback
      document.addEventListener('keydown', e => {
        if (e.code === 'Escape' && gamePanel.classList.contains('fullscreen-mode')) {
          gamePanel.classList.remove('fullscreen-mode');
          fullscreenBtn.textContent = '⧆ PANTALLA COMPLETA';
          document.body.style.overflow = '';
        }
      });

