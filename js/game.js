class Game {
    constructor() {
        // Initialize canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set fixed canvas size (both logical and display size)
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.style.width = '800px';
        this.canvas.style.height = '600px';

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
        this.isGameStarted = true;
        this.hideStartScreen();
        this.lastTimestamp = null;
        // Start background music when game starts
        window.audioManager.playBackgroundMusic();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    gameLoop(timestamp) {
        if (!this.isGameOver) {
            // Calculate delta time for smooth animation
            if (!this.lastTimestamp) {
                this.lastTimestamp = timestamp;
            }
            let deltaTime = timestamp - this.lastTimestamp;
            this.lastTimestamp = timestamp;

            // Cap deltaTime to prevent huge jumps
            deltaTime = Math.min(deltaTime, 1000/30); // Cap at 30 FPS worth of time

            // Limit to 60 FPS
            if (deltaTime < 1000/60) {
                requestAnimationFrame((t) => this.gameLoop(t));
                return;
            }

            this.update(deltaTime);
            this.render();
            requestAnimationFrame((t) => this.gameLoop(t));
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
        }
    }

    render() {
        // Handle canvas context loss
        if (!this.ctx || this.ctx.isContextLost?.()) {
            console.warn('Canvas context lost, attempting to restore...');
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                console.error('Failed to restore canvas context');
                return;
            }
        }

        this.ctx.save();  // Save initial state
        
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

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});