// Utility functions for the OCR Canvas app

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'warning', 'error'
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Download a file
 * @param {string} content - File content (data URL or text)
 * @param {string} filename - Name for the downloaded file
 * @param {string} type - MIME type
 */
function downloadFile(content, filename, type = 'text/plain') {
    const link = document.createElement('a');
    
    if (content.startsWith('data:')) {
        link.href = content;
    } else {
        const blob = new Blob([content], { type });
        link.href = URL.createObjectURL(blob);
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (!content.startsWith('data:')) {
        URL.revokeObjectURL(link.href);
    }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Load an image from a File or URL
 * @param {File|string} source - Image source
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(source) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        
        if (source instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(source);
        } else {
            img.src = source;
        }
    });
}

/**
 * Get current timestamp for filenames
 * @returns {string}
 */
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if running on mobile device
 * @returns {boolean}
 */
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get local IP address instructions
 */
function getShareInstructions() {
    return `To share this app on your local network:
1. Find your computer's local IP address
   - On Mac: System Preferences > Network > Your IP (e.g., 192.168.1.x)
   - On Windows: Open CMD and type 'ipconfig'
2. Start a local server (if not already running)
3. Share the URL: http://YOUR_IP:PORT with family/friends`;
}
