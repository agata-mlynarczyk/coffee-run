class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;
        this.speed = 3;
    }

    update() {
        this.x -= this.speed;
    }

    render(ctx) {
        ctx.fillStyle = '#f1c40f';
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