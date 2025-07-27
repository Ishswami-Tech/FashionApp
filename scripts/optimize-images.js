const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const publicDir = path.join(__dirname, '../public');
  const galleryDir = path.join(publicDir, 'gallery');
  
  // Create gallery directory if it doesn't exist
  if (!fs.existsSync(galleryDir)) {
    fs.mkdirSync(galleryDir, { recursive: true });
  }
  
  // Convert design1.png to WebP
  try {
    await sharp(path.join(galleryDir, 'design1.png'))
      .resize(600, 600, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(path.join(galleryDir, 'design1.webp'));
    console.log('✅ Converted design1.png to design1.webp');
  } catch (error) {
    console.log('⚠️  design1.png not found, creating placeholder');
    // Create a placeholder image
    await sharp({
      create: {
        width: 600,
        height: 600,
        channels: 4,
        background: { r: 236, g: 72, b: 153, alpha: 0.1 }
      }
    })
    .webp({ quality: 80 })
    .toFile(path.join(galleryDir, 'design1.webp'));
  }
  
  // Convert design2.png to WebP
  try {
    await sharp(path.join(galleryDir, 'design2.png'))
      .resize(600, 600, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(path.join(galleryDir, 'design2.webp'));
    console.log('✅ Converted design2.png to design2.webp');
  } catch (error) {
    console.log('⚠️  design2.png not found, creating placeholder');
    // Create a placeholder image
    await sharp({
      create: {
        width: 600,
        height: 600,
        channels: 4,
        background: { r: 147, g: 51, b: 234, alpha: 0.1 }
      }
    })
    .webp({ quality: 80 })
    .toFile(path.join(galleryDir, 'design2.webp'));
  }
  
  // Create optimized og-image.webp
  try {
    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{
      input: Buffer.from(`
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#ec4899;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#a855f7;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)"/>
          <text x="600" y="250" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">SONY FASHION</text>
          <text x="600" y="320" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="white">Premium Custom Tailoring</text>
          <text x="600" y="360" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">Designer Kurtis • Saree Blouses • Party Dresses</text>
        </svg>
      `),
      top: 0,
      left: 0
    }])
    .webp({ quality: 90 })
    .toFile(path.join(publicDir, 'og-image.webp'));
    console.log('✅ Created optimized og-image.webp');
  } catch (error) {
    console.error('❌ Error creating og-image.webp:', error);
  }
  
  console.log('🎉 Image optimization complete!');
}

optimizeImages().catch(console.error); 