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
                this.effect = 'magnet';
                this.duration = 10000; // 10 seconds
                this.magnetRange = 300; // Magnetic pull range in pixels
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

    update(player) {
        // Default movement
        this.x -= this.speed;

        // Apply magnetic pull if player has magnet effect
        if (player.powerUps && player.powerUps.magnet && player.powerUps.magnet.active) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only pull if collectible is in front of the player and within range
            if (distance <= player.powerUps.magnet.range && dx < 0) {
                // Calculate pull strength (stronger when closer)
                const pullStrength = (1 - distance / player.powerUps.magnet.range) * 3;
                
                // Apply pull effect
                this.x += (dx / distance) * pullStrength;
                this.y += (dy / distance) * pullStrength;
            }
        }
    }

    render(ctx) {
        if (!this.active) return;

        const img = window.imageLoader.getImage(this.type);
        if (!img) return;

        // Add animations and effects based on collectible type
        ctx.save();
        
        // Common shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 2;

        // Calculate common animation values
        const time = Date.now();
        const floatOffset = Math.sin(time / 800) * 3;
        const rotationAngle = Math.sin(time / 1000) * Math.PI / 16;

        // Apply transformations based on type
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        switch (this.type) {
            case 'paperclip':
                // More rotation for paperclip
                ctx.rotate(rotationAngle * 1.5);
                break;
            case 'coffee':
                // Gentle wobble
                ctx.rotate(rotationAngle * 0.5);
                break;
            case 'stapler':
                // Minimal movement
                ctx.rotate(rotationAngle * 0.3);
                break;
            case 'notebook':
                // Pages flutter effect
                ctx.rotate(Math.sin(time / 1200) * Math.PI / 32);
                break;
        }

        // Draw the image
        ctx.drawImage(
            img,
            -this.width/2,
            -this.height/2 + floatOffset,
            this.width,
            this.height
        );

        // Add shine effect
        const gradient = ctx.createLinearGradient(
            -this.width/2, -this.height/2,
            this.width/2, this.height/2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

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

    update(player) {
        // Update existing collectibles
        this.collectibles.forEach(collectible => collectible.update(player));
        
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