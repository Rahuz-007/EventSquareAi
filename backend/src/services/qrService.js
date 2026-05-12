const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const qrDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });
    return qrDataURL;
  } catch (error) {
    throw new Error(`QR generation failed: ${error.message}`);
  }
};

const generateQRCodeBuffer = async (data) => {
  return await QRCode.toBuffer(data, { width: 300, errorCorrectionLevel: 'H' });
};

module.exports = { generateQRCode, generateQRCodeBuffer };
