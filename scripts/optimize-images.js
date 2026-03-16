const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

async function optimizeImages() {
  try {
    // Optimize icon.png - increase quality and size
    const tempIcon = path.join(publicDir, 'icon-temp.png');
    await sharp(path.join(publicDir, 'icon.png'))
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({ quality: 95, effort: 10 })
      .toFile(tempIcon);
    
    fs.renameSync(tempIcon, path.join(publicDir, 'icon.png'));
    console.log('✓ Optimized icon.png');

    // Optimize icon2.png
    const tempIcon2 = path.join(publicDir, 'icon2-temp.png');
    await sharp(path.join(publicDir, 'icon2.png'))
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({ quality: 95, effort: 10 })
      .toFile(tempIcon2);
    
    fs.renameSync(tempIcon2, path.join(publicDir, 'icon2.png'));
    console.log('✓ Optimized icon2.png');

    // Create a blurred banner background for the hero section
    await sharp(path.join(publicDir, 'banner.png'))
      .resize(1920, 1080, { fit: 'cover' })
      .blur(25)
      .toFile(path.join(publicDir, 'banner-blurred.jpg'));
    
    console.log('✓ Created blurred banner background');

    console.log('\n✓ All images optimized successfully!');
  } catch (error) {
    console.error('Error optimizing images:', error);
    process.exit(1);
  }
}

optimizeImages();
