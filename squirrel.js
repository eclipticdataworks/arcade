/**
 * The 4 Squirrels (Ghosts) with Authentic Arcade AI & Procedural Visuals
 * 1. Nutty (Red / Blinky) - Direct Chaser & Pack Leader
 * 2. Chippy (Pink / Pinky) - Ambush Strategist (targets 4 tiles ahead)
 * 3. Squeaky (Cyan / Inky) - Flanker (uses vector from Nutty)
 * 4. Rusty (Orange / Clyde) - Shy Wanderer (chases when far, flees when close)
 */

class Squirrel {
  constructor(type, maze) {
    this.type = type; // 'nutty' | 'chippy' | 'squeaky' | 'rusty'
    this.maze = maze;
    this.tileSize = maze.tileSize;
    this.radius = this.tileSize * 0.70;

    this.configureSquirrel();
    this.reset();
  }

  configureSquirrel() {
    switch (this.type) {
      case 'nutty': // Red / Blinky
        this.name = 'Nutty';
        this.color = '#E63946';
        this.tailColor = '#C1121F';
        this.scatterTile = { c: 25, r: 0 };
        this.homePos = { c: 13.5, r: 11.5 }; // Spawns outside house
        this.spawnDelay = 0;
        break;
      case 'chippy': // Pink / Pinky
        this.name = 'Chippy';
        this.color = '#FF6B8B';
        this.tailColor = '#E05780';
        this.scatterTile = { c: 2, r: 0 };
        this.homePos = { c: 13.5, r: 14.5 };
        this.spawnDelay = 2.0;
        break;
      case 'squeaky': // Cyan / Inky
        this.name = 'Squeaky';
        this.color = '#00B4D8';
        this.tailColor = '#0077B6';
        this.scatterTile = { c: 27, r: 31 };
        this.homePos = { c: 11.5, r: 14.5 };
        this.spawnDelay = 4.5;
        break;
      case 'rusty': // Orange / Clyde
        this.name = 'Rusty';
        this.color = '#F77F00';
        this.tailColor = '#D62828';
        this.scatterTile = { c: 0, r: 31 };
        this.homePos = { c: 15.5, r: 14.5 };
        this.spawnDelay = 7.0;
        break;
    }
  }

  reset() {
    this.x = this.homePos.c * this.tileSize;
    this.y = this.homePos.r * this.tileSize;
    this.dir = { x: 0, y: -1 };
    this.targetTile = { ...this.scatterTile };
    this.lastDecisionTile = null;

    this.state = this.type === 'nutty' ? 'CHASE' : 'SPAWNING';
    this.spawnTimer = this.spawnDelay;
    this.houseBounceDir = 1;

    this.normalSpeed = 1.95;
    this.frightenedSpeed = 1.25;
    this.eatenSpeed = 3.8;
    this.tunnelSpeed = 1.1;
    this.speed = this.normalSpeed;

    this.frightenedTimer = 0;
    this.isFlashing = false;
    this.animFrame = Math.floor(Math.random() * 20);
  }

  makeFrightened(duration) {
    if (this.state === 'EATEN' || this.state === 'SPAWNING') return;
    this.state = 'FRIGHTENED';
    this.frightenedTimer = duration;
    this.isFlashing = false;
    // Reverse direction immediately upon entering frightened mode
    this.dir = { x: -this.dir.x, y: -this.dir.y };
    this.lastDecisionTile = null;
  }

  getEaten() {
    this.state = 'EATEN';
    this.frightenedTimer = 0;
  }

