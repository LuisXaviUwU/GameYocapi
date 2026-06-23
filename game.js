      /* ============================================================
         CAPIBARA RUNNER - lógica del juego
         ============================================================ */

      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const GROUND_Y = H - 80;

      const CAPI_IMG = new Image();
      CAPI_IMG.src = 'assets/capibara.png';

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


      const BIRD_F1 = [
        "....bb..........",
        "...bmmb.........",
        "..bmmmmbb.......",
        ".bmmmmmmmbbbbbbb",
        "bmmllmmmmmmmmmmd",
        ".bmmmmmmmbbbbbbb",
        "..bmmmmbb.......",
        "...bllb.........",
        "....bb.........."
      ];

      const BIRD_F2 = [
        "................",
        "....bb..........",
        "...bmmb.........",
        "..bmmmmbb.......",
        "bmmllmmmmmmmmmmd",
        "..bmmmmbb.......",
        "...bllb.........",
        "....bb..........",
        "................"
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
      let playerInventory = { shield: 0, shield30: 0, shield60: 0, doubleJump: 0, magnet: 0, multi: 0, multi4: 0, multi6: 0 };
      let difficulty = 'easy'; // 'easy', 'medium', 'hard'
      const DIFFICULTY_CONFIG = {
        easy:    { baseSpeed: 7.0,  maxSpeedAdd: 5.0,  rampFrames: 2400, coinValue: 10,  obstacleMin: 90,  obstacleRand: 80, label: 'FÁCIL',   flyingEnemies: false, diffMult: 1.0  },
        medium:  { baseSpeed: 9.5,  maxSpeedAdd: 8.0,  rampFrames: 1500, coinValue: 30,  obstacleMin: 60,  obstacleRand: 55, label: 'MEDIO',   flyingEnemies: false, diffMult: 1.5  },
        hard:    { baseSpeed: 12.0, maxSpeedAdd: 10.5, rampFrames: 900,  coinValue: 50,  obstacleMin: 40,  obstacleRand: 35, label: 'DIFÍCIL', flyingEnemies: false, diffMult: 2.0  },
        extreme: { baseSpeed: 15.0, maxSpeedAdd: 14.0, rampFrames: 600,  coinValue: 100, obstacleMin: 25,  obstacleRand: 20, label: 'EXTREMO', flyingEnemies: true,  diffMult: 2.5  }
      };
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
      // BASE_SPEED, MAX_SPEED_ADD y RAMP_FRAMES vienen de DIFFICULTY_CONFIG según la dificultad elegida

      let player, obstacles, powerups, particles, clouds, nextObstacleIn, nextPowerupIn;
      let activeBuffs = {}; // {shield: framesLeft, multi: framesLeft, slow: framesLeft, magnet: framesLeft, doubleJump: framesLeft}

      function resetGame() {
        score = 0;
        speed = DIFFICULTY_CONFIG[difficulty].baseSpeed;
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

        nextObstacleIn = DIFFICULTY_CONFIG[difficulty].obstacleMin;
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

      // Mapa dinámico de tecla → {id, seconds} según qué slots están visibles
      // Se reconstruye cada vez que cambia el inventario (en updateInventoryHud)
      let keySlotMap = {}; // e.g. { 'Digit1': { id: 'multi', seconds: 15 }, ... }

      const SLOT_SECONDS = {
        shield: 10, shield30: 30, shield60: 60,
        doubleJump: 15, magnet: 15,
        multi: 15, multi4: 15, multi6: 15
      };

      window.addEventListener('keydown', e => {
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
        if (e.code === 'ArrowDown') { e.preventDefault(); duckStart(); }
        if (state === 'playing') {
          const slot = keySlotMap[e.code];
          if (slot) useItem(slot.id, slot.seconds);
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
        document.getElementById('extraMenuButtons').style.display = 'none';
        // Detener lobby y arrancar música de juego al terminar el countdown
      }

      function beginPlay() {
        state = 'playing';
        document.getElementById('inventoryHud').style.display = 'flex';
        fadeOutAndPlay('music/musicnormal.mp3');
      }

      function fadeOutAndPlay(newSrc) {
        if (!currentAudio) {
          playMusic(newSrc);
          return;
        }
        const fadingAudio = currentAudio;
        currentAudio = null; // desvincula para que no se detenga solo
        lobbyActive = false;
        const startVol = fadingAudio.volume;
        const steps = 30; // ~500ms a 60fps
        let step = 0;
        function fade() {
          step++;
          fadingAudio.volume = Math.max(0, startVol * (1 - step / steps));
          if (step < steps) {
            requestAnimationFrame(fade);
          } else {
            fadingAudio.pause();
            fadingAudio.currentTime = 0;
            playMusic(newSrc);
          }
        }
        fade();
      }

      function startRun() {
        document.getElementById('gameWrap').classList.add('is-playing');
        resetGame();
        state = 'countdown';
        countdownValue = 3;
        countdownTimer = COUNTDOWN_FPS;
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('extraMenuButtons').style.display = 'none';
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
        document.getElementById('extraMenuButtons').style.display = 'block';
        overlay.innerHTML = `
    <h2>GAME OVER</h2>
    <div class="bigscore">PUNTOS: ${Math.floor(score)}</div>
    <div style="font-size:12px; margin:6px 0; color: #aaa;">Modo: ${DIFFICULTY_CONFIG[difficulty].label}</div>
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
        document.getElementById('extraMenuButtons').style.display = 'block';
        overlay.innerHTML = `
          <img src="assets/logo_capi.png" class="logo" alt="Capibara Logo" onerror="this.style.display='none'">
          <h2>CAPI RUN</h2>
          <div class="menu-buttons">
            <button id="startBtn" class="menu-btn" onclick="startGame()">▶️ START GAME</button>
            <button class="menu-btn" onclick="openModal('storeModal')">🛒 STORE</button>
            <button class="menu-btn" onclick="openModal('leaderboardModal')">🏆 LEADERBOARD</button>
            <button class="menu-btn" onclick="openModal('authModal')">⚙️ SETTINGS</button>
          </div>
        `;
      }

      // ---------- spawns ----------
      function maybeSpawnObstacle() {
        nextObstacleIn--;
        if (nextObstacleIn <= 0) {
          // En modo extremo, 50% de probabilidad de enemigo volador
          if (DIFFICULTY_CONFIG[difficulty].flyingEnemies && Math.random() < 0.50) {
            // 50% pájaro ALTO (agacharse) / 50% pájaro BAJO (saltar)
            let flyH;
            if (Math.random() < 0.5) {
              // ALTO: golpea hitbox parado (GROUND_Y-40 a GROUND_Y-8) pero NO la agachada (GROUND_Y-18 a GROUND_Y-8)
              // Pájaro h=36. Para que golpe parado y NO agachado: bird_bottom entre GROUND_Y-40 y GROUND_Y-18
              // => flyH entre GROUND_Y-76 y GROUND_Y-54
              flyH = GROUND_Y - 70 - Math.random() * 10; // bottom: GROUND_Y-34 a GROUND_Y-24 → obliga agacharse
            } else {
              // BAJO: pegado al suelo, el jugador debe saltar para esquivar
              flyH = GROUND_Y - 42 - Math.random() * 6; // bottom: GROUND_Y-6 a GROUND_Y → obliga saltar
            }
            obstacles.push({
              x: W + 20, y: flyH, w: 52, h: 36,
              type: 'bird', birdFrame: 0
            });
            const cfg2 = DIFFICULTY_CONFIG[difficulty];
            const mf = Math.max(20, cfg2.obstacleMin - speed * 3);
            nextObstacleIn = Math.floor(mf + Math.random() * cfg2.obstacleRand);
            return;
          }
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

          // Calcular el siguiente spawn según la dificultad
          const cfg = DIFFICULTY_CONFIG[difficulty];
          const minFrames = Math.max(25, cfg.obstacleMin - speed * 3);
          const maxFrames = minFrames + cfg.obstacleRand;
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
        const cfg = DIFFICULTY_CONFIG[difficulty];
        const ramp = Math.min(1, frame / cfg.rampFrames);
        const targetSpeed = cfg.baseSpeed + ramp * cfg.maxSpeedAdd;
        speed += (targetSpeed - speed) * 0.02; // suaviza el cambio frame a frame
        if (activeBuffs.slow) {
          speed *= 0.55;
          // Congelar timers mientras slow activo para evitar acumulación de obstáculos
          nextObstacleIn++;
          nextPowerupIn++;
        }

        // score & multiplier (item multiplier × difficulty base multiplier)
        const diffMult = DIFFICULTY_CONFIG[difficulty].diffMult || 1;
        multiplier = activeBuffs.multi6 ? 6 : (activeBuffs.multi4 ? 4 : (activeBuffs.multi ? 2 : 1));
        score += 0.12 * speed * multiplier * diffMult;

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
          case 'shield': activeBuffs.shield = (activeBuffs.shield || 0) + 600; break; // +10s
          case 'multi': activeBuffs.multi = (activeBuffs.multi || 0) + 600; break;
          case 'slow': activeBuffs.slow = (activeBuffs.slow || 0) + 300; break;
          case 'magnet': activeBuffs.magnet = (activeBuffs.magnet || 0) + 480; break;
          case 'doubleJump': activeBuffs.doubleJump = (activeBuffs.doubleJump || 0) + 600; player.jumpsLeft = 2; break;
          case 'coin':
            sessionCoins += DIFFICULTY_CONFIG[difficulty].coinValue;
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
         const allIds = ['shield', 'shield30', 'shield60', 'doubleJump', 'magnet', 'multi', 'multi4', 'multi6'];
         const KEY_CODES = ['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0'];
         const KEY_LABELS = ['1','2','3','4','5','6','7','8','9','0'];
         let keyIdx = 0;
         keySlotMap = {}; // reiniciar el mapa de teclas

         allIds.forEach(id => {
            const el = document.getElementById('inv-' + id);
            if (!el) return;
            const qty = playerInventory[id] || 0;
            if (qty > 0) {
               el.style.display = 'flex';
               el.querySelector('.inv-qty').textContent = 'x' + qty;
               const keyEl = el.querySelector('.inv-key');
               if (keyEl) keyEl.textContent = KEY_LABELS[keyIdx] || '-';
               // Mapear tecla → item
               if (KEY_CODES[keyIdx]) {
                 keySlotMap[KEY_CODES[keyIdx]] = { id, seconds: SLOT_SECONDS[id] || 15 };
               }
               keyIdx++;
            } else {
               el.style.display = 'none';
            }
         });
      }

      async function useItem(type, seconds) {
        if (!playerInventory[type] || playerInventory[type] <= 0) return;
        
        // Consumir
        playerInventory[type]--;
        updateInventoryHud();
        
        // Activar
        let buffKey = type;
        if (type.startsWith('shield')) buffKey = 'shield';
        
        const frames = seconds * 60;
        activeBuffs[buffKey] = (activeBuffs[buffKey] || 0) + frames;
        if (buffKey === 'doubleJump') player.jumpsLeft = 2;
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

        // 1. Suelo base con gradiente profundo
        const grad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
        grad.addColorStop(0, '#5C3A21'); // tierra superior
        grad.addColorStop(1, '#2E1D10'); // tierra profunda
        ctx.fillStyle = grad;
        ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

        // 2. Rocas subterráneas (animadas con parallax suave)
        ctx.fillStyle = '#452A15';
        const rockOffset = -((frame * speed * 0.8) % 300);
        for (let rx = rockOffset - 100; rx < W + 100; rx += 300) {
          ctx.beginPath();
          ctx.arc(rx + 50, GROUND_Y + 35, 18, 0, Math.PI * 2);
          ctx.arc(rx + 150, GROUND_Y + 70, 28, 0, Math.PI * 2);
          ctx.arc(rx + 220, GROUND_Y + 45, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Franja de hierba base (sólida)
        ctx.fillStyle = '#5a8f4f';
        ctx.fillRect(0, GROUND_Y, W, 14);

        // 4. Briznas de hierba procedimentales (animadas por el viento/velocidad)
        const grassOffset = -((frame * speed) % 60);
        
        // Capa trasera (verde oscuro)
        ctx.fillStyle = '#4a752c'; 
        ctx.beginPath();
        for (let x = grassOffset - 60; x < W + 60; x += 15) {
          ctx.moveTo(x, GROUND_Y + 10);
          ctx.lineTo(x + 5, GROUND_Y - 8 + (Math.cos(frame * 0.05 + x) * 3));
          ctx.lineTo(x + 10, GROUND_Y + 10);
        }
        ctx.fill();

        // Capa frontal (verde claro) vibrando con movimiento
        ctx.fillStyle = '#71aa34'; 
        ctx.beginPath();
        for (let x = grassOffset - 60 + 7; x < W + 60; x += 20) {
          ctx.moveTo(x, GROUND_Y + 12);
          // Curvas cuadráticas para dar forma de brizna doblada
          const sway = Math.sin(frame * 0.1 + x) * 5;
          ctx.quadraticCurveTo(x + 5, GROUND_Y - 5, x + 8 + sway, GROUND_Y - 14);
          ctx.quadraticCurveTo(x + 12, GROUND_Y - 2, x + 16, GROUND_Y + 12);
        }
        ctx.fill();
        
        // 5. Detalles de tierra (puntos oscuros bajo el pasto para textura)
        ctx.fillStyle = '#3d2513';
        for (let x = grassOffset - 60; x < W + 60; x += 25) {
          ctx.fillRect(x + 12, GROUND_Y + 16, 4, 3);
          ctx.fillRect(x + 4, GROUND_Y + 22, 6, 2);
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

        if (CAPI_IMG.complete && CAPI_IMG.naturalWidth > 0) {
          const CAPY_FRAMES = [
            [ // Correr
              { x: 45, y: 191, w: 151, h: 129 }, { x: 226, y: 191, w: 156, h: 129 }, { x: 412, y: 187, w: 148, h: 133 }, { x: 596, y: 184, w: 159, h: 136 },
              { x: 784, y: 192, w: 144, h: 128 }, { x: 959, y: 192, w: 153, h: 128 }, { x: 1149, y: 192, w: 146, h: 128 }, { x: 1331, y: 192, w: 145, h: 128 },
            ],
            [ // Saltar
              { x: 45, y: 488, w: 145, h: 124 }, { x: 260, y: 441, w: 154, h: 171 }, { x: 477, y: 428, w: 149, h: 184 }, { x: 666, y: 420, w: 146, h: 192 },
              { x: 854, y: 430, w: 147, h: 182 }, { x: 1050, y: 463, w: 145, h: 149 }, { x: 1262, y: 505, w: 141, h: 107 },
            ],
            [ // Agacharse
              { x: 45, y: 738, w: 145, h: 132 }, { x: 280, y: 769, w: 151, h: 101 }, { x: 510, y: 789, w: 148, h: 80 }, { x: 741, y: 791, w: 165, h: 78 },
              { x: 987, y: 767, w: 151, h: 103 },
            ]
          ];
          
          let row = 0;
          let col = 0;
          
          if (ducking) {
            row = 2;
            // Solo ciclar entre los últimos 3 cuadros (deslizándose) a una velocidad más lenta
            // para evitar que repita la animación de agacharse y parezca que salta.
            col = 2 + Math.floor(frame * 0.1) % 3; 
          } else if (jumping || player.vy !== 0) {
            row = 1;
            if (player.vy < -7) col = 1;
            else if (player.vy < -2) col = 2;
            else if (player.vy < 2) col = 3;
            else if (player.vy < 7) col = 4;
            else col = 5;
          } else {
            row = 0;
            col = Math.floor(frame * speed * 0.055) % 8;
          }
          
          const fData = CAPY_FRAMES[row][col];
          
          const scale = (w * 1.5) / fData.w;
          const drawW = fData.w * scale; 
          const drawH = fData.h * scale; 
          
          const dx = x - (drawW - w) / 2;
          const dy = (by + bodyH) - drawH; 
          
          let drawShield = false;
          let shieldColor = PALETTE.shield;
          
          if (activeBuffs.shield) {
            const shieldFrames = activeBuffs.shield;
            let shieldVisible = true;
            if (shieldFrames <= 60) {
              shieldVisible = Math.floor(frame / 4) % 2 === 0;
            } else if (shieldFrames <= 180) {
              shieldVisible = Math.floor(frame / 15) % 2 === 0;
            }
            if (shieldVisible) {
              drawShield = true;
              shieldColor = shieldFrames <= 180 ? '#ff4444' : PALETTE.shield;
            }
          }

          if (drawShield) {
            const shieldPulse = 10 + Math.sin(frame * 0.2) * 8;
            ctx.shadowColor = shieldColor;
            ctx.shadowBlur = shieldPulse;
            ctx.drawImage(CAPI_IMG, fData.x, fData.y, fData.w, fData.h, dx, dy, drawW, drawH);
            ctx.drawImage(CAPI_IMG, fData.x, fData.y, fData.w, fData.h, dx, dy, drawW, drawH);
            ctx.drawImage(CAPI_IMG, fData.x, fData.y, fData.w, fData.h, dx, dy, drawW, drawH);
            ctx.shadowBlur = 0; 
          }
          
          ctx.drawImage(CAPI_IMG, fData.x, fData.y, fData.w, fData.h, dx, dy, drawW, drawH);
        } else {
          ctx.fillStyle = '#6e4a28';
          ctx.fillRect(x, by, w, bodyH);
        }

        ctx.restore();
      }

      function drawObstacles() {
        for (const o of obstacles) {
          if (o.type === 'bird') {
            // animar pájaro
            o.birdFrame = (o.birdFrame || 0) + 0.18;
            const bSprite = Math.floor(o.birdFrame) % 2 === 0 ? BIRD_F1 : BIRD_F2;
            drawSprite(ctx, bSprite, o.x, o.y, o.w, o.h);
            // sombra tenue debajo del pájaro
            ctx.fillStyle = 'rgba(0,0,0,0.10)';
            ctx.beginPath();
            ctx.ellipse(o.x + o.w/2, GROUND_Y + 4, o.w * 0.4, 5, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (o.type === 'rock') {
            for (let i = 0; i < o.count; i++) {
              drawSprite(ctx, ROCK_SPRITE, o.x + i * o.singleW, o.y, o.singleW, o.h);
            }
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(o.x, o.y + o.h - 6, o.w, 6);
          } else {
            drawSprite(ctx, LOG_SPRITE, o.x, o.y, o.w, o.h);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(o.x, o.y + o.h - 6, o.w, 6);
          }
        }
      }

      function drawPowerups() {
        for (const p of powerups) {
          ctx.save();
          const bob = Math.sin(frame * 0.1 + p.x * 0.05) * 4;
          const img = POWERUP_IMGS[p.type];
          const cx = p.x + p.w / 2;
          const cy = p.y + p.h / 2 + bob;
          const size = p.w; // bounding box size
          const half = size / 2;
          const rx = cx - half; // rect x
          const ry = cy - half; // rect y

          // Color palette per type
          const colors = {
            shield:     { bg: '#1565C0', rim: '#42A5F5', glow: '#90CAF9' },
            doubleJump: { bg: '#2E7D32', rim: '#66BB6A', glow: '#A5D6A7' },
            magnet:     { bg: '#6A1B9A', rim: '#CE93D8', glow: '#E1BEE7' },
            multi:      { bg: '#E65100', rim: '#FFA726', glow: '#FFE0B2' },
            coin:       { bg: '#F57F17', rim: '#FFD54F', glow: '#FFF9C4' },
            slow:       { bg: '#B71C1C', rim: '#EF5350', glow: '#FFCDD2' },
          };
          const col = colors[p.type] || { bg: '#333', rim: '#aaa', glow: '#fff' };

          // --- Glow outer pulse ---
          const pulse = 0.3 + Math.abs(Math.sin(frame * 0.1)) * 0.25;
          ctx.globalAlpha = pulse;
          ctx.fillStyle = col.glow;
          const glowR = half + 8;
          ctx.beginPath();
          roundRect(ctx, cx - glowR, cy - glowR, glowR * 2, glowR * 2, 12);
          ctx.fill();
          ctx.globalAlpha = 1;

          // --- Rounded square background ---
          ctx.fillStyle = col.bg;
          roundRect(ctx, rx, ry, size, size, 10);
          ctx.fill();

          // --- Rim / border ---
          ctx.strokeStyle = col.rim;
          ctx.lineWidth = 3;
          roundRect(ctx, rx, ry, size, size, 10);
          ctx.stroke();

          // --- Icon (PNG or fallback text) ---
          if (p.type === 'slow') {
            // Warning symbol drawn manually
            ctx.font = `${size * 0.52}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠️', cx, cy - 2);
          } else if (img && img.complete && img.naturalWidth !== 0) {
            const s = size * 0.72;
            ctx.drawImage(img, cx - s / 2, cy - s / 2 - 2, s, s);
          } else {
            const fallback = { shield: '🛡', multi: 'x2', magnet: '🧲', doubleJump: '⭐', coin: '●' };
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${size * 0.5}px 'Press Start 2P', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(fallback[p.type] || '?', cx, cy);
          }

          // --- Small label at the bottom of the box ---
          const labels = { shield: 'ESCUDO', doubleJump: 'x2 SALTO', magnet: 'IMÁN', multi: 'x2', coin: 'MONEDA', slow: 'LENTO' };
          const label = labels[p.type] || '';
          if (label) {
            ctx.fillStyle = col.rim;
            ctx.font = `bold 7px 'Press Start 2P', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(label, cx, ry + size - 3);
          }

          ctx.restore();
        }
      }

      // Helper: draw rounded rect path (doesn't stroke/fill itself)
      function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y,     x + w, y + r,     r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x,     y + h, x,     y + h - r, r);
        ctx.lineTo(x,     y + r);
        ctx.arcTo(x,     y,     x + r, y,          r);
        ctx.closePath();
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
        const adminBtn = document.getElementById('adminDashboardBtn');
        if (currentUser) {
          const name = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || 'jugador';
          
          if (name.toLowerCase() === 'capiluisxavi' && adminBtn) {
            adminBtn.style.display = 'inline-block';
          } else if (adminBtn) {
            adminBtn.style.display = 'none';
          }

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
      

      function setDifficulty(d) {
        difficulty = d;
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        const el = document.getElementById('diff-' + d);
        if (el) el.classList.add('active');
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

      // ---------- Tienda dinámica desde DB ----------
      // Estructura esperada en Supabase table "store_config":
      //   id, tab, type, label, description, image, seconds, price, enabled (boolean)
      // Si la tabla no existe aún, la tienda cae en modo estático.
      let storeConfig = null; // null = no cargado

      async function loadStoreFromDB() {
        try {
          const { data, error } = await sb
            .from('store_config')
            .select('*')
            .eq('enabled', true)
            .order('tab')
            .order('price');
          if (error || !data || data.length === 0) return; // usa tienda HTML estática
          storeConfig = data;
          renderDynamicStore();
        } catch(e) { /* tabla no existe aún, se usa tienda estática */ }
      }

      function renderDynamicStore() {
        if (!storeConfig) return;
        const tabsOrder = [...new Set(storeConfig.map(i => i.tab))];

        // Sidebar
        const sidebar = document.querySelector('.store-sidebar');
        if (sidebar) {
          sidebar.innerHTML = tabsOrder.map((tab, idx) =>
            `<button id="tabBtn-${tab}" class="store-tab${idx===0?' active':''}" onclick="showStoreTab('${tab}')">${tab}</button>`
          ).join('');
        }

        // Content area
        const area = document.querySelector('.store-content-area');
        if (!area) return;
        area.innerHTML = tabsOrder.map((tab, idx) => {
          const items = storeConfig.filter(i => i.tab === tab);
          const first = items[0];
          return `
            <div id="tab-${tab}" class="store-tab-content${idx===0?' active':''}">
              <div style="text-align:center; margin-bottom:20px;">
                <img src="${first.image || 'assets/coin.png'}" style="width:80px; image-rendering:pixelated; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
                <div style="color:var(--gold); margin-top:10px; font-size:14px; font-weight:bold;">${tab.toUpperCase()}</div>
                <div style="font-size:10px; color:#ccc; margin-top:5px;">${first.description || ''}</div>
              </div>
              ${items.map(item => `
                <div class="store-item">
                  <span>${item.label}</span>
                  <button onclick="buyBuff('${item.type}', ${item.price}, ${item.seconds})">${item.price}</button>
                </div>
              `).join('')}
            </div>`;
        }).join('');
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
      loadStoreFromDB();

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

      // ---------- Tienda dinámica desde DB ----------
      // Estructura esperada en Supabase table "store_config":
      //   id, tab, type, label, description, image, seconds, price, enabled (boolean)
      // Si la tabla no existe aún, la tienda cae en modo estático.
      let storeConfig = null; // null = no cargado

      async function loadStoreFromDB() {
        try {
          const { data, error } = await sb
            .from('store_config')
            .select('*')
            .eq('enabled', true)
            .order('tab')
            .order('price');
          if (error || !data || data.length === 0) return; // usa tienda HTML estática
          storeConfig = data;
          renderDynamicStore();
        } catch(e) { /* tabla no existe aún, se usa tienda estática */ }
      }

      function renderDynamicStore() {
        if (!storeConfig) return;
        const tabsOrder = [...new Set(storeConfig.map(i => i.tab))];

        // Sidebar
        const sidebar = document.querySelector('.store-sidebar');
        if (sidebar) {
          sidebar.innerHTML = tabsOrder.map((tab, idx) =>
            `<button id="tabBtn-${tab}" class="store-tab${idx===0?' active':''}" onclick="showStoreTab('${tab}')">${tab}</button>`
          ).join('');
        }

        // Content area
        const area = document.querySelector('.store-content-area');
        if (!area) return;
        area.innerHTML = tabsOrder.map((tab, idx) => {
          const items = storeConfig.filter(i => i.tab === tab);
          const first = items[0];
          return `
            <div id="tab-${tab}" class="store-tab-content${idx===0?' active':''}">
              <div style="text-align:center; margin-bottom:20px;">
                <img src="${first.image || 'assets/coin.png'}" style="width:80px; image-rendering:pixelated; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
                <div style="color:var(--gold); margin-top:10px; font-size:14px; font-weight:bold;">${tab.toUpperCase()}</div>
                <div style="font-size:10px; color:#ccc; margin-top:5px;">${first.description || ''}</div>
              </div>
              ${items.map(item => `
                <div class="store-item">
                  <span>${item.label}</span>
                  <button onclick="buyBuff('${item.type}', ${item.price}, ${item.seconds})">${item.price}</button>
                </div>
              `).join('')}
            </div>`;
        }).join('');
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
      loadStoreFromDB();

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

      // ---------- Twitch Live Check ----------
      async function checkTwitchLive() {
        try {
          const res = await fetch('https://decapi.me/twitch/uptime/yocapi_pr');
          const text = await res.text();
          const btn = document.getElementById('twitchLiveBtn');
          if (btn) {
            if (text.toLowerCase().includes('offline')) {
              btn.classList.remove('is-live');
              btn.style.display = 'flex'; 
            } else {
              btn.classList.add('is-live');
              btn.style.display = 'flex';
            }
          }
        } catch (e) {
          console.error('Twitch check failed', e);
        }
      }

      checkTwitchLive();
      setInterval(checkTwitchLive, 5 * 60 * 1000);

      /* ============================================================
         SISTEMA DE SESIÓN DIARIA (Recompensas Semanales)
         Reset a las 12:00 AM hora Ciudad de México (UTC-6)
         ============================================================ */

      // Definición de recompensas por día (1-7) — usa PNGs de assets/
      const DAILY_REWARDS = [
        { day: 1, img: 'assets/coin.png',    label: '500 Monedas',         type: 'coins',      amount: 500 },
        { day: 2, img: 'assets/jump.png',    label: '2 Doble Salto',       type: 'doubleJump', amount: 2   },
        { day: 3, img: 'assets/iman.png',    label: '2 Imán',              type: 'magnet',     amount: 2   },
        { day: 4, img: 'assets/coin.png',    label: '500 Monedas',         type: 'coins',      amount: 500 },
        { day: 5, img: 'assets/inmortal.png',label: 'Escudo 30s',          type: 'shield30',   amount: 1   },
        { day: 6, img: 'assets/inmortal.png',label: 'Escudo 1 Min',        type: 'shield60',   amount: 1   },
        { day: 7, img: 'assets/x6.png',      label: '3 Mult. x6',          type: 'multi6',     amount: 3   },
      ];

      // Obtener la fecha actual en la zona horaria de México (UTC-6)
      function getMexicoDate() {
        const now = new Date();
        const mxStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
        return mxStr;
      }

      function getMexicoMidnight() {
        const now = new Date();
        const todayMx = getMexicoDate();
        const [y, m, d] = todayMx.split('-').map(Number);
        const utcNow = now.getTime();
        const mxNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        const tzOffset = Math.round((utcNow - mxNow.getTime()) / 60000);
        const tomorrowMx = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
        const midnight = new Date(tomorrowMx.getTime() + tzOffset * 60000);
        return midnight;
      }

      let dailyState = {
        weekStart: '',
        daysClaimed: [],
        lastClaimedDate: ''
      };

      function getMondayOfWeek(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const dow = dt.getDay();
        const diff = (dow === 0) ? -6 : 1 - dow;
        const monday = new Date(y, m - 1, d + diff);
        return monday.toLocaleDateString('en-CA');
      }

      function getDayOfWeek(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const dow = dt.getDay();
        return dow === 0 ? 7 : dow;
      }

      async function loadDailyState() {
        const todayMx = getMexicoDate();
        const thisMonday = getMondayOfWeek(todayMx);

        if (currentUser) {
          try {
            const { data, error } = await sb
              .from('daily_rewards')
              .select('week_start, days_claimed, last_claimed_date')
              .eq('twitch_user_id', currentUser.id)
              .single();

            if (!error && data) {
              if (data.week_start === thisMonday) {
                dailyState = {
                  weekStart: data.week_start,
                  daysClaimed: data.days_claimed || [],
                  lastClaimedDate: data.last_claimed_date || ''
                };
              } else {
                dailyState = { weekStart: thisMonday, daysClaimed: [], lastClaimedDate: '' };
                await saveDailyState();
              }
              renderDailyModal();
              updateDailyBadge();
              return;
            }
          } catch(e) {}
        }

        const stored = localStorage.getItem('dailyReward_v1');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            dailyState = parsed.weekStart === thisMonday ? parsed : { weekStart: thisMonday, daysClaimed: [], lastClaimedDate: '' };
          } catch(e) {
            dailyState = { weekStart: thisMonday, daysClaimed: [], lastClaimedDate: '' };
          }
        } else {
          dailyState = { weekStart: thisMonday, daysClaimed: [], lastClaimedDate: '' };
        }

        renderDailyModal();
        updateDailyBadge();
      }

      async function saveDailyState() {
        localStorage.setItem('dailyReward_v1', JSON.stringify(dailyState));

        if (!currentUser) return;
        try {
          const uid = currentUser.id;
          const username = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || 'jugador';
          const payload = {
            twitch_user_id: uid,
            twitch_username: username,
            week_start: dailyState.weekStart,
            days_claimed: dailyState.daysClaimed,
            last_claimed_date: dailyState.lastClaimedDate,
            updated_at: new Date().toISOString()
          };
          await sb.from('daily_rewards').upsert(payload, { onConflict: 'twitch_user_id' });
        } catch(e) {}
      }

      // Badge de notificación (!) cuando hay recompensa disponible
      function updateDailyBadge() {
        const badge = document.getElementById('dailyRewardBadge');
        if (!badge) return;
        const todayMx = getMexicoDate();
        const alreadyClaimedToday = dailyState.lastClaimedDate === todayMx;
        const canClaim = !alreadyClaimedToday && dailyState.daysClaimed.length < 7;
        badge.style.display = canClaim ? 'flex' : 'none';
      }

      // Abrir el modal de recompensa diaria
      function openDailyReward() {
        renderDailyModal();
        openModal('dailyRewardModal');
      }

      // Renderizar el modal con el estado actual
      function renderDailyModal() {
        const todayMx = getMexicoDate();
        const alreadyClaimedToday = dailyState.lastClaimedDate === todayMx;
        const totalClaimed = dailyState.daysClaimed.length;
        const nextDayIdx = totalClaimed;
        const nextDayNum = nextDayIdx + 1;

        const loginReq = document.getElementById('dailyLoginRequired');
        const content  = document.getElementById('dailyRewardContent');

        if (!currentUser) {
          if (loginReq) loginReq.style.display = 'block';
          if (content)  content.style.display  = 'none';
          return;
        }
        if (loginReq) loginReq.style.display = 'none';
        if (content)  content.style.display  = 'block';

        const streakEl = document.getElementById('dailyStreakText');
        if (streakEl) {
          streakEl.textContent = totalClaimed === 0
            ? '¡Comienza tu racha semanal!'
            : `Racha: ${totalClaimed}/7 días esta semana 🔥`;
        }

        const grid = document.getElementById('dailyDaysGrid');
        if (grid) {
          grid.innerHTML = DAILY_REWARDS.map((r, idx) => {
            const dayNum = idx + 1;
            let cardClass = 'locked';
            if (dailyState.daysClaimed.includes(dayNum)) {
              cardClass = 'claimed';
            } else if (dayNum === nextDayNum && !alreadyClaimedToday && totalClaimed < 7) {
              cardClass = 'available';
            }
            return `
              <div class="daily-day-card ${cardClass}" id="dayCard${dayNum}">
                <span class="daily-day-num">DÍA ${dayNum}</span>
                <img src="${r.img}" class="daily-day-img" alt="${r.label}">
                <span class="daily-day-reward">${r.label}</span>
              </div>`;
          }).join('');
        }

        const claimBtn = document.getElementById('claimDailyBtn');
        const nextInfo  = document.getElementById('dailyNextInfo');

        if (totalClaimed >= 7) {
          if (claimBtn) claimBtn.style.display = 'none';
          if (nextInfo) {
            nextInfo.style.display = 'block';
            nextInfo.innerHTML = '🎉 <b>¡Completaste la semana!</b> Las recompensas se reinician el próximo lunes.';
          }
        } else if (alreadyClaimedToday) {
          if (claimBtn) claimBtn.style.display = 'none';
          if (nextInfo) {
            nextInfo.style.display = 'block';
            const midnight = getMexicoMidnight();
            const diff = midnight - new Date();
            const hh = Math.floor(diff / 3600000);
            const mm = Math.floor((diff % 3600000) / 60000);
            nextInfo.innerHTML = `⏰ Próxima recompensa en <b>${hh}h ${mm}m</b> (medianoche CDMX)`;
          }
        } else {
          if (claimBtn) {
            claimBtn.style.display = 'block';
            claimBtn.textContent = `✨ RECLAMAR DÍA ${nextDayNum}`;
          }
          if (nextInfo) nextInfo.style.display = 'none';
        }
      }

      // Reclamar la recompensa del día
      async function claimDailyReward() {
        if (!currentUser) {
          alert('Debes iniciar sesión con Twitch para reclamar tu recompensa diaria.');
          return;
        }
        const todayMx = getMexicoDate();
        if (dailyState.lastClaimedDate === todayMx) {
          alert('Ya reclamaste tu recompensa de hoy. ¡Vuelve mañana!');
          return;
        }
        if (dailyState.daysClaimed.length >= 7) {
          alert('¡Ya completaste la semana! Las recompensas se reinician el próximo lunes.');
          return;
        }

        const nextDayIdx = dailyState.daysClaimed.length;
        const reward = DAILY_REWARDS[nextDayIdx];
        if (!reward) return;

        dailyState.daysClaimed.push(reward.day);
        dailyState.lastClaimedDate = todayMx;

        if (reward.type === 'coins') {
          await syncWallet(reward.amount);
          showRewardToast(`🪙 +${reward.amount} monedas`);
        } else {
          playerInventory[reward.type] = (playerInventory[reward.type] || 0) + reward.amount;
          updateInventoryHud();
          await syncWallet(0, true);
          showRewardToast(`+${reward.amount} ${reward.label}`);
        }

        await saveDailyState();
        renderDailyModal();
        updateDailyBadge();

        const card = document.getElementById('dayCard' + reward.day);
        if (card) {
          card.classList.remove('available');
          card.classList.add('claimed', 'reward-anim');
        }
      }

      // Toast de recompensa flotante
      function showRewardToast(msg) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = `
          position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: #fff; font-family: 'Press Start 2P', monospace; font-size: 12px;
          padding: 14px 24px; border-radius: 12px; z-index: 9999;
          box-shadow: 0 0 30px rgba(168,85,247,0.8); border: 2px solid #e9d5ff;
          animation: rewardPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
          text-shadow: 1px 1px 0 #000; white-space: nowrap;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.transition = 'opacity 0.5s';
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 500);
        }, 2800);
      }

      // Inicializar en cambio de sesión (solo para daily)
      sb.auth.onAuthStateChange((_evt, session) => {
        if (session?.user) {
          setTimeout(loadDailyState, 300);
        } else {
          updateDailyBadge();
        }
      });

      // Cargar al inicio
      if (document.readyState !== 'loading') {
        setTimeout(loadDailyState, 500);
      } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(loadDailyState, 500));
      }
