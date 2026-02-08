const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateQR(itemId, nextStage, ipfsCid) {
    const data = {
        itemId: itemId.toString(),
        nextStage: nextStage,
        ipfsCid: ipfsCid
    };

    const stringData = JSON.stringify(data);
    const qrcodesDir = path.join(__dirname, '../qrcodes');

    if (!fs.existsSync(qrcodesDir)) {
        fs.mkdirSync(qrcodesDir);
    }

    const filename = `qr_item_${itemId}_to_${nextStage}.png`;
    const filepath = path.join(qrcodesDir, filename);

    const jsonFilename = `qr_item_${itemId}_to_${nextStage}.json`;
    const jsonFilepath = path.join(qrcodesDir, jsonFilename);

    try {
        await QRCode.toFile(filepath, stringData);
        fs.writeFileSync(jsonFilepath, stringData);
        console.log(`QR code generated: ${filepath}`);
        console.log(`QR data saved: ${jsonFilepath}`);
    } catch (err) {
        console.error('Error generating QR code:', err);
    }
}

module.exports = { generateQR };
