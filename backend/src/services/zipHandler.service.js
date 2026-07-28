const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const { parseResiPDF } = require('./pdfParser.service');

/**
 * Extract ZIP file dan parse semua PDF di dalamnya
 * @param {string} zipFilePath 
 * @returns {Promise<object>}
 */
async function extractAndParseZip(zipFilePath) {
  try {
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    // Filter hanya file PDF
    const pdfEntries = zipEntries.filter(entry => 
      entry.name.toLowerCase().endsWith('.pdf') && !entry.isDirectory
    );

    if (pdfEntries.length === 0) {
      throw new Error('Tidak ada file PDF ditemukan dalam ZIP');
    }

    // Extract semua PDF ke folder temporary
    const tempDir = path.join(path.dirname(zipFilePath), 'temp_' + Date.now());
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const results = [];
    const errors = [];

    for (const entry of pdfEntries) {
      try {
        const fileName = path.basename(entry.name);
        const filePath = path.join(tempDir, fileName);

        // Extract file
        fs.writeFileSync(filePath, entry.getData());

        // Parse PDF
        const parsed = await parseResiPDF(filePath);
        // parsed is array (multi-resi support) — flatten
        for (const resiData of parsed) {
          results.push({
            file: fileName,
            data: resiData,
            status: 'success'
          });
        }

        // Cleanup individual PDF setelah parsing
        fs.unlinkSync(filePath);

      } catch (err) {
        errors.push({
          file: entry.name,
          error: err.message,
          status: 'failed'
        });
      }
    }

    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    return {
      total: pdfEntries.length,
      success: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    };

  } catch (error) {
    console.error('Error extracting ZIP:', error);
    throw new Error('Gagal memproses file ZIP: ' + error.message);
  }
}

module.exports = { extractAndParseZip };
