class Game {
    constructor() {
        console.log('Game constructor started');
        
        // Initialize canvas
        this.canvas = document.getElementById('gameCanvas');
        console.log('Canvas element:', this.canvas);
        
        // Get context with explicit attributes
        this.ctx = this.canvas.getContext('2d', {
            alpha: false,  // Optimize for non-transparent background
            desynchronized: true,  // Potential performance improvement
            willReadFrequently: false  // Optimize for drawing only
        });
        console.log('Canvas context:', this.ctx);
        
        // Set fixed canvas size (both logical and display size)
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.style.width = '800px';
        this.canvas.style.height = '600px';

        // Frame timing control
        this.baseTimeStep = 1000 / 60; // Base physics rate at 60Hz
        this.lastFrameTime = 0;
        this.deltaAccumulator = 0;
        
        // Difficulty and speed scaling
        this.speedMultiplier = 1.0;  // Will increase with difficulty
        
        console.log('Canvas dimensions set:', {
            width: this.canvas.width,
            height: this.canvas.height,
            styleWidth: this.canvas.style.width,
            styleHeight: this.canvas.style.height,
            clientWidth: this.canvas.clientWidth,
            clientHeight: this.canvas.clientHeight
        });

        // Verify canvas size
        console.log('Canvas size after initialization:', {
            width: this.canvas.width,
            height: this.canvas.height,
            styleWidth: this.canvas.style.width,
            styleHeight: this.canvas.style.height
        });
        
        this.player = null;
        this.obstacleManager = null;
        this.collectibleManager = null;
        this.score = 0;
        this.isGameOver = false;
        this.isGameStarted = false;
        this.frameCount = 0;
        this.imagesLoaded = false;
        
        // Difficulty settings
        this.difficulty = {
            level: 1,
            baseSpeed: 5,
            currentSpeed: 5,
            maxLevel: 10,
            pointsToNextLevel: 100,
            speedIncreasePerLevel: 0.5
        };
        
        // Power-ups are now managed by the Player class
        
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoadingScreen();
        
        // Setup event listeners
        this.setupEventListeners();
        
        try {
            // Setup progress callback
            window.resourceLoader.setProgressCallback((progress) => {
                this.updateLoadingProgress(progress);
            });
            
            // Load all resources
            const result = await window.resourceLoader.loadAll();
            console.log('Resources loaded:', result);
            
            if (!result.success) {
                throw new Error(`Failed to load all resources. Loaded ${result.totalLoaded}/${result.totalResources}`);
            }
            
            // Initialize game components
            this.player = new Player(this.canvas.width / 4, this.canvas.height / 2);
            this.obstacleManager = new ObstacleManager(this.canvas.width, this.canvas.height);
            this.collectibleManager = new CollectibleManager(this.canvas.width, this.canvas.height);
            
            // Hide loading screen and show start screen
            this.hideLoadingScreen();
            this.showStartScreen();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showErrorScreen('Failed to load game resources. Please refresh the page.');
        }
    }

    applyPowerUp(effect, duration, currentScore) {
        if (!effect) return;
        this.player.applyPowerUp(effect, duration, currentScore);
    }

