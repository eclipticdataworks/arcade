/**
 * Shiba Pac-Man Arcade Engine
 * Manages game loop, state machine, collisions, scoring, and UI
 */

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Tile size: 20px -> 560px width x 620px height
    this.tileSize = 20;
    this.maze = new Maze(this.tileSize);
    this.player = new ShibaPlayer(this.maze);

    // 4 Squirrels
    this.squirrels = [
      new Squirrel('nutty', this.maze),
      new Squirrel('chippy', this.maze),
      new Squirrel('squeaky', this.maze),
      new Squirrel('rusty', this.maze)
    ];

    // High Score persistence
    this.highScore = 0;
    try {
      const saved = localStorage.getItem('shiba_pacman_highscore');
      if (saved) this.highScore = parseInt(saved, 10) || 0;
    } catch (e) {
      this.highScore = 0;
    }
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.extraLifeAwarded = false;

    // Ghost combo multiplier
    this.squirrelsEatenCount = 0;

    // Global Mode Cycles: Scatter / Chase
    // Classic Pac-Man mode times (in seconds)
    this.modeSchedule = [
      { mode: 'SCATTER', time: 7 },
      { mode: 'CHASE', time: 20 },
      { mode: 'SCATTER', time: 7 },
      { mode: 'CHASE', time: 20 },
      { mode: 'SCATTER', time: 5 },
      { mode: 'CHASE', time: 20 },
      { mode: 'SCATTER', time: 5 },
      { mode: 'CHASE', time: Infinity }
    ];
    this.modeIndex = 0;
    this.modeTimer = 0;
    this.globalState = 'SCATTER';

    // Game States: 'TITLE', 'READY', 'PLAYING', 'PAUSED', 'DYING', 'LEVEL_CLEAR', 'GAME_OVER'
    this.state = 'TITLE';
    this.stateTimer = 0;

    // Visual Popups & Crumbs
    this.popups = [];
    this.particles = [];

    // Frame timing
    this.lastTime = 0;
    this.animFrame = 0;
    this.accumulator = 0;
    this.fixedStep = 1 / 60;
    this.flashMazeTimer = 0;


    // Fruit spawn trigger thresholds
    this.fruitSpawnedCount = 0;

    this.init();
  }

  init() {
    this.canvas.width = this.maze.width;
    this.canvas.height = this.maze.height;
    this.updateHUD();
  }

  startNewGame() {
    this.saveHighScore();
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.extraLifeAwarded = false;
    this.maze.reset();
    this.fruitSpawnedCount = 0;
    this.updateHUD();
    this.startLevel();
  }

  startLevel() {
    this.player.reset();
    this.resetSquirrels();
    this.modeIndex = 0;
    this.modeTimer = 0;
    this.globalState = 'SCATTER';
    this.squirrelsEatenCount = 0;

    this.state = 'READY';
    this.stateTimer = 2.4; // 2.4s "READY!" countdown
    if (window.soundEngine) {
      window.soundEngine.playStartFanfare();
    }
  }

  resetPositionsAfterDeath() {
    this.player.reset();
    this.resetSquirrels();
    this.squirrelsEatenCount = 0;
    this.modeIndex = 0;
    this.modeTimer = 0;
    this.globalState = 'SCATTER';

    this.state = 'READY';
    this.stateTimer = 1.8;
  }

  resetSquirrels() {
    for (const sq of this.squirrels) {
      sq.reset();
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  toggleTheme() {
    this.maze.theme = this.maze.theme === 'neon' ? 'park' : 'neon';
  }

  update(dt) {
    this.animFrame++;

    // Update floating popups (+200, +400, etc.)
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.y -= 25 * dt;
      pop.life -= dt;
      if (pop.life <= 0) this.popups.splice(i, 1);
    }

    // Update particle crumbs
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 2.5;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    switch (this.state) {
      case 'TITLE':
        // Idle animation on title screen
        break;

      case 'READY':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'PLAYING';
        }
        break;

      case 'PLAYING':
        this.updatePlaying(dt);
        break;

      case 'DYING':
        this.player.update(dt);
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.lives--;
          this.updateHUD();
          if (this.lives <= 0) {
            this.state = 'GAME_OVER';
            this.saveHighScore();
          } else {
            this.resetPositionsAfterDeath();
          }
        }
        break;

      case 'LEVEL_CLEAR':
        this.flashMazeTimer += dt;
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.level++;
          this.maze.reset();
          this.fruitSpawnedCount = 0;
          this.updateHUD();
          this.startLevel();
        }
        break;

      case 'GAME_OVER':
      case 'PAUSED':
        // Idle
        break;
    }
  }

  updatePlaying(dt) {
    // 1. Update Global Chase / Scatter Mode Cycle
    const currentSchedule = this.modeSchedule[this.modeIndex];
    if (currentSchedule && currentSchedule.time !== Infinity) {
      this.modeTimer += dt;
      if (this.modeTimer >= currentSchedule.time) {
        this.modeTimer = 0;
        this.modeIndex = Math.min(this.modeIndex + 1, this.modeSchedule.length - 1);
        this.globalState = this.modeSchedule[this.modeIndex].mode;
        // Squirrels reverse direction on scatter/chase transition
        for (const sq of this.squirrels) {
          if (sq.state !== 'FRIGHTENED' && sq.state !== 'EATEN' && sq.state !== 'SPAWNING') {
            sq.dir = { x: -sq.dir.x, y: -sq.dir.y };
          }
        }
      }
    }

    // 2. Update Shiba Player
    this.player.update(dt);

    // 3. Dot / Treat Eating Check
    const ts = this.tileSize;
    const playerC = Math.floor(this.player.x / ts);
    const playerR = Math.floor(this.player.y / ts);

    const eatenType = this.maze.eatDot(playerC, playerR);
    if (eatenType) {
      if (eatenType === 'dot') {
        this.addScore(10);
        if (window.soundEngine) window.soundEngine.playChomp();
        this.spawnCrumbs(this.player.x, this.player.y, '#FDE047', 4);
      } else if (eatenType === 'energizer') {
        this.addScore(50);
        if (window.soundEngine) window.soundEngine.playPowerPellet();
        this.player.activateZoomies(8);
        this.squirrelsEatenCount = 0;

        // Frighten all non-eaten squirrels
        for (const sq of this.squirrels) {
          sq.makeFrightened(8);
        }
        this.spawnCrumbs(this.player.x, this.player.y, '#F59E0B', 12);
        this.addPopup('ZOOMIES!', this.player.x, this.player.y - 15, '#FBBF24');
      }

      // Check Fruit Spawn (Spawns at 70 and 170 remaining dots)
      const eatenCount = this.maze.totalDots - this.maze.remainingDots;
      if ((eatenCount === 70 || eatenCount === 170) && !this.maze.fruit) {
        this.maze.spawnFruit(this.level);
      }

      // Check Level Clear
      if (this.maze.remainingDots <= 0) {
        this.state = 'LEVEL_CLEAR';
        this.stateTimer = 2.2;
        this.flashMazeTimer = 0;

        return;
      }
    }

    // 4. Fruit Pickup Check
    if (this.maze.fruit) {
      const fruitX = this.maze.fruit.col * ts;
      const fruitY = this.maze.fruit.row * ts + ts / 2;
      const distToFruit = Math.hypot(this.player.x - fruitX, this.player.y - fruitY);
      if (distToFruit < this.player.radius + 8) {
        const pts = this.maze.fruit.score;
        this.addScore(pts);
        if (window.soundEngine) window.soundEngine.playEatFruit();
        this.addPopup(`+${pts}`, fruitX, fruitY - 10, '#34D399');
        this.maze.fruit = null;
      } else {
        this.maze.updateFruit(dt);
      }
    }

    // 5. Update Squirrels
    const nutty = this.squirrels.find(s => s.type === 'nutty');
    for (const sq of this.squirrels) {
      sq.update(dt, this.player, nutty, this.globalState);

      // Collision Check with Shiba
      const dist = Math.hypot(this.player.x - sq.x, this.player.y - sq.y);
      if (dist < this.player.radius + sq.radius - 4) {
        if (sq.state === 'FRIGHTENED') {
          // Shiba catches squirrel!
          sq.getEaten();
          this.squirrelsEatenCount++;
          const pts = Math.min(1600, 200 * Math.pow(2, this.squirrelsEatenCount - 1));
          this.addScore(pts);
          if (window.soundEngine) window.soundEngine.playEatSquirrel();
          this.addPopup(`+${pts}`, sq.x, sq.y - 12, '#38BDF8');
          this.spawnCrumbs(sq.x, sq.y, sq.color, 16);
        } else if (sq.state === 'CHASE' || sq.state === 'SCATTER') {
          // Squirrel caught Shiba!
          this.player.startDeath();
          this.state = 'DYING';
          this.stateTimer = 1.6;
          if (window.soundEngine) window.soundEngine.playDeath();
          return;
        }
      }
    }
  }

  addScore(pts) {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    // Extra life at 10,000 points
    if (!this.extraLifeAwarded && this.score >= 10000) {
      this.lives++;
      this.extraLifeAwarded = true;
      if (window.soundEngine) window.soundEngine.playExtraLife();
      this.addPopup('1UP EXTRA LIFE!', this.maze.width / 2, this.maze.height / 2, '#4ADE80');
    }
    this.updateHUD();
  }

  saveHighScore() {
    try {
      localStorage.setItem('shiba_pacman_highscore', this.highScore.toString());
    } catch (e) {
      // storage unavailable
    }
  }

  addPopup(text, x, y, color = '#FFFFFF') {
    this.popups.push({ text, x, y, color, life: 1.1 });
  }

  spawnCrumbs(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 2.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        color,
        size: 1.5 + Math.random() * 2
      });
    }
  }

  updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const highEl = document.getElementById('hud-highscore');
    const levelEl = document.getElementById('hud-level');
    const livesEl = document.getElementById('hud-lives');

    if (scoreEl) scoreEl.textContent = this.score.toString().padStart(5, '0');
    if (highEl) highEl.textContent = this.highScore.toString().padStart(5, '0');
    if (levelEl) levelEl.textContent = this.level.toString();

    // Render lives as mini Shiba faces
    if (livesEl) {
      livesEl.innerHTML = '';
      for (let i = 0; i < Math.max(0, this.lives - 1); i++) {
        const img = document.createElement('span');
        img.className = 'inline-block text-lg transform hover:scale-110 transition-transform';
        img.title = 'Shiba Life';
        img.textContent = '🐕';
        livesEl.appendChild(img);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Flash maze on level clear
    if (this.state === 'LEVEL_CLEAR' && Math.floor(this.flashMazeTimer * 8) % 2 === 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Draw maze and dots
      this.maze.draw(ctx, this.animFrame);
    }

    // Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Squirrels (Draw first so Shiba appears on top when chasing)
    for (const sq of this.squirrels) {
      sq.draw(ctx);
    }

    // Draw Shiba Player
    this.player.draw(ctx);

    // Draw Floating Text Popups
    for (const pop of this.popups) {
      ctx.save();
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = pop.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.max(0, Math.min(1, pop.life * 1.5));
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }

    // Draw Overlay Messages for game states
    this.drawStateOverlays(ctx);
  }

  drawStateOverlays(ctx) {
    const cx = this.canvas.width / 2;
    const cy = 17 * this.tileSize;

    if (this.state === 'READY') {
      ctx.save();
      ctx.font = 'bold 18px "Press Start 2P", monospace, sans-serif';
      ctx.fillStyle = '#FBBF24'; // Yellow
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText('READY!', cx, cy + 6);
      ctx.restore();
    } else if (this.state === 'PAUSED') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.font = 'bold 20px "Press Start 2P", monospace, sans-serif';
      ctx.fillStyle = '#60A5FA';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', cx, cy - 20);

      ctx.font = '12px monospace';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText('Press SPACE or P to Resume', cx, cy + 15);
      ctx.restore();
    } else if (this.state === 'GAME_OVER') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.font = 'bold 22px "Press Start 2P", monospace, sans-serif';
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = '#B91C1C';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', cx, cy - 30);

      ctx.font = '14px monospace';
      ctx.fillStyle = '#FDE047';
      ctx.fillText(`Final Score: ${this.score}`, cx, cy + 5);

      ctx.font = '12px monospace';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText('Press SPACE or Click START to Play Again', cx, cy + 40);
      ctx.restore();
    } else if (this.state === 'TITLE') {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Title Banner
      ctx.font = 'bold 22px "Press Start 2P", monospace, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText('SHIBA PAC-MAN', cx, 8 * this.tileSize);

      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillStyle = '#FBBF24';
      ctx.fillText('YUKI VS THE SQUIRRELS', cx, 10 * this.tileSize);

      // Legend of Squirrels
      const legend = [
        { name: 'NUTTY', role: 'CHASER', color: '#E63946', icon: '🐿️' },
        { name: 'CHIPPY', role: 'AMBUSHER', color: '#FF6B8B', icon: '🐿️' },
        { name: 'SQUEAKY', role: 'FLANKER', color: '#00B4D8', icon: '🐿️' },
        { name: 'RUSTY', role: 'SHY WANDERER', color: '#F77F00', icon: '🐿️' }
      ];

      legend.forEach((item, idx) => {
        const ly = (13 + idx * 2.2) * this.tileSize;
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = item.color;
        ctx.textAlign = 'left';
        ctx.fillText(`${item.icon} ${item.name}`, cx - 110, ly);

        ctx.fillStyle = '#94A3B8';
        ctx.textAlign = 'right';
        ctx.fillText(`- ${item.role}`, cx + 110, ly);
      });

      // Flashing start prompt
      if (Math.floor(this.animFrame / 30) % 2 === 0) {
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.fillStyle = '#34D399';
        ctx.shadowColor = '#059669';
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.fillText('PRESS SPACE TO START', cx, 24 * this.tileSize);
      }
      ctx.restore();
    }
  }

  loop(currentTime = 0) {
    if (!this.lastTime) this.lastTime = currentTime;
    const elapsed = Math.min((currentTime - this.lastTime) / 1000, 0.1); // clamp delta
    this.lastTime = currentTime;

    this.accumulator += elapsed;
    while (this.accumulator >= this.fixedStep) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.Game = Game;
