const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { cloudinary } = require('../config/cloudinary');

/**
 * Downloads a photo from a URL and returns it as a Buffer
 */
async function getPhotoBuffer(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch photo');
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('Error fetching cadet photo, using placeholder:', err.message);
    return null;
  }
}

/**
 * Generates a Digital ID Card PDF for a Cadet and uploads it to Cloudinary
 * @param {Object} cadet - Cadet document
 * @returns {Promise<string>} - Cloudinary URL of the uploaded PDF
 */
async function generateAndUploadIdCard(cadet) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Generate QR Code containing Cadet Regimental Number
      const qrData = JSON.stringify({
        name: cadet.name,
        regNo: cadet.regimentNo || cadet.regimentalNumber,
        rank: cadet.rank,
        battalion: cadet.battalion
      });
      const qrBuffer = await QRCode.toBuffer(qrData, { margin: 1, width: 80 });

      // 2. Fetch Cadet photo buffer if available
      let photoBuffer = null;
      if (cadet.photo) {
        photoBuffer = await getPhotoBuffer(cadet.photo);
      }

      // 3. Create PDF in Memory
      // Card size: 240 x 360 points (vertical ID card format)
      const doc = new PDFDocument({
        size: [240, 360],
        margins: { top: 10, bottom: 10, left: 10, right: 10 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(buffers);
          // Upload raw PDF file to Cloudinary
          const uploadResult = await new Promise((res, rej) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: 'raw',
                folder: 'ccp-idcards',
                public_id: `idcard_${cadet._id}_${Date.now()}`,
                format: 'pdf'
              },
              (err, result) => {
                if (err) return rej(err);
                res(result);
              }
            );
            uploadStream.end(pdfBuffer);
          });
          resolve(uploadResult.secure_url);
        } catch (uploadErr) {
          reject(uploadErr);
        }
      });

      // ─── Draw Card Styling ───
      // Draw border
      doc.rect(5, 5, 230, 350)
         .lineWidth(2)
         .stroke('#2d5a27'); // Army Green border

      // Draw background tint at the header
      doc.rect(6, 6, 228, 50)
         .fill('#2d5a27');

      // Header Text
      doc.fillColor('#ffffff')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('CADET CONNECTION PORTAL', 10, 15, { align: 'center', width: 220 })
         .fontSize(7)
         .font('Helvetica')
         .text('NCC NER Region', 10, 30, { align: 'center', width: 220 })
         .fontSize(6)
         .fillColor('#c8a951') // Gold accent
         .font('Helvetica-Bold')
         .text('"Ekta aur Anushasan"', 10, 42, { align: 'center', width: 220 });

      // Draw horizontal line separator below header
      doc.moveTo(10, 60).lineTo(230, 60).stroke('#c8a951');

      // Draw Photo placeholder or photo
      const photoX = 80;
      const photoY = 70;
      const photoW = 80;
      const photoH = 80;

      if (photoBuffer) {
        try {
          doc.image(photoBuffer, photoX, photoY, { width: photoW, height: photoH });
        } catch (imgErr) {
          // Fallback to placeholder if image loading fails
          drawPhotoPlaceholder(doc, photoX, photoY, photoW, photoH);
        }
      } else {
        drawPhotoPlaceholder(doc, photoX, photoY, photoW, photoH);
      }

      // Draw photo frame border
      doc.rect(photoX, photoY, photoW, photoH)
         .lineWidth(1)
         .stroke('#2d5a27');

      // Cadet Details Section
      let detailsY = 165;
      doc.fillColor('#1a1a1a')
         .fontSize(7)
         .font('Helvetica-Bold')
         .text('Name:', 15, detailsY)
         .font('Helvetica')
         .text(cadet.name, 75, detailsY)
         
         .font('Helvetica-Bold')
         .text('Reg No:', 15, detailsY + 14)
         .font('Helvetica')
         .text(cadet.regimentNo || cadet.regimentalNumber, 75, detailsY + 14)
         
         .font('Helvetica-Bold')
         .text('Rank:', 15, detailsY + 28)
         .font('Helvetica')
         .text(cadet.rank, 75, detailsY + 28)
         
         .font('Helvetica-Bold')
         .text('Battalion:', 15, detailsY + 42)
         .font('Helvetica')
         .text(cadet.battalion, 75, detailsY + 42)
         
         .font('Helvetica-Bold')
         .text('Institute:', 15, detailsY + 56)
         .font('Helvetica')
         .text(cadet.institute || cadet.collegeOrSchool || 'N/A', 75, detailsY + 56);

      // Draw QR Code
      const qrX = 145;
      const qrY = 240;
      doc.image(qrBuffer, qrX, qrY, { width: 75, height: 75 });
      doc.rect(qrX, qrY, 75, 75)
         .lineWidth(1)
         .stroke('#c8a951');

      // QR label
      doc.fontSize(6)
         .fillColor('#666666')
         .text('Scan to Verify', qrX, qrY + 80, { align: 'center', width: 75 });

      // Left Footer sign
      doc.fontSize(6)
         .fillColor('#2d5a27')
         .font('Helvetica-Bold')
         .text('NER Region HQ', 15, 290)
         .font('Helvetica')
         .text('Agartala, Tripura', 15, 298)
         .text(`Issued: ${new Date().toLocaleDateString()}`, 15, 306);

      // Bottom bar
      doc.rect(6, 335, 228, 20)
         .fill('#2d5a27');
      doc.fillColor('#ffffff')
         .fontSize(8)
         .font('Helvetica-Bold')
         .text('JAI HIND', 10, 342, { align: 'center', width: 220 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawPhotoPlaceholder(doc, x, y, w, h) {
  doc.rect(x, y, w, h).fill('#e0e0e0');
  doc.fillColor('#666666')
     .fontSize(8)
     .font('Helvetica-Bold')
     .text('PHOTO', x, y + h / 2 - 4, { align: 'center', width: w });
}

module.exports = { generateAndUploadIdCard };