    updatePowerUps() {
        // Power-ups are now managed by the player class
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (!this.isGameStarted) {
                    this.startGame();
                } else if (!this.isGameOver) {
                    this.player.jump();
                }
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('click', () => {
            if (this.isGameStarted && !this.isGameOver) {
                this.player.jump();
            }
        });

        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.resetGame());
    }

    startGame() {
        console.log('Starting game...');
        
        // Check if game container is visible
        const container = document.querySelector('.game-container');
        const containerStyle = window.getComputedStyle(container);
        console.log('Game container style:', {
            display: containerStyle.display,
            visibility: containerStyle.visibility,
            opacity: containerStyle.opacity,
            width: containerStyle.width,
            height: containerStyle.height,
            position: containerStyle.position
        });
        
        this.isGameStarted = true;
        this.hideStartScreen();
        
        // Reset timing variables
        this.lastFrameTime = performance.now();
        this.deltaAccumulator = 0;
        
        // Start background music when game starts
        window.audioManager.playBackgroundMusic();
        
        // Force a reflow/repaint
        this.canvas.style.display = 'none';
        this.canvas.offsetHeight; // Force reflow
        this.canvas.style.display = 'block';
        
        // Start game loop with performance timing
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    gameLoop(timestamp) {
        if (!this.isGameOver) {
            // Calculate frame timing
            const currentTime = timestamp;
            const elapsedTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;

            // Accumulate time for physics updates
            this.deltaAccumulator += elapsedTime;

            // Calculate effective time step based on current speed multiplier
            const effectiveTimeStep = this.baseTimeStep / this.speedMultiplier;

            // Debug info
            if (this.frameCount % 60 === 0) {
                const fps = 1000 / elapsedTime;
                console.log('Stats:', {
                    fps: Math.round(fps),
                    speedMultiplier: this.speedMultiplier.toFixed(2),
                    effectiveTimeStep: effectiveTimeStep.toFixed(2)
                });
            }

            // Verify canvas and context
            if (!this.ctx || this.ctx.isContextLost?.()) {
                console.error('Canvas context is lost or invalid');
                this.ctx = this.canvas.getContext('2d', {
                    alpha: false,
                    desynchronized: true,
                    willReadFrequently: false
                });
                if (!this.ctx) {
                    console.error('Failed to restore canvas context');
                    return;
                }
            }

            // Fixed time step updates with speed scaling
            while (this.deltaAccumulator >= effectiveTimeStep) {
                this.update(effectiveTimeStep);
                this.deltaAccumulator -= effectiveTimeStep;
            }

            // Render frame
            this.render();
            
            // Schedule next frame
            try {
                requestAnimationFrame((t) => this.gameLoop(t));
            } catch (error) {
                console.error('Failed to schedule next frame:', error);
            }
        } else {
            console.log('Game loop ended - game over state');
        }
    }

    update(deltaTime = 16.67) {
        if (this.isGameOver) return;

        this.frameCount++;
        this.updatePowerUps();
        this.updateDifficulty();
        this.player.update(deltaTime, this.score);  // Pass current score to player update
        this.obstacleManager.update(this.difficulty.currentSpeed);
        this.collectibleManager.update(this.player);
        this.checkCollisions();
        
        // Increase score over time (with double points power-up check)
        if (this.frameCount % 10 === 0) {
            const baseIncrease = 1;
            this.score += this.player.powerUps.double_points.active ? baseIncrease * 2 : baseIncrease;
        }
    }
    
    updateDifficulty() {
        // Calculate current level based on score
        const newLevel = Math.min(
            this.difficulty.maxLevel,
            Math.floor(this.score / this.difficulty.pointsToNextLevel) + 1
        );
        
        // If level changed, update speed
        if (newLevel !== this.difficulty.level) {
            this.difficulty.level = newLevel;
            
            // Update speed multiplier (starts at 1.0 and increases with level)
            this.speedMultiplier = 1.0 + (this.difficulty.level - 1) * 0.2; // 20% speed increase per level
            
            // Update base movement speed
            this.difficulty.currentSpeed = this.difficulty.baseSpeed + 
                (this.difficulty.level - 1) * this.difficulty.speedIncreasePerLevel;
                
            // Update spawn intervals based on speed
            if (this.obstacleManager) {
                this.obstacleManager.spawnInterval = Math.max(
                    60,  // Minimum spawn interval
                    120 - (this.difficulty.level - 1) * 5  // Decrease interval as level increases
                );
            }
            if (this.collectibleManager) {
                this.collectibleManager.spawnInterval = Math.max(
                    90,  // Minimum spawn interval
                    180 - (this.difficulty.level - 1) * 8  // Decrease interval as level increases
                );
            }
            
            console.log('Difficulty increased:', {
                level: this.difficulty.level,
                speedMultiplier: this.speedMultiplier.toFixed(2),
                baseSpeed: this.difficulty.currentSpeed
            });
        }
    }

    render() {
        console.log('Render frame started');
        
        // Handle canvas context loss
        if (!this.ctx || this.ctx.isContextLost?.()) {
            console.warn('Canvas context lost, attempting to restore...');
            this.ctx = this.canvas.getContext('2d', {
                alpha: false,
                desynchronized: true,
                willReadFrequently: false
            });
            if (!this.ctx) {
                console.error('Failed to restore canvas context');
                return;
            }
        }

        // Verify canvas dimensions before rendering
        if (this.canvas.width !== 800 || this.canvas.height !== 600) {
            console.warn('Canvas dimensions changed, resetting...');
            this.canvas.width = 800;
            this.canvas.height = 600;
        }

        this.ctx.save();  // Save initial state
        console.log('Canvas state saved');
        
        // Clear and draw background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ceiling (office lights)
        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, 15);
        this.ctx.fillStyle = '#DDDDDD';
        for (let x = 50; x < this.canvas.width; x += 200) {
            this.ctx.fillRect(x, 0, 100, 15);
        }
        this.ctx.restore();
        
        // Draw floor
        this.ctx.save();
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);
        this.ctx.restore();
        
        // Draw game elements
        this.obstacleManager.render(this.ctx);
        this.collectibleManager.render(this.ctx);
        
        // Render player with power-up effects
        this.ctx.save();
        if (this.player.powerUps.invincible.active) {
            this.ctx.globalAlpha = 0.7;
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 10;
        }
        this.player.render(this.ctx);
        this.ctx.restore();
        
        // Render UI elements
        this.renderScore();
        this.renderPowerUps();
        
        this.ctx.restore();  // Restore initial state
    }

    renderScore() {
        this.ctx.save();
        
        // Render score
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);
        
        // Show level
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Level: ${this.difficulty.level}`, 20, 65);
        
        // Draw level progress bar
        const progressBarWidth = 100;
        const progress = (this.score % this.difficulty.pointsToNextLevel) / this.difficulty.pointsToNextLevel;
        
        // Draw background bar
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillRect(90, 50, progressBarWidth, 15);
        
        // Draw progress
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(90, 50, progressBarWidth * progress, 15);
        
        this.ctx.restore();
    }

    showLoadingScreen() {
        document.getElementById('loadingScreen').classList.remove('hidden');
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }

    hideLoadingScreen() {
        document.getElementById('loadingScreen').classList.add('hidden');
    }

    updateLoadingProgress(progress) {
        const loadingBar = document.getElementById('loadingBar');
        const loadingText = document.getElementById('loadingText');
        
        // Update loading bar
        loadingBar.style.width = `${progress}%`;
        
        // Update loading text
        if (progress < 33) {
            loadingText.textContent = 'Brewing coffee...';
        } else if (progress < 66) {
            loadingText.textContent = 'Organizing office supplies...';
        } else {
            loadingText.textContent = 'Almost ready...';
        }
    }

    showErrorScreen(message) {
        this.hideLoadingScreen();
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = message;
    }

    showStartScreen() {
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }

    hideStartScreen() {
        document.getElementById('startScreen').classList.add('hidden');
    }

    showGameOverScreen() {
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
    }

    resetGame() {
        this.score = 0;
        this.frameCount = 0;
        this.isGameOver = false;
        this.player = new Player(this.canvas.width / 4, this.canvas.height / 2);
        this.obstacleManager.reset();
        this.collectibles = [];
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.gameLoop();
    }

    updateCollectibles() {
        // Will implement collectible generation and movement later
    }

    checkCollisions() {
        // Check collision with floor
        if (this.player.y + this.player.height > this.canvas.height - 20) {
            this.gameOver();
            return;
        }

        // Check collision with ceiling
        if (this.player.y < 0) {
            this.gameOver();
            return;
        }

        // Check collision with obstacles (skip if invincible)
        if (!this.player.powerUps.invincible.active && this.obstacleManager.checkCollision(this.player)) {
            this.gameOver();
            return;
        }

        // Check collision with collectibles
        const collectible = this.collectibleManager.checkCollisions(this.player);
        if (collectible) {
            // Play collect sound
            window.audioManager.playSound('collect');
            // Add points (with double points check)
            const pointMultiplier = this.player.powerUps.double_points.active ? 2 : 1;
            this.score += collectible.points * pointMultiplier;
            
            // Apply power-up effect
            if (collectible.effect) {
                this.player.applyPowerUp(collectible.effect, collectible.duration, this.score);
            }
        }
    }

    renderPowerUps() {
        const activeEffectsList = Object.entries(this.player.powerUps)
            .filter(([_, state]) => state.active)
            .map(([effect, _]) => effect);

        if (activeEffectsList.length > 0) {
            this.ctx.save();
            
            // Position power-ups display in the top-right corner
            const startX = this.canvas.width - 200;
            
            // Draw background panel
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(startX - 10, 10, 190, 30 + activeEffectsList.length * 25);
            
            // Draw header
            this.ctx.fillStyle = '#000';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Active Power-ups:', startX, 30);
            
            // Draw each power-up
            activeEffectsList.forEach((effect, index) => {
                let text = '';
                switch (effect) {
                    case 'speed':
                        text = '🏃 Speed Boost';
                        break;
                    case 'invincible':
                        text = '🛡️ Invincible';
                        break;
                    case 'double_points':
                        text = '💎 Double Points';
                        break;
                    case 'magnet':
                        text = '🧲 Magnetic Pull';
                        break;
                }
                this.ctx.fillText(text, startX, 50 + (index * 25));
            });
            
            this.ctx.restore();
        }
    }

    gameOver() {
        if (!this.isGameOver) {  // Only play sound if not already game over
            window.audioManager.playSound('gameOver');
        }
        this.isGameOver = true;
        window.audioManager.stopBackgroundMusic();
        window.audioManager.playSound('gameOver');
        this.showGameOverScreen();
    }



    resetGame() {
        this.score = 0;
        this.frameCount = 0;
        this.isGameOver = false;
        this.player = new Player(this.canvas.width / 4, this.canvas.height / 2);
        this.obstacleManager.reset();
        this.collectibleManager.reset();
        
        // Reset difficulty
        this.difficulty.level = 1;
        this.difficulty.currentSpeed = this.difficulty.baseSpeed;
        
        // Power-ups are reset when creating a new player
        
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.gameLoop();
    }
}

// Initialize game when the module loads
async function initGame() {
    // Check browser compatibility first
    const compatibility = window.gameUtils.checkBrowserCompatibility();
    if (!compatibility.isCompatible) {
        console.error('Browser compatibility issues:', compatibility.issues);
        document.getElementById('loadingText').textContent = 
            'Your browser may not support all required features. Issues: ' + compatibility.issues.join(', ');
        return;
    }

    try {
        console.log('Starting resource loading...');
        const result = await window.resourceLoader.loadAll();
        console.log('Resource loading result:', result);
        
        if (result.success) {
            console.log('All resources loaded successfully, starting game...');
            window.audioManager.playBackgroundMusic();
            new Game();
        } else {
            console.error('Failed to load all resources:', result);
            document.getElementById('loadingText').textContent = 
                'Failed to load game resources. Please refresh the page.';
        }
    } catch (error) {
        console.error('Error loading game resources:', error);
        document.getElementById('loadingText').textContent = 
            'Error loading game resources. Please refresh the page.';
    }
}

// Start initialization when the page is fully loaded
window.addEventListener('load', initGame);