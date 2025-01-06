class ImageLoader {
    constructor() {
        this.images = {};
        this.loadedImages = 0;
        this.totalImages = 0;
    }

    loadImage(name, src) {
        this.totalImages++;
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                this.loadedImages++;
                console.log(`Loaded image: ${name}`);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`Failed to load image: ${src}`, error);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
            console.log(`Attempting to load image: ${name} from ${src}`);
        });
    }

    getImage(name) {
        return this.images[name];
    }

    async loadAllImages() {
        const imageList = [
            // Collectibles
            { name: 'coffee', src: 'assets/images/collectibles/coffee.png' },
            { name: 'paperclip', src: 'assets/images/collectibles/paperclip.png' },
            { name: 'stapler', src: 'assets/images/collectibles/stapler.png' },
            { name: 'notebook', src: 'assets/images/collectibles/notebook.png' },
            // Obstacles
            { name: 'cabinet', src: 'assets/images/obstacles/cabinet.png' },
            { name: 'chair', src: 'assets/images/obstacles/chair.png' },
            { name: 'monitor', src: 'assets/images/obstacles/monitor.png' },
            { name: 'printer', src: 'assets/images/obstacles/printer.png' }
        ];

        console.log('Starting to load images...');
        
        const loadPromises = imageList.map(img => {
            return this.loadImage(img.name, img.src).catch(err => {
                console.warn(`Failed to load ${img.name}, will use fallback:`, err);
                return null;
            });
        });

        await Promise.all(loadPromises);
        console.log('Image loading complete. Available images:', Object.keys(this.images));
        return true;
    }
}

// Create a global instance
window.imageLoader = new ImageLoader();