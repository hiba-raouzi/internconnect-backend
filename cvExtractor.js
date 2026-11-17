const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { createWorker } = require('tesseract.js');

async function extractPdfText(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error('Fichier PDF introuvable');
    }

    // 1. Essayer d'abord l'extraction classique du texte PDF
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfjsPath = require.resolve('pdfjs-dist/legacy/build/pdf.mjs');
    const standardFonts = path.resolve(
        path.dirname(pdfjsPath),
        '../../standard_fonts/'
    );

    const data = new Uint8Array(fs.readFileSync(filePath));

    const pdfDocument = await pdfjsLib.getDocument({
        data,
        standardFontDataUrl: pathToFileURL(standardFonts + path.sep).href
    }).promise;

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str || '').join(' ') + '\n';
    }

    // 2. Si aucun texte n'est trouvé, utiliser l'OCR
    if (fullText.trim().length > 20) {
        return fullText.trim();
    }

    console.log('PDF image détecté : lancement OCR...');

    const { pdf } = await import('pdf-to-img');
    const document = await pdf(filePath, { scale: 3 });

    const worker = await createWorker('fra+eng');

    try {
        let ocrText = '';

        for await (const pageImage of document) {
            const result = await worker.recognize(pageImage);
            ocrText += result.data.text + '\n';
        }

        return ocrText.trim();
    } finally {
        await worker.terminate();
    }
}

module.exports = { extractPdfText };
