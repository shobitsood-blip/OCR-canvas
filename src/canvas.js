// Canvas management for the OCR Canvas app

class CanvasManager {
    constructor() {
        this.container = document.getElementById('canvasContainer');
        this.bgCanvas = document.getElementById('backgroundCanvas');
        this.drawCanvas = document.getElementById('drawingCanvas');
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.drawCtx = this.drawCanvas.getContext('2d');

        this.backgroundImage = null;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        this.dpr = window.devicePixelRatio || 1;

        this.init();
    }

    init() {
        this.resizeCanvases();
        window.addEventListener('resize', debounce(() => this.resizeCanvases(), 100));
        this.saveState();
    }

    resizeCanvases() {
        const rect = this.container.getBoundingClientRect();
        this.dpr = window.devicePixelRatio || 1;

        // Set display size (CSS pixels)
        this.bgCanvas.style.width = `${rect.width}px`;
        this.bgCanvas.style.height = `${rect.height}px`;
        this.drawCanvas.style.width = `${rect.width}px`;
        this.drawCanvas.style.height = `${rect.height}px`;

        // Set actual size in memory (device pixels for retina)
        this.bgCanvas.width = rect.width * this.dpr;
        this.bgCanvas.height = rect.height * this.dpr;
        this.drawCanvas.width = rect.width * this.dpr;
        this.drawCanvas.height = rect.height * this.dpr;

        // Scale context so we can use CSS pixel coordinates
        this.bgCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.drawCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        // Restore background image if exists
        if (this.backgroundImage) {
            this.drawBackgroundImage();
        }
    }

    setBackgroundImage(img) {
        this.backgroundImage = img;
        this.drawBackgroundImage();
        document.getElementById('dropZone').classList.add('hidden');
    }

    drawBackgroundImage() {
        if (!this.backgroundImage) return;

        const rect = this.container.getBoundingClientRect();
        const imgAspect = this.backgroundImage.width / this.backgroundImage.height;
        const canvasAspect = rect.width / rect.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspect > canvasAspect) {
            drawWidth = rect.width;
            drawHeight = rect.width / imgAspect;
            offsetX = 0;
            offsetY = (rect.height - drawHeight) / 2;
        } else {
            drawHeight = rect.height;
            drawWidth = rect.height * imgAspect;
            offsetX = (rect.width - drawWidth) / 2;
            offsetY = 0;
        }

        this.bgCtx.fillStyle = '#1a1a2e';
        this.bgCtx.fillRect(0, 0, rect.width, rect.height);
        this.bgCtx.drawImage(this.backgroundImage, offsetX, offsetY, drawWidth, drawHeight);
    }

    clearDrawing() {
        const rect = this.container.getBoundingClientRect();
        // Ensure transform is set correctly
        this.drawCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.drawCtx.clearRect(0, 0, rect.width, rect.height);
        this.saveState();
    }

    clearAll() {
        const rect = this.container.getBoundingClientRect();

        // Clear background canvas
        this.bgCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.bgCtx.fillStyle = '#1a1a2e';
        this.bgCtx.fillRect(0, 0, rect.width, rect.height);

        // Clear drawing canvas
        this.drawCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.drawCtx.clearRect(0, 0, rect.width, rect.height);

        this.backgroundImage = null;
        document.getElementById('dropZone').classList.remove('hidden');
        this.history = [];
        this.historyIndex = -1;
        this.saveState();
    }

    saveState() {
        const imageData = this.drawCtx.getImageData(0, 0, this.drawCanvas.width, this.drawCanvas.height);

        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add new state
        this.history.push(imageData);
        this.historyIndex++;

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            // Need to reset transform before putImageData
            this.drawCtx.setTransform(1, 0, 0, 1, 0, 0);
            this.drawCtx.putImageData(this.history[this.historyIndex], 0, 0);
            // Restore transform for future drawing
            this.drawCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            // Need to reset transform before putImageData
            this.drawCtx.setTransform(1, 0, 0, 1, 0, 0);
            this.drawCtx.putImageData(this.history[this.historyIndex], 0, 0);
            // Restore transform for future drawing
            this.drawCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            return true;
        }
        return false;
    }

    getCompositeImage() {
        const rect = this.container.getBoundingClientRect();

        // Create a temporary canvas to merge both layers
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.bgCanvas.width;
        tempCanvas.height = this.bgCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw background canvas
        tempCtx.drawImage(this.bgCanvas, 0, 0);

        // Draw the drawing canvas on top
        tempCtx.drawImage(this.drawCanvas, 0, 0);

        return tempCanvas;
    }

    getImageDataURL(format = 'image/png', quality = 0.9) {
        const composite = this.getCompositeImage();
        return composite.toDataURL(format, quality);
    }

    getCanvasBlob(format = 'image/png', quality = 0.9) {
        return new Promise((resolve) => {
            const composite = this.getCompositeImage();
            composite.toBlob(resolve, format, quality);
        });
    }
}

// Global canvas manager instance
let canvasManager;

document.addEventListener('DOMContentLoaded', () => {
    canvasManager = new CanvasManager();
});
