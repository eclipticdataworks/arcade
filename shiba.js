/**
 * White Shiba Inu ("Yuki") Player Character
 * Features authentic arcade corner-buffering, smooth grid-snapping,
 * procedural kawaii animations, and "Zoomies Mode"!
 */

class ShibaPlayer {
  constructor(maze) {
    this.maze = maze;
    this.tileSize = maze.tileSize;
    this.radius = this.tileSize * 0.72; // Doge sprite radius

    // Spawn point (Iconic Pac-Man start: Row 23, Col 13.5)
    this.spawnX = 13.5 * this.tileSize;
    this.spawnY = 23 * this.tileSize + this.tileSize / 2;

    this.x = this.spawnX;
    this.y = this.spawnY;

    this.dir = { x: -1, y: 0 }; // Initial moving direction (facing left)
    this.nextDir = { x: -1, y: 0 }; // Buffered input direction

    this.baseSpeed = 2.15; // pixels per frame at 60fps
    this.zoomiesSpeed = 2.50; // faster in zoomies mode
    this.speed = this.baseSpeed;

    this.isZoomies = false;
    this.zoomiesTimer = 0;
    this.zoomiesDuration = 8; // seconds

    this.isDying = false;
    this.deathTimer = 0;
    this.deathDuration = 1.6; // seconds

    this.animFrame = 0;
    this.particles = []; // Sparkles / Zoomies trail
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.dir = { x: -1, y: 0 };
    this.nextDir = { x: -1, y: 0 };
    this.isZoomies = false;
    this.zoomiesTimer = 0;
    this.isDying = false;
    this.deathTimer = 0;
    this.particles = [];
  }

  setDirection(dx, dy) {
    // Reverse immediately if moving in opposite direction
    if (dx === -this.dir.x && dy === -this.dir.y) {
      this.dir = { x: dx, y: dy };
      this.nextDir = { x: dx, y: dy };
      return;
    }
    // Otherwise buffer direction to turn at next opening
    this.nextDir = { x: dx, y: dy };
  }

