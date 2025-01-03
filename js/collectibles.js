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
                this.duration = 8000; // 8 seconds
                break;
            case 'paperclip':
                this.color = '#A9B0BB'; // Silver-blue
                this.points = 5;
                this.width = 30;
                this.height = 30;
                break;
            case 'stapler':
                this.color = '#FF0000'; // Red
                this.points = 15;
                this.width = 35;
                this.height = 25;
                this.effect = 'invincible';
                this.duration = 6000; // 6 seconds
                break;
            case 'notebook':
                this.color = '#DAA520'; // Golden brown
                this.points = 20;
                this.width = 40;
                this.height = 40;
                this.effect = 'double_points';
                this.duration = 7000; // 7 seconds
                break;
        }
    }

    update() {
        this.x -= this.speed;
    }

    render(ctx) {
        if (!this.active) return;

        switch (this.type) {
            case 'paperclip':
                const paperclipImg = window.imageLoader.getImage('paperclip');
                if (paperclipImg) {
                    // Add a gentle rotation animation
                    const angle = Math.sin(Date.now() / 1000) * Math.PI / 16;
                    const floatOffset = Math.sin(Date.now() / 800) * 3;
                    
                    ctx.save();
                    
                    // Create metallic shine effect
                    const gradient = ctx.createLinearGradient(
                        this.x, this.y,
                        this.x + this.width, this.y + this.height
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
                    
                    // Apply transformations
                    ctx.translate(this.x + this.width/2, this.y + this.height/2 + floatOffset);
                    ctx.rotate(angle);
                    
                    // Draw shadow
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                    ctx.shadowBlur = 3;
                    ctx.shadowOffsetY = 2;
                    
                    // Draw paperclip
                    ctx.drawImage(
                        paperclipImg,
                        -this.width/2, -this.height/2,
                        this.width, this.height
                    );
                    
                    // Add shine
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.fillStyle = gradient;
                    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                    
                    ctx.restore();
                }
                break;
                
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
                
            case 'stapler':
                // Draw stapler base
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
                // Draw top part
                ctx.fillStyle = '#800000';
                ctx.fillRect(this.x, this.y, this.width, 10);
                break;
                
            case 'notebook':
                const notebookImg = window.imageLoader.getImage('notebook');
                if (notebookImg) {
                    // Add a gentle floating animation
                    const floatOffset = Math.sin(Date.now() / 800) * 4;
                    const rotationAngle = Math.sin(Date.now() / 1200) * Math.PI / 32;
                    
                    ctx.save();
                    
                    // Apply transformations
                    ctx.translate(this.x + this.width/2, this.y + this.height/2);
                    ctx.rotate(rotationAngle);
                    
                    // Draw shadow
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetY = 2;
                    
                    // Draw the notebook
                    ctx.drawImage(
                        notebookImg,
                        -this.width/2,
                        -this.height/2 + floatOffset,
                        this.width,
                        this.height
                    );
                    
                    // Add page shine effect
                    const gradient = ctx.createLinearGradient(
                        -this.width/2, -this.height/2,
                        this.width/2, this.height/2
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                    
                    ctx.restore();
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
        this.collectibleTypes = ['coffee', 'paperclip', 'stapler', 'notebook'];
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