class Obstacle {
    constructor(x, y, type, speed = 5) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = speed;
        this.setDimensions();
        this.color = this.getColor();
    }

    setDimensions() {
        switch (this.type) {
            case 'cabinet':
                this.width = 120;    // 60 * 2
                this.height = 200;   // 100 * 2
                break;
            case 'chair':
                this.width = 100;    // 50 * 2
                this.height = 140;   // 70 * 2
                break;
            case 'monitor':
                this.width = 80;     // 40 * 2
                this.height = 80;    // 40 * 2
                break;
            case 'printer':
                this.width = 160;    // 80 * 2
                this.height = 120;   // 60 * 2
                break;
            default:
                this.width = 100;    // 50 * 2
                this.height = 160;   // 80 * 2
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
        if (!window.imageLoader) {
            console.error('Image loader not initialized');
            return;
        }
        const img = window.imageLoader.getImage(this.type);
        if (!img) {
            console.warn(`Image not found for obstacle type: ${this.type}`);
            // Fallback rendering
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        ctx.save();
        
        // Add shadow for all obstacles
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 3;

        // Calculate animation values
        const time = Date.now();
        let translateY = 0;
        let rotation = 0;

        // Apply type-specific animations
        switch (this.type) {
            case 'monitor':
                // Floating monitor with wobble
                translateY = Math.sin(time / 500) * 5;
                rotation = Math.sin(time / 800) * 0.1;
                break;
            case 'chair':
                // Slight rolling effect
                rotation = Math.sin(time / 1000) * 0.05;
                break;
            case 'printer':
                // Gentle hover
                translateY = Math.sin(time / 600) * 2;
                break;
            case 'cabinet':
                // Subtle shake
                translateY = Math.sin(time / 400) * 1;
                break;
        }

        // Apply transformations
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(rotation);
        ctx.translate(-this.width/2, -this.height/2 + translateY);

        // Draw the obstacle
        ctx.drawImage(img, 0, 0, this.width, this.height);

        // Add shine effect
        const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.restore();
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
        this.minDistance = 400; // Increased from 300 to 400 to account for larger obstacles
        this.lastObstacleX = gameWidth;
        this.obstacleTypes = ['cabinet', 'chair', 'monitor', 'printer'];
        this.spawnTimer = 0;
        this.spawnInterval = 120; // Frames between obstacle spawns
    }

    update(currentSpeed) {
        // Update existing obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.speed = currentSpeed;
            obstacle.update();
        });
        
        // Remove offscreen obstacles
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.isOffscreen());

        // Spawn new obstacles
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnObstacle(currentSpeed);
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