class Obstacle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = 5;
        this.setDimensions();
        this.color = this.getColor();
    }

    setDimensions() {
        switch (this.type) {
            case 'cabinet':
                this.width = 60;
                this.height = 100;
                break;
            case 'chair':
                this.width = 50;
                this.height = 70;
                break;
            case 'monitor':
                this.width = 40;
                this.height = 40;
                break;
            case 'printer':
                this.width = 80;
                this.height = 60;
                break;
            default:
                this.width = 50;
                this.height = 80;
        }
    }

    getColor() {
        switch (this.type) {
            case 'cabinet':
                return '#8B4513'; // Brown
            case 'chair':
                return '#1B1B1B'; // Dark gray
            case 'monitor':
                return '#4A4A4A'; // Gray
            case 'printer':
                return '#2C3E50'; // Dark blue-gray
            default:
                return '#e74c3c';
        }
    }

    update() {
        this.x -= this.speed;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add some details to make obstacles more recognizable
        switch (this.type) {
            case 'cabinet':
                // Draw handles
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(this.x + this.width - 10, this.y + 20, 5, 20);
                ctx.fillRect(this.x + this.width - 10, this.y + 60, 5, 20);
                break;
            case 'monitor':
                // Draw screen
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 15);
                // Draw stand
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + (this.width/2) - 5, this.y + this.height - 15, 10, 15);
                break;
            case 'printer':
                // Draw paper tray
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x + 5, this.y + 10, this.width - 10, 5);
                break;
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    isOffscreen() {
        return this.x + this.width < 0;
    }
}

class ObstacleManager {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.obstacles = [];
        this.minDistance = 300; // Minimum distance between obstacles
        this.lastObstacleX = gameWidth;
        this.obstacleTypes = ['cabinet', 'chair', 'monitor', 'printer'];
        this.spawnTimer = 0;
        this.spawnInterval = 120; // Frames between obstacle spawns
    }

    update() {
        // Update existing obstacles
        this.obstacles.forEach(obstacle => obstacle.update());
        
        // Remove offscreen obstacles
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.isOffscreen());

        // Spawn new obstacles
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
        }
    }

    render(ctx) {
        this.obstacles.forEach(obstacle => obstacle.render(ctx));
    }

    spawnObstacle() {
        if (this.obstacles.length > 0) {
            const lastObstacle = this.obstacles[this.obstacles.length - 1];
            if (this.gameWidth - lastObstacle.x < this.minDistance) {
                return;
            }
        }

        const type = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        const tempObstacle = new Obstacle(0, 0, type);
        
        // Calculate y position based on obstacle type
        let y;
        switch (type) {
            case 'monitor':
                y = Math.random() * (this.gameHeight - 200) + 50; // Flying monitors!
                break;
            case 'cabinet':
                y = this.gameHeight - tempObstacle.height; // Always on ground
                break;
            default:
                y = this.gameHeight - tempObstacle.height - Math.random() * 100;
        }

        const obstacle = new Obstacle(this.gameWidth, y, type);
        this.obstacles.push(obstacle);
    }

    checkCollision(player) {
        return this.obstacles.some(obstacle => {
            const playerBounds = player.getBounds();
            const obstacleBounds = obstacle.getBounds();
            return checkCollision(playerBounds, obstacleBounds);
        });
    }

    reset() {
        this.obstacles = [];
        this.spawnTimer = 0;
    }
}