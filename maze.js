/**
 * Maze Layout & Rendering for Shiba Pac-Man
 * 28 columns x 31 rows (Iconic arcade proportions)
 */

const RAW_MAZE_MAP = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '     #.##### ## #####.#     ',
  '     #.##          ##.#     ',
  '     #.## ###--### ##.#     ',
  '######.## #      # ##.######',
  '      .   #      #   .      ',
  '######.## #      # ##.######',
  '     #.## ######## ##.#     ',
  '     #.##          ##.#     ',
  '     #.## ######## ##.#     ',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##................##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################'
];

class Maze {
  constructor(tileSize = 20) {
    this.cols = 28;
    this.rows = 31;
    this.tileSize = tileSize;
    this.width = this.cols * this.tileSize;
    this.height = this.rows * this.tileSize;
    this.theme = 'neon'; // 'neon' | 'park'
    this.dots = [];
    this.totalDots = 0;
    this.remainingDots = 0;

    // Fruit / Park Treat spawn
    this.fruit = null; // { type: 'tennis_ball', x, y, score, timer }
    this.fruitTimer = 0;

    this.init();
  }

  init() {
    this.dots = [];
    this.totalDots = 0;
    for (let r = 0; r < this.rows; r++) {
      this.dots[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const char = RAW_MAZE_MAP[r][c];
        if (char === '.') {
          this.dots[r][c] = 'dot';
          this.totalDots++;
        } else if (char === 'o') {
          this.dots[r][c] = 'energizer';
          this.totalDots++;
        } else {
          this.dots[r][c] = null;
        }
      }
    }
    this.remainingDots = this.totalDots;
  }

  reset() {
    this.init();
    this.fruit = null;
    this.fruitTimer = 0;
  }

  isWall(c, r) {
    if (r < 0 || r >= this.rows) return true;
    // Tunnels wrap around horizontally
    if (r === 14 && (c < 0 || c >= this.cols)) return false;
    if (c < 0 || c >= this.cols) return true;
    return RAW_MAZE_MAP[r][c] === '#';
  }

