class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = null;
        this.obstacleManager = null;
        this.collectibleManager = null;
        this.score = 0;
        this.isGameOver = false;
        this.isGameStarted = false;
        this.frameCount = 0;
        this.imagesLoaded = false;
        
        // Initialize audio manager
        window.audioManager = new AudioManager();
        
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
        this.setupEventListeners();
        
        try {
            await window.imageLoader.loadAllImages();
            console.log('Images loaded successfully');
        } catch (error) {
            console.warn('Some images failed to load:', error);
        }
        
        this.player = new Player(this.canvas.width / 4, this.canvas.height / 2);
        this.obstacleManager = new ObstacleManager(this.canvas.width, this.canvas.height);
        this.collectibleManager = new CollectibleManager(this.canvas.width, this.canvas.height);
        this.showStartScreen();
    }

    applyPowerUp(effect, duration) {
        if (!effect) return;
        this.player.applyPowerUp(effect, duration);
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

        // Mute button functionality
        const muteButton = document.getElementById('muteButton');
        muteButton.addEventListener('click', () => {
            const isMuted = window.audioManager.toggleMute();
            muteButton.textContent = isMuted ? '🔇' : '🔊';
        });
    }

    startGame() {
        this.isGameStarted = true;
        this.hideStartScreen();
        window.audioManager.playBackgroundMusic();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isGameOver) {
            this.frameCount++;
            this.update();
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        if (this.isGameOver) return;

        this.frameCount++;
        this.updatePowerUps();
        this.updateDifficulty();
        
        const deltaTime = 16.67; // Assuming 60 FPS
        this.player.update(deltaTime, this.score);  // Pass current score to player update
        this.obstacleManager.update(this.difficulty.currentSpeed);
        this.collectibleManager.update(this.player);
        this.checkCollisions();
        
        // Increase score over time (with double points power-up check)
        if (this.frameCount % 10 === 0) {
            const baseIncrease = 1;
            this.score += this.activeEffects.double_points.active ? baseIncrease * 2 : baseIncrease;
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw office background (simple version)
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ceiling (office lights)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, 15);
        // Add fluorescent light details
        this.ctx.fillStyle = '#DDDDDD';
        for (let x = 50; x < this.canvas.width; x += 200) {
            this.ctx.fillRect(x, 0, 100, 15);
        }
        
        // Draw floor
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);
        
        this.obstacleManager.render(this.ctx);
        this.collectibleManager.render(this.ctx);
        
        // Render player with power-up effects
        if (this.activeEffects.invincible.active) {
            this.ctx.globalAlpha = 0.7;
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 10;
        }
        this.player.render(this.ctx);
        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
        
        this.renderScore();
        this.renderPowerUps();
    }

    renderScore() {
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);
        
        // Show level and progress
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Level: ${this.difficulty.level}`, 20, 65);
        
        // Draw level progress bar
        const progressBarWidth = 100;
        const progress = (this.score % this.difficulty.pointsToNextLevel) / this.difficulty.pointsToNextLevel;
        
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillRect(90, 50, progressBarWidth, 15);
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(90, 50, progressBarWidth * progress, 15);
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
        if (!this.activeEffects.invincible.active && this.obstacleManager.checkCollision(this.player)) {
            this.gameOver();
            return;
        }

        // Check collision with collectibles
        const collectible = this.collectibleManager.checkCollisions(this.player);
        if (collectible) {
            // Add points (with double points check)
            const pointMultiplier = this.player.powerUps.double_points.active ? 2 : 1;
            this.score += collectible.points * pointMultiplier;
            
            // Play collect sound
            window.audioManager.playSound('collect');
            
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
            // Position power-ups display in the top-right corner
            const startX = this.canvas.width - 200;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(startX - 10, 10, 190, 30 + activeEffectsList.length * 25);
            
            this.ctx.fillStyle = '#000';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Active Power-ups:', startX, 30);
            
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