  update(dt, shiba, nutty, globalState) {
    this.animFrame++;

    // Update frightened timer
    if (this.state === 'FRIGHTENED') {
      this.frightenedTimer -= dt;
      this.isFlashing = this.frightenedTimer < 2.5 && Math.floor(this.animFrame / 6) % 2 === 0;
      if (this.frightenedTimer <= 0) {
        this.state = globalState; // Revert to CHASE or SCATTER
      }
    } else if (this.state !== 'EATEN' && this.state !== 'SPAWNING') {
      // Sync with global mode
      this.state = globalState;
    }

    // Spawning behavior inside squirrel tree hollow
    if (this.state === 'SPAWNING') {
      this.spawnTimer -= dt;
      // Bounce up and down
      this.y += this.houseBounceDir * 0.7;
      if (this.y < 13.8 * this.tileSize) this.houseBounceDir = 1;
      if (this.y > 15.2 * this.tileSize) this.houseBounceDir = -1;

      if (this.spawnTimer <= 0) {
        // Exit house
        const doorX = 13.5 * this.tileSize;
        if (Math.abs(this.x - doorX) > 2) {
          this.x += Math.sign(doorX - this.x) * 1.5;
        } else {
          this.x = doorX;
          this.y -= 1.8;
          if (this.y <= 11.5 * this.tileSize) {
            this.state = globalState;
            this.dir = { x: -1, y: 0 };
            this.lastDecisionTile = null;
          }
        }
      }
      return;
    }

    // Determine target tile based on AI personality
    this.calculateTargetTile(shiba, nutty);

    // Calculate speed
    const ts = this.tileSize;
    const currentC = Math.floor(this.x / ts);
    const currentR = Math.floor(this.y / ts);

    if (this.state === 'EATEN') {
      this.speed = this.eatenSpeed;
    } else if (this.maze.isTunnel(currentC, currentR)) {
      this.speed = this.tunnelSpeed;
    } else if (this.state === 'FRIGHTENED') {
      this.speed = this.frightenedSpeed;
    } else {
      // Cruise Elroy speed boost for Nutty when dots are low
      if (this.type === 'nutty' && this.maze.remainingDots < 30) {
        this.speed = this.normalSpeed * 1.12;
      } else {
        this.speed = this.normalSpeed;
      }
    }

    // Check if at intersection
    const centerTileX = currentC * ts + ts / 2;
    const centerTileY = currentR * ts + ts / 2;
    const distToCenter = Math.hypot(this.x - centerTileX, this.y - centerTileY);

    const tileKey = currentC + ',' + currentR;
    if (distToCenter <= this.speed && this.lastDecisionTile !== tileKey) {
      this.lastDecisionTile = tileKey;
      // Snap to tile center
      this.x = centerTileX;
      this.y = centerTileY;

      // Handle eaten return to hollow
      if (this.state === 'EATEN') {
        const doorCol = 13;
        const doorRow = 11;
        if ((currentC === 13 || currentC === 14) && currentR === 11) {
          // Re-entered house door
          this.state = 'SPAWNING';
          this.spawnTimer = 1.0; // short pause before exiting
          this.lastDecisionTile = null;
          return;
        }
      }

      // Choose next direction at intersection
      this.chooseDirection(currentC, currentR);
    }

    // Move in chosen direction
    this.x += this.dir.x * this.speed;
    this.y += this.dir.y * this.speed;

    // Tunnel wrap-around (Row 14)
    if (currentR === 14) {
      if (this.x < -ts * 0.5) {
        this.x = this.maze.width + ts * 0.4;
      } else if (this.x > this.maze.width + ts * 0.5) {
        this.x = -ts * 0.4;
      }
    }
  }

  calculateTargetTile(shiba, nutty) {
    const ts = this.tileSize;
    const shibaC = Math.floor(shiba.x / ts);
    const shibaR = Math.floor(shiba.y / ts);
    const currentC = Math.floor(this.x / ts);
    const currentR = Math.floor(this.y / ts);

    if (this.state === 'EATEN') {
      // Target the door of the tree hollow
      this.targetTile = { c: 13.5, r: 11 };
      return;
    }

    if (this.state === 'SCATTER') {
      this.targetTile = { ...this.scatterTile };
      return;
    }

    if (this.state === 'FRIGHTENED') {
      // Random directions chosen at intersection
      return;
    }

    // CHASE MODE AI:
    switch (this.type) {
      case 'nutty': // Blinky: Direct pursuit
        this.targetTile = { c: shibaC, r: shibaR };
        break;

      case 'chippy': // Pinky: 4 tiles ahead of Shiba
        this.targetTile = {
          c: shibaC + shiba.dir.x * 4,
          r: shibaR + shiba.dir.y * 4
        };
        break;

      case 'squeaky': // Inky: Vector doubling from Nutty
        {
          const aheadC = shibaC + shiba.dir.x * 2;
          const aheadR = shibaR + shiba.dir.y * 2;
          const nuttyC = Math.floor((nutty ? nutty.x : this.x) / ts);
          const nuttyR = Math.floor((nutty ? nutty.y : this.y) / ts);
          this.targetTile = {
            c: aheadC + (aheadC - nuttyC),
            r: aheadR + (aheadR - nuttyR)
          };
        }
        break;

      case 'rusty': // Clyde: Chases if far (> 8 tiles), scatters if near (<= 8 tiles)
        {
          const distSq = (currentC - shibaC) ** 2 + (currentR - shibaR) ** 2;
          if (distSq > 64) {
            this.targetTile = { c: shibaC, r: shibaR };
          } else {
            this.targetTile = { ...this.scatterTile };
          }
        }
        break;
    }
  }