  isHouseDoor(c, r) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
    return RAW_MAZE_MAP[r][c] === '-';
  }

  isInsideHouse(c, r) {
    return (r >= 12 && r <= 15 && c >= 10 && c <= 17);
  }

  isTunnel(c, r) {
    return (r === 14 && (c <= 5 || c >= 22));
  }

  eatDot(c, r) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    const type = this.dots[r][c];
    if (type) {
      this.dots[r][c] = null;
      this.remainingDots--;
      return type; // 'dot' (10 pts) or 'energizer' (50 pts)
    }
    return null;
  }

  spawnFruit(level) {
    const fruits = [
      { name: 'Tennis Ball', score: 100, color: '#A7F432', icon: '🎾' },
      { name: 'Squeaky Bone', score: 300, color: '#FF70A6', icon: '🦴' },
      { name: 'Hot Dog', score: 500, color: '#E76F51', icon: '🌭' },
      { name: 'Gold Trophy', score: 700, color: '#FFD166', icon: '🏆' },
      { name: 'Royal Crown', score: 1000, color: '#F4A261', icon: '👑' }
    ];
    const index = Math.min(level - 1, fruits.length - 1);
    this.fruit = {
      ...fruits[index],
      col: 13.5,
      row: 17,
      timer: 10 // stays for 10 seconds
    };
  }

  updateFruit(dt) {
    if (this.fruit) {
      this.fruit.timer -= dt;
      if (this.fruit.timer <= 0) {
        this.fruit = null;
      }
    }
  }

  draw(ctx, animFrame) {
    const ts = this.tileSize;

    // Draw background
    ctx.fillStyle = this.theme === 'park' ? '#14281D' : '#070913';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw park cobblestone pattern or arcade grid if desired
    if (this.theme === 'park') {
      ctx.strokeStyle = 'rgba(46, 117, 89, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < this.width; x += ts * 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
      }
    }

    // Draw walls
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const char = RAW_MAZE_MAP[r][c];
        const x = c * ts;
        const y = r * ts;

        if (char === '#') {
          this.drawWallBlock(ctx, c, r, x, y, ts);
        } else if (char === '-') {
          // Ghost house door
          this.drawHouseDoor(ctx, x, y, ts, animFrame);
        }
      }
    }

    // Draw dots & energizers
    const timeSec = animFrame * 0.05;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const type = this.dots[r][c];
        if (!type) continue;

        const cx = c * ts + ts / 2;
        const cy = r * ts + ts / 2;

        if (type === 'dot') {
          this.drawKibbleDot(ctx, cx, cy);
        } else if (type === 'energizer') {
          this.drawGoldenAcorn(ctx, cx, cy, timeSec);
        }
      }
    }

    // Draw fruit bonus item if active
    if (this.fruit) {
      this.drawFruitItem(ctx, this.fruit.col * ts, this.fruit.row * ts + ts / 2, animFrame);
    }
  }

  drawWallBlock(ctx, c, r, x, y, ts) {
    if (this.theme === 'park') {
      // Lush Japanese hedge style with rounded aesthetic
      ctx.fillStyle = '#1D5A3A';
      ctx.fillRect(x, y, ts, ts);

      // Hedge top highlight
      ctx.fillStyle = '#2D8A58';
      ctx.fillRect(x + 1, y + 1, ts - 2, 3);

      // Subtle foliage leaf dot
      if ((c + r) % 3 === 0) {
        ctx.fillStyle = '#3DB876';
        ctx.beginPath();
        ctx.arc(x + ts * 0.5, y + ts * 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer border
      ctx.strokeStyle = '#0F3822';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, ts, ts);
    } else {
      // Classic Neon Arcade Style
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(x, y, ts, ts);

      ctx.strokeStyle = '#2563EB'; // Electric blue
      ctx.shadowColor = '#60A5FA';
      ctx.shadowBlur = 4;
      ctx.lineWidth = 1.5;

      // Draw subtle inner wall contours for that true arcade feel
      const neighbors = {
        top: this.isWall(c, r - 1),
        bottom: this.isWall(c, r + 1),
        left: this.isWall(c - 1, r),
        right: this.isWall(c + 1, r)
      };

      ctx.beginPath();
      if (!neighbors.top) {
        ctx.moveTo(x, y + 1);
        ctx.lineTo(x + ts, y + 1);
      }
      if (!neighbors.bottom) {
        ctx.moveTo(x, y + ts - 1);
        ctx.lineTo(x + ts, y + ts - 1);
      }
      if (!neighbors.left) {
        ctx.moveTo(x + 1, y);
        ctx.lineTo(x + 1, y + ts);
      }
      if (!neighbors.right) {
        ctx.moveTo(x + ts - 1, y);
        ctx.lineTo(x + ts - 1, y + ts);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }
  }

  drawHouseDoor(ctx, x, y, ts, animFrame) {
    // Glowing squirrel gate
    const glow = Math.sin(animFrame * 0.1) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(244, 114, 182, ${glow})`;
    ctx.fillRect(x, y + ts * 0.35, ts, ts * 0.3);

    ctx.strokeStyle = '#F472B6';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y + ts * 0.35, ts, ts * 0.3);
  }

  // Draw cute little dog kibble / bone
  drawKibbleDot(ctx, cx, cy) {
    ctx.save();
    ctx.fillStyle = '#FDE047'; // Golden kibble
    ctx.shadowColor = '#EAB308';
    ctx.shadowBlur = 3;

    // Mini dog bone shape
    const w = 4;
    const h = 2;
    ctx.fillRect(cx - w, cy - h, w * 2, h * 2);

    // 4 little bone lobe circles
    const r = 2;
    ctx.beginPath();
    ctx.arc(cx - w, cy - h, r, 0, Math.PI * 2);
    ctx.arc(cx - w, cy + h, r, 0, Math.PI * 2);
    ctx.arc(cx + w, cy - h, r, 0, Math.PI * 2);
    ctx.arc(cx + w, cy + h, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Golden Acorn (Power Pellet)
  drawGoldenAcorn(ctx, cx, cy, timeSec) {
    ctx.save();
    ctx.translate(cx, cy);

    // Pulse size gently
    const scale = 1 + 0.18 * Math.sin(timeSec * 5);
    ctx.scale(scale, scale);

    // Golden glow
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 8;

    // Acorn nut body (pointed oval bottom)
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.bezierCurveTo(-6, 6, 0, 9, 0, 9);
    ctx.bezierCurveTo(0, 9, 6, 6, 6, -1);
    ctx.closePath();
    ctx.fill();

    // Nut highlight
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.ellipse(-2, 3, 1.5, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Acorn cap (rich oak brown textured cap)
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.ellipse(0, -2, 7, 3.5, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Little acorn stem
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.quadraticCurveTo(1, -7, 2, -8);
    ctx.stroke();

    // Sparkle star glint
    if (Math.sin(timeSec * 8) > 0.4) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(4, 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawFruitItem(ctx, cx, cy, animFrame) {
    ctx.save();
    ctx.translate(cx, cy);

    // Float bobbing effect
    const bob = Math.sin(animFrame * 0.1) * 3;
    ctx.translate(0, bob);

    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.fruit.icon, 0, 0);

    // Point badge
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#FDE047';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillText(`${this.fruit.score}`, 0, 14);

    ctx.restore();
  }
}

// Export for browser
window.Maze = Maze;
