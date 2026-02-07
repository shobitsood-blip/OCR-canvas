// Main application initialization and event handling

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    bindImageUpload();
    bindHeaderActions();
    bindCanvasActions();
    bindResultsActions();
    bindKeyboardShortcuts();
    bindPasteHandler();

    console.log('OCR Canvas app initialized');
}

// ===== Image Upload Handling =====
function bindImageUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const canvasContainer = document.getElementById('canvasContainer');

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
        }
    });

    // Upload button click
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Hide drop zone when clicking on canvas
    canvasContainer.addEventListener('mousedown', () => {
        dropZone.classList.add('hidden');
    });

    canvasContainer.addEventListener('touchstart', () => {
        dropZone.classList.add('hidden');
    });

    // Drag and drop on the whole container
    canvasContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.remove('hidden');
        dropZone.classList.add('active');
    });

    canvasContainer.addEventListener('dragleave', (e) => {
        // Only hide if leaving the container
        if (!canvasContainer.contains(e.relatedTarget)) {
            dropZone.classList.remove('active');
            dropZone.classList.add('hidden');
        }
    });

    canvasContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        dropZone.classList.add('hidden');

        const files = e.dataTransfer.files;
        if (files && files[0] && files[0].type.startsWith('image/')) {
            handleImageFile(files[0]);
        } else {
            showToast('Please drop an image file', 'warning');
        }
    });
}

function bindPasteHandler() {
    document.addEventListener('paste', async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    handleImageFile(file);
                }
                break;
            }
        }
    });
}

async function handleImageFile(file) {
    try {
        const img = await loadImage(file);
        canvasManager.setBackgroundImage(img);
        showToast('Image loaded successfully', 'success');
    } catch (error) {
        console.error('Failed to load image:', error);
        showToast('Failed to load image', 'error');
    }
}

// ===== Header Actions =====
function bindHeaderActions() {
    document.getElementById('undoBtn').addEventListener('click', () => {
        if (canvasManager.undo()) {
            showToast('Undo', 'success');
        }
    });

    document.getElementById('redoBtn').addEventListener('click', () => {
        if (canvasManager.redo()) {
            showToast('Redo', 'success');
        }
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        canvasManager.clearAll();
        showToast('Canvas cleared', 'success');
    });
}

// ===== Canvas Actions =====
function bindCanvasActions() {
    document.getElementById('extractBtn').addEventListener('click', async () => {
        const compositeCanvas = canvasManager.getCompositeImage();
        await ocrProcessor.processImage(compositeCanvas);
    });

    document.getElementById('saveImageBtn').addEventListener('click', () => {
        const dataUrl = canvasManager.getImageDataURL('image/png');
        const filename = `ocr-canvas-${getTimestamp()}.png`;
        downloadFile(dataUrl, filename);
        showToast('Image saved', 'success');
    });
}

// ===== Results Panel Actions =====
function bindResultsActions() {
    const resultsPanel = document.getElementById('resultsPanel');

    document.getElementById('closeResults').addEventListener('click', () => {
        resultsPanel.classList.remove('open');
    });

    document.getElementById('copyTextBtn').addEventListener('click', () => {
        ocrProcessor.copyText();
    });

    document.getElementById('saveTextBtn').addEventListener('click', () => {
        ocrProcessor.saveText();
    });
}

// ===== Keyboard Shortcuts =====
function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in text area
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? e.metaKey : e.ctrlKey;

        // Undo: Ctrl/Cmd + Z
        if (modKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (canvasManager.undo()) {
                showToast('Undo', 'success');
            }
        }

        // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
        if (modKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            if (canvasManager.redo()) {
                showToast('Redo', 'success');
            }
        }

        // Save: Ctrl/Cmd + S
        if (modKey && e.key === 's') {
            e.preventDefault();
            document.getElementById('saveImageBtn').click();
        }

        // Tool shortcuts
        switch (e.key.toLowerCase()) {
            case 'b':
                drawingTools.setTool('brush');
                showToast('Brush tool selected', 'success');
                break;
            case 'p':
                drawingTools.setTool('pen');
                showToast('Pen tool selected', 'success');
                break;
            case 'm':
                drawingTools.setTool('marker');
                showToast('Marker tool selected', 'success');
                break;
            case 'e':
                drawingTools.setTool('eraser');
                showToast('Eraser selected', 'success');
                break;
            case '[':
                if (drawingTools.brushSize > 1) {
                    drawingTools.setBrushSize(Math.max(1, drawingTools.brushSize - 2));
                }
                break;
            case ']':
                if (drawingTools.brushSize < 50) {
                    drawingTools.setBrushSize(Math.min(50, drawingTools.brushSize + 2));
                }
                break;
        }
    });
}
