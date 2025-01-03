class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.velocity = 0;
        this.gravity = 0.5;
        this.jumpForce = -10;
    }

    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;

        // Basic boundary checking
        if (this.y + this.height > 600) {
            this.y = 600 - this.height;
            this.velocity = 0;
        }
    }

    jump() {
        this.velocity = this.jumpForce;
    }

    render(ctx) {
        ctx.fillStyle = '#3498db';
        ctx.fillRect(this.x, this.y, this.width, this.height);
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