  chooseDirection(currentC, currentR) {
    const possibleDirs = [
      { x: 0, y: -1 }, // Up
      { x: -1, y: 0 }, // Left
      { x: 0, y: 1 },  // Down
      { x: 1, y: 0 }   // Right
    ];

    // Squirrels cannot reverse 180 degrees at intersections
    const validDirs = possibleDirs.filter(d => {
      if (d.x === -this.dir.x && d.y === -this.dir.y) return false;
      const nextC = currentC + d.x;
      const nextR = currentR + d.y;

      // Check walls
      if (this.maze.isWall(nextC, nextR)) return false;

      // Ghost house door rules
      if (this.maze.isHouseDoor(nextC, nextR)) {
        return this.state === 'EATEN';
      }

      return true;
    });

    if (validDirs.length === 0) {
      // Must reverse if stuck
      this.dir = { x: -this.dir.x, y: -this.dir.y };
      return;
    }

    if (this.state === 'FRIGHTENED') {
      // Pick random valid turn
      const pick = validDirs[Math.floor(Math.random() * validDirs.length)];
      this.dir = pick;
      return;
    }

    // Pick direction that minimizes Euclidean distance to target
    let bestDir = validDirs[0];
    let bestDist = Infinity;

    for (const d of validDirs) {
      const nextC = currentC + d.x;
      const nextR = currentR + d.y;
      const dist = (nextC - this.targetTile.c) ** 2 + (nextR - this.targetTile.r) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = d;
      }
    }

