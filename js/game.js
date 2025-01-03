class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = null;
        this.obstacleManager = null;
        this.collectibles = [];
        this.score = 0;
        this.isGameOver = false;
        this.isGameStarted = false;
        this.frameCount = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.player = new Player(this.canvas.width / 4, this.canvas.height / 2);
        this.obstacleManager = new ObstacleManager(this.canvas.width, this.canvas.height);
        this.showStartScreen();
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

        this.player.update();
        this.obstacleManager.update();
        this.updateCollectibles();
        this.checkCollisions();
        
        // Increase score over time
        if (this.frameCount % 10 === 0) {
            this.score++;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw office background (simple version)
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw floor
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);
        
        this.obstacleManager.render(this.ctx);
        this.collectibles.forEach(collectible => collectible.render(this.ctx));
        this.player.render(this.ctx);
        
        this.renderScore();
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

        // Check collision with obstacles
        if (this.obstacleManager.checkCollision(this.player)) {
            this.gameOver();
            return;
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.showGameOverScreen();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});