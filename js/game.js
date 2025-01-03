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
        
        // Power-up states
        this.activeEffects = {
            speed: { active: false, endTime: 0 },
            invincible: { active: false, endTime: 0 },
            double_points: { active: false, endTime: 0 }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.player = new Player(this.canvas.width / 4, this.canvas.height / 2);
        this.obstacleManager = new ObstacleManager(this.canvas.width, this.canvas.height);
        this.collectibleManager = new CollectibleManager(this.canvas.width, this.canvas.height);
        this.showStartScreen();
    }

    applyPowerUp(effect, duration) {
        if (!effect) return;
        
        const endTime = Date.now() + duration;
        this.activeEffects[effect] = { active: true, endTime };

        switch (effect) {
            case 'speed':
                this.player.speed *= 1.5;
                break;
            case 'invincible':
                this.player.isInvincible = true;
                break;
            case 'double_points':
                // Handled in score calculation
                break;
        }
    }

    updatePowerUps() {
        const currentTime = Date.now();
        
        Object.entries(this.activeEffects).forEach(([effect, state]) => {
            if (state.active && currentTime >= state.endTime) {
                state.active = false;
                
                // Reset effect
                switch (effect) {
                    case 'speed':
                        this.player.speed /= 1.5;
                        break;
                    case 'invincible':
                        this.player.isInvincible = false;
                        break;
                }
            }
        });
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

        this.updatePowerUps();
        this.player.update();
        this.obstacleManager.update();
        this.collectibleManager.update();
        this.checkCollisions();
        
        // Increase score over time (with double points power-up check)
        if (this.frameCount % 10 === 0) {
            const baseIncrease = 1;
            this.score += this.activeEffects.double_points.active ? baseIncrease * 2 : baseIncrease;
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
            const pointMultiplier = this.activeEffects.double_points.active ? 2 : 1;
            this.score += collectible.points * pointMultiplier;
            
            // Apply power-up effect
            if (collectible.effect) {
                this.applyPowerUp(collectible.effect, collectible.duration);
            }
        }
    }

    renderPowerUps() {
        const activeEffectsList = Object.entries(this.activeEffects)
            .filter(([_, state]) => state.active)
            .map(([effect, _]) => effect);

        if (activeEffectsList.length > 0) {
            this.ctx.fillStyle = '#000';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Active Power-ups:', 20, 70);
            
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
                }
                this.ctx.fillText(text, 20, 90 + (index * 20));
            });
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.showGameOverScreen();
    }

    resetGame() {
        this.score = 0;
        this.frameCount = 0;
        this.isGameOver = false;
        this.player = new Player(this.canvas.width / 4, this.canvas.height / 2);
        this.obstacleManager.reset();
        this.collectibleManager.reset();
        
        // Reset power-ups
        Object.values(this.activeEffects).forEach(state => {
            state.active = false;
            state.endTime = 0;
        });
        
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.gameLoop();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});