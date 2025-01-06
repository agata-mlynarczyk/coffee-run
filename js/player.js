class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.velocity = 0;
        this.gravity = 0.5;
        this.jumpForce = -10;
        this.speed = 1;
        this.isInvincible = false;
        this.baseX = x;  // Store the base x position
        this.speedBoostDistance = 0;  // Track distance moved during speed boost
        this.powerUps = {
            speed: { active: false, duration: 0, targetScore: 0 },
            invincible: { active: false, duration: 0 },
            magnet: { active: false, duration: 0, range: 300 },
            double_points: { active: false, duration: 0 }
        };
    }

    update(deltaTime = 16.67, currentScore = 0) { // Default to 60 FPS if not provided
        this.velocity += this.gravity;  // Gravity isn't affected by speed boost
        this.y += this.velocity;

        // Basic boundary checking
        if (this.y + this.height > 600) {
            this.y = 600 - this.height;
            this.velocity = 0;
        }

        // Handle speed boost movement
        if (this.powerUps.speed.active) {
            if (currentScore < this.powerUps.speed.targetScore) {
                // Move forward quickly
                this.x = this.baseX + Math.sin(Date.now() / 100) * 10 + 50;  // Add wobble effect
                this.speedBoostDistance += 5;  // Track distance for score calculation
            } else {
                // Reset position and end speed boost
                this.x = this.baseX;
                this.powerUps.speed.active = false;
                this.speedBoostDistance = 0;
            }
        } else {
            this.x = this.baseX;  // Maintain base position when not boosting
        }

        // Update power-ups
        this.updatePowerUps(deltaTime);
    }

    jump() {
        this.velocity = this.jumpForce * this.speed;
        window.audioManager.playSound('jump');
    }

    render(ctx) {
        // Draw robot body
        ctx.fillStyle = '#3498db';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw robot eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 8, this.y + 10, 8, 8);
        ctx.fillRect(this.x + 24, this.y + 10, 8, 8);
        
        // Draw antenna
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width/2, this.y - 10);
        ctx.stroke();
        
        // Draw power-up effects
        if (this.powerUps.invincible.active) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }
        
        // Draw magnetic field indicator
        if (this.powerUps.magnet.active) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(138, 43, 226, 0.3)';
            ctx.lineWidth = 2;
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.powerUps.magnet.range, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw magnetic waves
            const time = Date.now() / 200;
            for (let i = 0; i < 3; i++) {
                const radius = 20 + i * 15 + Math.sin(time + i) * 5;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(138, 43, 226, ${0.5 - i * 0.15})`;
                ctx.stroke();
            }
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

    applyPowerUp(effect, duration, currentScore = 0) {
        if (!effect) return;
        
        if (this.powerUps[effect]) {
            this.powerUps[effect].active = true;
            this.powerUps[effect].duration = duration;

            // Apply immediate effects
            switch (effect) {
                case 'speed':
                    // Set target score 50 points higher than current
                    this.powerUps[effect].targetScore = currentScore + 50;
                    break;
                case 'invincible':
                    // Invincibility is handled through powerUps.invincible.active
                    break;
            }
        }
    }

    updatePowerUps(deltaTime) {
        for (const [effect, powerUp] of Object.entries(this.powerUps)) {
            if (powerUp.active) {
                powerUp.duration -= deltaTime;
                
                if (powerUp.duration <= 0) {
                    powerUp.active = false;
                    
                    // Reset effects
                    switch (effect) {
                        case 'speed':
                            this.speed = 1;
                            break;
                        case 'invincible':
                            // Invincibility is handled through powerUps.invincible.active
                            break;
                    }
                }
            }
        }
    }
}