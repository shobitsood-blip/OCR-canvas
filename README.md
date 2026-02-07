# OCR Canvas

A web-based OCR (Optical Character Recognition) application with drawing capabilities. Upload or paste images, annotate them with various drawing tools, and extract text using Tesseract.js.

## Features

- 📷 **Image Upload** - Upload images, paste from clipboard, or drag & drop
- 🎨 **Drawing Tools** - Brush, pen, highlighter, and eraser
- 🎯 **Color Picker** - 8 preset colors + custom color picker
- 📝 **OCR** - Extract text from images using Tesseract.js
- 💾 **Save Options** - Save images as PNG, copy/save extracted text
- 📱 **Mobile Friendly** - Works on phones and tablets
- ⌨️ **Keyboard Shortcuts** - B (brush), P (pen), M (marker), E (eraser), Ctrl+Z (undo)

## Getting Started

### Run Locally

Since this is a pure HTML/CSS/JS app, you can serve it with any static file server:

**Option 1: Python (built into macOS)**
```bash
cd zonal-corona
python3 -m http.server 8080
```
Then open http://localhost:8080

**Option 2: PHP (if installed)**
```bash
cd zonal-corona
php -S localhost:8080
```

**Option 3: Use VS Code Live Server extension**

### Share with Family/Friends

1. Start the server (see above)
2. Find your local IP address:
   - On Mac: System Preferences → Network → Your IP (e.g., 192.168.1.x)
   - Or run: `ipconfig getifaddr en0`
3. Share the URL: `http://YOUR_IP:8080`
4. Anyone on the same WiFi network can access the app!

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| B | Brush tool |
| P | Pen tool |
| M | Marker/Highlighter |
| E | Eraser |
| [ | Decrease brush size |
| ] | Increase brush size |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+S | Save image |

## Technology Stack

- HTML5 Canvas for drawing
- Tesseract.js v5 for OCR
- Pure CSS with dark theme
- PWA support for mobile installation

## License

MIT
