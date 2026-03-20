import QRCode from "qrcode";

/**
 * Generate QR code for a table
 * QR code contains the URL to start a session
 */
export const generateTableQRCode = async (restaurantId, tableCode, baseUrl = "http://localhost:3000") => {
  try {
    const sessionUrl = `${baseUrl}/api/diner/sessions/start?restaurant_id=${restaurantId}&table_code=${tableCode}`;
    
    // Generate QR code as data URL (for displaying in API)
    const qrCodeDataUrl = await QRCode.toDataURL(sessionUrl, {
      width: 300,
      margin: 2,
      quality: 1
    });

    // Generate QR code as PNG buffer (for downloading)
    const qrCodePng = await QRCode.toBuffer(sessionUrl, {
      width: 300,
      margin: 2,
      quality: 1
    });

    return {
      qrUrl: qrCodeDataUrl,
      //qrBuffer: qrCodePng,
      sessionUrl
    };
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};