  activateZoomies(duration = 8) {
    this.isZoomies = true;
    this.zoomiesTimer = duration;
    this.speed = this.zoomiesSpeed;
    // Golden burst
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * (1.5 + Math.random() * 2),
        vy: Math.sin(angle) * (1.5 + Math.random() * 2),
        life: 1.0,
        color: i % 2 === 0 ? '#FBBF24' : '#F472B6',
        size: 2.5 + Math.random() * 2
      });
    }
  }

  startDeath() {
    this.isDying = true;
    this.deathTimer = this.deathDuration;
  }

  update(dt) {
    // Update zoomies timer
    if (this.isZoomies) {
      this.zoomiesTimer -= dt;
      if (this.zoomiesTimer <= 0) {
        this.isZoomies = false;
        this.speed = this.baseSpeed;
      }

      // Spawn zoomies sparkle particles
      if (Math.random() < 0.4) {
        this.particles.push({
          x: this.x + (Math.random() - 0.5) * 12,
          y: this.y + (Math.random() - 0.5) * 12,
          vx: -this.dir.x * (0.8 + Math.random() * 1.2),
          vy: -this.dir.y * (0.8 + Math.random() * 1.2) + (Math.random() - 0.5) * 0.5,
          life: 0.6,
          color: Math.random() > 0.5 ? '#FBBF24' : '#60A5FA',
          size: 2 + Math.random() * 2
        });
      }
    }

    // Update death animation
    if (this.isDying) {
      this.deathTimer -= dt;
      return;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 2.0;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    this.animFrame++;

    // Grid coordinates
    const ts = this.tileSize;
    const currentCol = Math.floor(this.x / ts);
    const currentRow = Math.floor(this.y / ts);
    const centerTileX = currentCol * ts + ts / 2;
    const centerTileY = currentRow * ts + ts / 2;

    const distToCenterX = Math.abs(this.x - centerTileX);
    const distToCenterY = Math.abs(this.y - centerTileY);

    // Turn buffer window (corner tolerance)
    const cornerTolerance = 4.0;

    // Check if we can execute buffered nextDir
    if (this.nextDir.x !== this.dir.x || this.nextDir.y !== this.dir.y) {
      // If turning perpendicular
      if (this.nextDir.x !== 0 && this.dir.y !== 0) {
        // Turning horizontally while moving vertically
        if (distToCenterY <= cornerTolerance) {
          const targetCol = currentCol + this.nextDir.x;
          if (!this.maze.isWall(targetCol, currentRow)) {
            this.y = centerTileY; // snap to corridor
            this.dir = { ...this.nextDir };
          }
        }
      } else if (this.nextDir.y !== 0 && this.dir.x !== 0) {
        // Turning vertically while moving horizontally
        if (distToCenterX <= cornerTolerance) {
          const targetRow = currentRow + this.nextDir.y;
          if (!this.maze.isWall(currentCol, targetRow) && !this.maze.isHouseDoor(currentCol, targetRow)) {
            this.x = centerTileX; // snap to corridor
            this.dir = { ...this.nextDir };
          }
        }
      }
    }

    // Movement collision check
    let canMove = true;
    if (this.dir.x > 0) {
      // Moving right
      const checkCol = Math.floor((this.x + this.radius + this.speed) / ts);
      if (this.maze.isWall(checkCol, currentRow)) {
        this.x = centerTileX;
        canMove = false;
      }
    } else if (this.dir.x < 0) {
      // Moving left
      const checkCol = Math.floor((this.x - this.radius - this.speed) / ts);
      if (this.maze.isWall(checkCol, currentRow)) {
        this.x = centerTileX;
        canMove = false;
      }
    } else if (this.dir.y > 0) {
      // Moving down
      const checkRow = Math.floor((this.y + this.radius + this.speed) / ts);
      if (this.maze.isWall(currentCol, checkRow) || this.maze.isHouseDoor(currentCol, checkRow)) {
        this.y = centerTileY;
        canMove = false;
      }
    } else if (this.dir.y < 0) {
      // Moving up
      const checkRow = Math.floor((this.y - this.radius - this.speed) / ts);
      if (this.maze.isWall(currentCol, checkRow) || this.maze.isHouseDoor(currentCol, checkRow)) {
        this.y = centerTileY;
        canMove = false;
      }
    }

    if (canMove) {
      this.x += this.dir.x * this.speed;
      this.y += this.dir.y * this.speed;
    }

    // Wrap around side tunnels (Row 14)
    if (currentRow === 14) {
      if (this.x < -ts * 0.5) {
        this.x = this.maze.width + ts * 0.4;
      } else if (this.x > this.maze.width + ts * 0.5) {
        this.x = -ts * 0.4;
      }
    }
  }

  draw(ctx) {
    // Draw particles behind Shiba
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Death animation: spin and vanish
    if (this.isDying) {
      const progress = 1 - (this.deathTimer / this.deathDuration);
      ctx.rotate(progress * Math.PI * 8);
      const scale = Math.max(0.01, 1 - progress);
      ctx.scale(scale, scale);
      this.renderShibaBody(ctx, true);
      ctx.restore();
      return;
    }

    // Zoomies aura
    if (this.isZoomies) {
      const auraPulse = Math.sin(this.animFrame * 0.3) * 3 + 18;
      const gradient = ctx.createRadialGradient(0, 0, 8, 0, 0, auraPulse);
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, auraPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    this.renderShibaBody(ctx, false);
    ctx.restore();
  }

  renderShibaBody(ctx, isDizzy) {
    const isMovingHoriz = this.dir.x !== 0;
    const isMovingUp = this.dir.y < 0;
    const isMovingDown = this.dir.y > 0;
    const flipX = this.dir.x < 0;

    if (flipX) ctx.scale(-1, 1);

    const chompCycle = Math.abs(Math.sin(this.animFrame * 0.25));
    const trotCycle = Math.sin(this.animFrame * 0.4);
    const wag = Math.sin(this.animFrame * 0.35) * 0.25;

    // Tail (White curled Shiba doughnut tail)
    ctx.save();
    ctx.translate(-7, 2);
    ctx.rotate(wag - 0.4);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 1.8);
    ctx.stroke();
    ctx.fill();
    ctx.restore();

    // Red Collar / Superhero Bandana
    ctx.save();
    if (this.isZoomies) {
      // Fluttering superhero cape
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(-4, -1);
      ctx.quadraticCurveTo(-12, -4 + trotCycle * 3, -15, trotCycle * 4);
      ctx.quadraticCurveTo(-10, 4 + trotCycle * 2, -2, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Feet scampering (trot animation)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-4 + trotCycle * 2, 8, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(3 - trotCycle * 2, 8, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main Body & Head (Plump white rounded Shiba)
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Soft Cream shading on cheeks
    ctx.fillStyle = '#F5F2EB';
    ctx.beginPath();
    ctx.arc(0, 3, 7, 0, Math.PI);
    ctx.fill();

    // Ears (Pointed Shiba ears)
    // Left ear
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-7, -4);
    ctx.lineTo(-6, -12);
    ctx.lineTo(-1, -7);
    ctx.closePath();
    ctx.fill();

    // Left inner ear (pink)
    ctx.fillStyle = '#FFB8C6';
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.lineTo(-5.5, -10.5);
    ctx.lineTo(-2, -7);
    ctx.closePath();
    ctx.fill();

    // Right ear
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(1, -7);
    ctx.lineTo(6, -12);
    ctx.lineTo(7, -4);
    ctx.closePath();
    ctx.fill();

    // Right inner ear (pink)
    ctx.fillStyle = '#FFB8C6';
    ctx.beginPath();
    ctx.moveTo(2, -7);
    ctx.lineTo(5.5, -10.5);
    ctx.lineTo(6, -5);
    ctx.closePath();
    ctx.fill();

    // Red Collar
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.roundRect(-6, 4, 12, 2.5, 1);
    ctx.fill();

    // Golden collar bell
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(0, 6, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Face Details
    if (isMovingUp) {
      // Facing up: back of head, two perky ears
      return;
    }

    // Shiba Eyebrows (Cream dots)
    ctx.fillStyle = '#E5DECF';
    ctx.beginPath();
    ctx.arc(-3, -3, 1.2, 0, Math.PI * 2);
    ctx.arc(3, -3, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    if (isDizzy) {
      // Dizzy spiral eyes `@ @`
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(-3.5, 0, 2, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(3.5, 0, 2, 0, Math.PI * 1.5);
      ctx.stroke();
    } else if (this.isZoomies) {
      // Happy joyful eyes `^ ^`
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-5, 0.5);
      ctx.lineTo(-3, -1.5);
      ctx.lineTo(-1, 0.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(1, 0.5);
      ctx.lineTo(3, -1.5);
      ctx.lineTo(5, 0.5);
      ctx.stroke();
    } else {
      // Kawaii shiny black eyes
      ctx.fillStyle = '#111827';
      const eyeX = isMovingHoriz ? 1.5 : 0;
      ctx.beginPath();
      ctx.arc(-3 + eyeX, 0, 1.8, 0, Math.PI * 2);
      ctx.arc(3 + eyeX, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // White eye glint
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-3.5 + eyeX, -0.6, 0.7, 0, Math.PI * 2);
      ctx.arc(2.5 + eyeX, -0.6, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute Black Button Nose
    ctx.fillStyle = '#0F172A';
    const noseX = isMovingHoriz ? 5.5 : 0;
    const noseY = isMovingDown ? 4 : 2;
    ctx.beginPath();
    ctx.ellipse(noseX, noseY, 1.6, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chomping mouth animation
    if (chompCycle > 0.15 && !isDizzy) {
      const openAmount = chompCycle * 4;
      ctx.fillStyle = '#FF8FA3'; // pink tongue
      ctx.beginPath();
      if (isMovingHoriz) {
        ctx.arc(noseX + 1, noseY + 2.5, openAmount, 0, Math.PI);
      } else {
        ctx.arc(noseX, noseY + 2, openAmount, 0, Math.PI);
      }
      ctx.fill();
    } else {
      // Smiling mouth line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(noseX - 2, noseY + 2);
      ctx.quadraticCurveTo(noseX, noseY + 3.2, noseX + 2, noseY + 2);
      ctx.stroke();
    }
  }
}

window.ShibaPlayer = ShibaPlayer;
