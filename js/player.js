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
    }

    update() {
        this.velocity += this.gravity * this.speed;
        this.y += this.velocity;

        // Basic boundary checking
        if (this.y + this.height > 600) {
            this.y = 600 - this.height;
            this.velocity = 0;
        }
    }

    jump() {
        this.velocity = this.jumpForce * this.speed;
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
        
        // Draw power-up glow for invincibility
        if (this.isInvincible) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
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
}