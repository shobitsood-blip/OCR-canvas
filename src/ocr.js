// OCR functionality using Tesseract.js

class OCRProcessor {
    constructor() {
        this.worker = null;
        this.isProcessing = false;

        this.progressBar = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressContainer = document.getElementById('ocrProgress');
        this.resultsPanel = document.getElementById('resultsPanel');
        this.ocrText = document.getElementById('ocrText');
        this.confidenceValue = document.getElementById('confidenceValue');
    }

    async initialize() {
        if (this.worker) return;

        try {
            this.updateProgress(0, 'Loading OCR engine...');

            // Create worker using Tesseract.js v5 API
            this.worker = await Tesseract.createWorker('eng', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        this.updateProgress(20 + progress * 0.7, `Recognizing text... ${progress}%`);
                    }
                }
            });

            this.updateProgress(100, 'OCR engine ready');

        } catch (error) {
            console.error('Failed to initialize OCR:', error);
            showToast('Failed to initialize OCR engine', 'error');
            throw error;
        }
    }

    /**
     * Preprocess image to improve OCR accuracy for colored text
     * Converts to grayscale and enhances contrast
     */
    preprocessImage(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert to grayscale and invert if needed (for dark backgrounds)
        let darkPixels = 0;
        let lightPixels = 0;

        // First pass: analyze if background is dark or light
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            if (gray < 128) darkPixels++;
            else lightPixels++;
        }

        const shouldInvert = darkPixels > lightPixels;

        // Second pass: convert to grayscale, optionally invert, and enhance contrast
        for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale using luminance formula
            let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            // Invert if background is dark (makes text dark on light background)
            if (shouldInvert) {
                gray = 255 - gray;
            }

            // Enhance contrast using simple thresholding with smoothing
            // This helps separate text from background
            if (gray < 100) {
                gray = Math.max(0, gray - 30); // Darken dark pixels
            } else if (gray > 155) {
                gray = Math.min(255, gray + 30); // Lighten light pixels
            }

            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
            // Alpha (data[i + 3]) stays unchanged
        }

        // Apply the processed image data
        ctx.putImageData(imageData, 0, 0);

        return canvas;
    }

    async processImage(imageSource) {
        if (this.isProcessing) {
            showToast('OCR is already processing', 'warning');
            return null;
        }

        this.isProcessing = true;
        this.showProgress();
        this.resultsPanel.classList.add('open');

        try {
            // Initialize worker if needed
            await this.initialize();

            this.updateProgress(10, 'Preprocessing image for better accuracy...');

            // Get image data and preprocess
            let processedImage;
            if (imageSource instanceof HTMLCanvasElement) {
                // Create a copy to preprocess without affecting original
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imageSource.width;
                tempCanvas.height = imageSource.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(imageSource, 0, 0);

                // Preprocess for better OCR
                this.preprocessImage(tempCanvas);
                processedImage = tempCanvas.toDataURL('image/png');
            } else if (typeof imageSource === 'string') {
                // If it's a data URL, we need to load it into a canvas first
                processedImage = await this.preprocessDataURL(imageSource);
            } else {
                throw new Error('Invalid image source');
            }

            this.updateProgress(20, 'Starting text recognition...');

            // Perform OCR on preprocessed image
            const result = await this.worker.recognize(processedImage);

            this.updateProgress(100, 'Complete!');

            // Display results
            this.displayResults(result);

            return result;

        } catch (error) {
            console.error('OCR processing failed:', error);
            showToast('Failed to extract text', 'error');
            this.ocrText.value = 'Error: Could not extract text from image.';
            return null;

        } finally {
            this.isProcessing = false;
            setTimeout(() => this.hideProgress(), 1000);
        }
    }

    /**
     * Preprocess a data URL image
     */
    async preprocessDataURL(dataURL) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Preprocess
                this.preprocessImage(canvas);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = dataURL;
        });
    }

    displayResults(result) {
        const text = result.data.text.trim();
        const confidence = Math.round(result.data.confidence);

        this.ocrText.value = text || 'No text detected in the image.';
        this.ocrText.readOnly = false; // Allow editing

        this.confidenceValue.textContent = `${confidence}%`;

        // Color code confidence
        if (confidence >= 80) {
            this.confidenceValue.style.color = '#10b981'; // Green
        } else if (confidence >= 60) {
            this.confidenceValue.style.color = '#f59e0b'; // Yellow
        } else {
            this.confidenceValue.style.color = '#ef4444'; // Red
        }

        if (text) {
            showToast(`Extracted ${text.split(/\s+/).length} words`, 'success');
        } else {
            showToast('No text found in image', 'warning');
        }
    }

    showProgress() {
        this.progressContainer.classList.add('active');
        this.updateProgress(0, 'Initializing...');
    }

    hideProgress() {
        this.progressContainer.classList.remove('active');
    }

    updateProgress(percent, message) {
        this.progressBar.style.width = `${percent}%`;
        this.progressText.textContent = message;
    }

    getText() {
        return this.ocrText.value;
    }

    copyText() {
        const text = this.getText();
        if (!text || text === 'No text detected in the image.') {
            showToast('No text to copy', 'warning');
            return;
        }

        copyToClipboard(text).then(success => {
            if (success) {
                showToast('Text copied to clipboard', 'success');
            } else {
                showToast('Failed to copy text', 'error');
            }
        });
    }

    saveText() {
        const text = this.getText();
        if (!text || text === 'No text detected in the image.') {
            showToast('No text to save', 'warning');
            return;
        }

        const filename = `ocr-text-${getTimestamp()}.txt`;
        downloadFile(text, filename, 'text/plain');
        showToast('Text file saved', 'success');
    }

    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
}

// Global OCR processor instance
let ocrProcessor;

document.addEventListener('DOMContentLoaded', () => {
    ocrProcessor = new OCRProcessor();
});
