class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = null;
        this.obstacles = [];
        this.collectibles = [];
        this.score = 0;
        this.isGameOver = false;
        this.isGameStarted = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.player = new Player(this.canvas.width / 4, this.canvas.height / 2);
        this.showStartScreen();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (!this.isGameStarted) {
                    this.startGame();
                } else {
                    this.player.jump();
                }
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('click', () => {
            if (this.isGameStarted) {
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
            this.update();
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        this.player.update();
        
        // Update game objects
        this.updateObstacles();
        this.updateCollectibles();
        this.checkCollisions();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.player.render(this.ctx);
        this.obstacles.forEach(obstacle => obstacle.render(this.ctx));
        this.collectibles.forEach(collectible => collectible.render(this.ctx));
        
        this.renderScore();
    }

    renderScore() {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '24px Arial';
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
        this.obstacles = [];
        this.collectibles = [];
        this.isGameOver = false;
        this.player = new Player(this.canvas.width / 4, this.canvas.height / 2);
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.gameLoop();
    }

    updateObstacles() {
        // Implement obstacle generation and movement
    }

    updateCollectibles() {
        // Implement collectible generation and movement
    }

    checkCollisions() {
        // Implement collision detection
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});