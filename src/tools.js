// Drawing tools for the OCR Canvas app

class DrawingTools {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        // Tool settings
        this.currentTool = 'brush';
        this.currentColor = '#ffffff';
        this.brushSize = 8;
        this.opacity = 1;

        // Tool configurations
        this.tools = {
            brush: {
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: 'source-over',
                shadowBlur: 2,
                sizeMultiplier: 1
            },
            pen: {
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: 'source-over',
                shadowBlur: 0,
                sizeMultiplier: 0.5
            },
            marker: {
                lineCap: 'square',
                lineJoin: 'miter',
                globalCompositeOperation: 'multiply',
                shadowBlur: 0,
                sizeMultiplier: 2,
                opacityOverride: 0.4
            },
            eraser: {
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: 'destination-out',
                shadowBlur: 0,
                sizeMultiplier: 1.5
            }
        };

        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.bindToolButtons();
        this.bindColorButtons();
        this.bindSliders();
        this.bindCanvasEvents();
    }

    bindToolButtons() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });
    }

    bindColorButtons() {
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentColor = btn.dataset.color;
                document.getElementById('colorPicker').value = this.currentColor;
            });
        });

        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        });
    }

    bindSliders() {
        const sizeSlider = document.getElementById('brushSize');
        const sizeValue = document.getElementById('sizeValue');
        const opacitySlider = document.getElementById('brushOpacity');
        const opacityValue = document.getElementById('opacityValue');

        sizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            sizeValue.textContent = this.brushSize;
        });

        opacitySlider.addEventListener('input', (e) => {
            this.opacity = parseInt(e.target.value) / 100;
            opacityValue.textContent = e.target.value;
        });
    }

    bindCanvasEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => this.stopDrawing());
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const coords = this.getCanvasCoordinates(e);
        this.lastX = coords.x;
        this.lastY = coords.y;

        // Draw a dot for single clicks
        this.configureTool();
        this.ctx.beginPath();
        this.ctx.arc(coords.x, coords.y, this.getToolSize() / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    draw(e) {
        if (!this.isDrawing) return;

        const coords = this.getCanvasCoordinates(e);

        this.configureTool();

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.stroke();

        this.lastX = coords.x;
        this.lastY = coords.y;
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            // Save state for undo
            if (canvasManager) {
                canvasManager.saveState();
            }
        }
    }

    configureTool() {
        const tool = this.tools[this.currentTool];

        this.ctx.lineCap = tool.lineCap;
        this.ctx.lineJoin = tool.lineJoin;
        this.ctx.globalCompositeOperation = tool.globalCompositeOperation;
        this.ctx.lineWidth = this.getToolSize();

        if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = 'rgba(0,0,0,1)';
            this.ctx.fillStyle = 'rgba(0,0,0,1)';
        } else {
            const opacity = tool.opacityOverride || this.opacity;
            this.ctx.strokeStyle = this.hexToRgba(this.currentColor, opacity);
            this.ctx.fillStyle = this.hexToRgba(this.currentColor, opacity);
        }

        if (tool.shadowBlur > 0) {
            this.ctx.shadowBlur = tool.shadowBlur;
            this.ctx.shadowColor = this.currentColor;
        } else {
            this.ctx.shadowBlur = 0;
        }
    }

    getToolSize() {
        const tool = this.tools[this.currentTool];
        return this.brushSize * tool.sizeMultiplier;
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    setTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    }

    setColor(color) {
        this.currentColor = color;
        document.getElementById('colorPicker').value = color;
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
    }

    setBrushSize(size) {
        this.brushSize = size;
        document.getElementById('brushSize').value = size;
        document.getElementById('sizeValue').textContent = size;
    }
}

// Global drawing tools instance
let drawingTools;

document.addEventListener('DOMContentLoaded', () => {
    drawingTools = new DrawingTools();
});
