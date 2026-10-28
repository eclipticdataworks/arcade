/**
 * Main Entry Point for Shiba Pac-Man Arcade
 * Handles user inputs, touch/mobile gestures, audio events, and UI controls
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const game = new Game(canvas);

  // Audio unlock helper
  const unlockAudio = () => {
    if (window.soundEngine) {
      window.soundEngine.ensureContext();
    }
  };

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    unlockAudio();

    if (e.code === 'Space') {
      e.preventDefault();
      if (game.state === 'TITLE' || game.state === 'GAME_OVER') {
        game.startNewGame();
      } else {
        game.togglePause();
      }
      return;
    }

    if (e.code === 'KeyP') {
      e.preventDefault();
      game.togglePause();
      return;
    }

    if (e.code === 'KeyM') {
      e.preventDefault();
      const isMuted = window.soundEngine.toggleMute();
      updateMuteButtonUI(isMuted);
      return;
    }

    // Direction input
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        game.player.setDirection(0, -1);
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        game.player.setDirection(0, 1);
        break;
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        game.player.setDirection(-1, 0);
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        game.player.setDirection(1, 0);
        break;
    }
  });

  // Touch & Swipe Controls on Canvas
  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener('touchstart', (e) => {
    unlockAudio();
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent screen scrolling during game play
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const minSwipeDist = 20;

    if (Math.hypot(dx, dy) >= minSwipeDist) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        game.player.setDirection(dx > 0 ? 1 : -1, 0);
      } else {
        // Vertical swipe
        game.player.setDirection(0, dy > 0 ? 1 : -1);
      }
    } else {
      // Tap on canvas starts or unpauses
      if (game.state === 'TITLE' || game.state === 'GAME_OVER') {
        game.startNewGame();
      } else if (game.state === 'PAUSED') {
        game.togglePause();
      }
    }
  });

  // Virtual D-Pad buttons for mobile / mouse click
  const setupDpadButton = (id, dx, dy) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const handlePress = (e) => {
      e.preventDefault();
      unlockAudio();
      game.player.setDirection(dx, dy);
    };
    btn.addEventListener('mousedown', handlePress);
    btn.addEventListener('touchstart', handlePress, { passive: false });
  };

  setupDpadButton('btn-up', 0, -1);
  setupDpadButton('btn-down', 0, 1);
  setupDpadButton('btn-left', -1, 0);
  setupDpadButton('btn-right', 1, 0);

  // UI Buttons
  const startBtn = document.getElementById('btn-start');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      unlockAudio();
      game.startNewGame();
    });
  }

  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      unlockAudio();
      game.togglePause();
    });
  }

  const muteBtn = document.getElementById('btn-mute');
  const updateMuteButtonUI = (isMuted) => {
    if (!muteBtn) return;
    muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
    muteBtn.classList.toggle('text-red-400', isMuted);
  };

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      unlockAudio();
      const isMuted = window.soundEngine.toggleMute();
      updateMuteButtonUI(isMuted);
    });
  }

  const themeBtn = document.getElementById('btn-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      game.toggleTheme();
      themeBtn.textContent = game.maze.theme === 'neon' ? '🌲 Sakura Park' : '⚡ Neon Arcade';
    });
  }

  const crtBtn = document.getElementById('btn-crt');
  const screenWrapper = document.getElementById('screen-wrapper');
  if (crtBtn && screenWrapper) {
    crtBtn.addEventListener('click', () => {
      screenWrapper.classList.toggle('crt-scanlines');
      crtBtn.classList.toggle('bg-blue-600', screenWrapper.classList.contains('crt-scanlines'));
    });
  }

  // Start the game loop
  game.loop();
});