    this.dir = bestDir;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.state === 'EATEN') {
      // Draw eyes & scampering tail returning home
      this.renderEatenSquirrel(ctx);
      ctx.restore();
      return;
    }

    if (this.state === 'FRIGHTENED') {
      this.renderFrightenedSquirrel(ctx);
      ctx.restore();
      return;
    }

    this.renderNormalSquirrel(ctx);
    ctx.restore();
  }

  renderNormalSquirrel(ctx) {
    const flipX = this.dir.x < 0;
    if (flipX) ctx.scale(-1, 1);

    const tailSway = Math.sin(this.animFrame * 0.22) * 0.2;
    const feetRun = Math.sin(this.animFrame * 0.45) * 2;

    // Bushy curved squirrel tail (grand arch over the back)
    ctx.save();
    ctx.translate(-5, 0);
    ctx.rotate(tailSway - 0.2);
    ctx.fillStyle = this.tailColor;

    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-14, 2, -18, -12, -6, -15);
    ctx.bezierCurveTo(-1, -17, 3, -10, -1, -5);
    ctx.bezierCurveTo(-4, 0, -2, 4, 0, 5);
    ctx.closePath();
    ctx.fill();

    // Tail fur fluff tufts
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Feet scampering
    ctx.fillStyle = this.tailColor;
    ctx.beginPath();
    ctx.ellipse(-3 + feetRun, 8, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.ellipse(3 - feetRun, 8, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main Body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 1, 7.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cream belly / chest
    ctx.fillStyle = '#FFF1D0';
    ctx.beginPath();
    ctx.ellipse(1, 2, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears with tufts
    // Left ear
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-4, -13);
    ctx.lineTo(-1, -7);
    ctx.closePath();
    ctx.fill();

    // Ear tip tuft
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, -13);
    ctx.lineTo(-3.5, -15);
    ctx.stroke();

    // Right ear
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(1, -7);
    ctx.lineTo(4, -13);
    ctx.lineTo(5, -6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(4, -13);
    ctx.lineTo(4.5, -15);
    ctx.stroke();

    // Hazelnut / Acorn held in paws
    ctx.fillStyle = '#8B4513'; // brown nut
    ctx.beginPath();
    ctx.ellipse(2, 4, 3, 3.5, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5C2C16'; // acorn cap
    ctx.beginPath();
    ctx.ellipse(1.5, 1.5, 3.2, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Little front paws hugging acorn
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 4, 1.5, 0, Math.PI * 2);
    ctx.arc(4, 4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes looking in moving direction
    const eyeOffsetX = this.dir.x * 1.5;
    const eyeOffsetY = this.dir.y * 1.5;

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(-2 + eyeOffsetX, -2 + eyeOffsetY, 1.8, 0, Math.PI * 2);
    ctx.arc(3 + eyeOffsetX, -2 + eyeOffsetY, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Catchlight in eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-2.5 + eyeOffsetX, -2.5 + eyeOffsetY, 0.7, 0, Math.PI * 2);
    ctx.arc(2.5 + eyeOffsetX, -2.5 + eyeOffsetY, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Cute nose button
    ctx.fillStyle = '#331100';
    ctx.beginPath();
    ctx.ellipse(0.5, 0, 1.2, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  renderFrightenedSquirrel(ctx) {
    const isWhite = this.isFlashing;
    const bodyColor = isWhite ? '#FFFFFF' : '#1D4ED8';
    const bellyColor = isWhite ? '#E2E8F0' : '#60A5FA';
    const shake = Math.sin(this.animFrame * 0.8) * 1.8;

    ctx.translate(shake, 0);

    // Fluffed trembling tail
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(-8, -4, 6, 0, Math.PI * 2);
    ctx.arc(-5, -8, 5, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 1, 7.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(0, 2, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-4, -12);
    ctx.lineTo(-1, -7);
    ctx.lineTo(1, -7);
    ctx.lineTo(4, -12);
    ctx.lineTo(5, -6);
    ctx.fill();

    // Wide panicked white eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-2.5, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(2.5, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Shaking pinprick pupils
    ctx.fillStyle = '#0F172A';
    const pupilShake = Math.sin(this.animFrame) * 0.8;
    ctx.beginPath();
    ctx.arc(-2.5 + pupilShake, -2, 1.1, 0, Math.PI * 2);
    ctx.arc(2.5 + pupilShake, -2, 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Wavy panic mouth `~`
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-3, 3);
    ctx.quadraticCurveTo(-1.5, 1.5, 0, 3);
    ctx.quadraticCurveTo(1.5, 4.5, 3, 3);
    ctx.stroke();

    // Blue panic sweat drop
    if (!isWhite) {
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(5, -5);
      ctx.quadraticCurveTo(7, -3, 6, -1);
      ctx.quadraticCurveTo(5, 0, 4, -1);
      ctx.closePath();
      ctx.fill();
    }
  }

  renderEatenSquirrel(ctx) {
    // Eaten squirrel: floating acorn & frantic scampering feet returning home
    const feetRun = Math.sin(this.animFrame * 0.8) * 3;

    // Golden acorn
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(0, -1, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.ellipse(0, -4.5, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tiny running feet
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.ellipse(-3 + feetRun, 6, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.ellipse(3 - feetRun, 6, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Big alert eyes peering from behind the acorn
    const lookX = this.dir.x * 2;
    const lookY = this.dir.y * 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-3, -2, 2.8, 0, Math.PI * 2);
    ctx.arc(3, -2, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2563EB';
    ctx.beginPath();
    ctx.arc(-3 + lookX, -2 + lookY, 1.4, 0, Math.PI * 2);
    ctx.arc(3 + lookX, -2 + lookY, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.Squirrel = Squirrel;
