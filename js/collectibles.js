class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;
        this.speed = 5;
        this.active = true;
        this.setProperties();
    }

    setProperties() {
        switch (this.type) {
            case 'coffee':
                this.color = '#6F4E37'; // Coffee brown
                this.points = 10;
                this.effect = 'speed';
                this.duration = 5000; // 5 seconds
                break;
            case 'paperclip':
                this.color = '#C0C0C0'; // Silver
                this.points = 5;
                this.width = 20;
                this.height = 25;
                break;
            case 'stapler':
                this.color = '#FF0000'; // Red
                this.points = 15;
                this.width = 35;
                this.height = 25;
                this.effect = 'invincible';
                this.duration = 3000; // 3 seconds
                break;
            case 'sticky_note':
                this.color = '#FFFF00'; // Yellow
                this.points = 20;
                this.width = 25;
                this.height = 25;
                this.effect = 'double_points';
                this.duration = 4000; // 4 seconds
                break;
        }
    }

    update() {
        this.x -= this.speed;
    }

    render(ctx) {
        if (!this.active) return;

        ctx.fillStyle = this.color;
        
        switch (this.type) {
            case 'coffee':
                // Draw coffee cup
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x + 3, this.y + 3, this.width - 6, this.height - 6);
                // Draw handle
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x + this.width - 5, this.y + 5, 8, 15);
                break;
                
            case 'paperclip':
                // Draw paperclip shape
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.x + 5, this.y + 5);
                ctx.lineTo(this.x + 5, this.y + 20);
                ctx.lineTo(this.x + 15, this.y + 20);
                ctx.lineTo(this.x + 15, this.y + 5);
                ctx.stroke();
                break;
                
            case 'stapler':
                // Draw stapler base
                ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
                // Draw top part
                ctx.fillStyle = '#800000';
                ctx.fillRect(this.x, this.y, this.width, 10);
                break;
                
            case 'sticky_note':
                // Draw sticky note
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // Draw lines
                ctx.strokeStyle = '#FFB700';
                ctx.lineWidth = 1;
                for (let i = 5; i < this.height; i += 5) {
                    ctx.beginPath();
                    ctx.moveTo(this.x + 2, this.y + i);
                    ctx.lineTo(this.x + this.width - 2, this.y + i);
                    ctx.stroke();
                }
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

    collect() {
        this.active = false;
        return {
            points: this.points,
            effect: this.effect,
            duration: this.duration
        };
    }
}

class CollectibleManager {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.collectibles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 180; // Frames between collectible spawns
        this.collectibleTypes = ['coffee', 'paperclip', 'stapler', 'sticky_note'];
        this.minDistance = 200; // Minimum distance between collectibles
    }

    update() {
        // Update existing collectibles
        this.collectibles.forEach(collectible => collectible.update());
        
        // Remove inactive and offscreen collectibles
        this.collectibles = this.collectibles.filter(c => c.active && !c.isOffscreen());

        // Spawn new collectibles
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnCollectible();
            this.spawnTimer = 0;
        }
    }

    render(ctx) {
        this.collectibles.forEach(collectible => collectible.render(ctx));
    }

    spawnCollectible() {
        if (this.collectibles.length > 0) {
            const lastCollectible = this.collectibles[this.collectibles.length - 1];
            if (this.gameWidth - lastCollectible.x < this.minDistance) {
                return;
            }
        }

        const type = this.collectibleTypes[Math.floor(Math.random() * this.collectibleTypes.length)];
        const y = Math.random() * (this.gameHeight - 100) + 50; // Keep away from floor and ceiling
        const collectible = new Collectible(this.gameWidth, y, type);
        this.collectibles.push(collectible);
    }

    checkCollisions(player) {
        for (let collectible of this.collectibles) {
            if (collectible.active && checkCollision(player.getBounds(), collectible.getBounds())) {
                return collectible.collect();
            }
        }
        return null;
    }

    reset() {
        this.collectibles = [];
        this.spawnTimer = 0;
    }
}