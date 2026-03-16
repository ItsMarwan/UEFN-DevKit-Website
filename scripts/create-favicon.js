const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

async function createFavicon() {
  try {
    // Create favicon.ico from icon.png
    await sharp(path.join(publicDir, 'icon.png'))
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    console.log('✓ Created favicon.ico');

    // Also create favicon.svg for modern browsers
    const svgFavicon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <style>
          @media (prefers-color-scheme: dark) {
            body { background: black; }
          }
          @media (prefers-color-scheme: light) {
            body { background: white; }
          }
        </style>
      </defs>
      <image href="/icon.png" x="0" y="0" width="512" height="512"/>
    </svg>
    `;
    
    fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgFavicon);
    console.log('✓ Created favicon.svg');

    console.log('\n✓ All favicons created successfully!');
  } catch (error) {
    console.error('Error creating favicons:', error);
    process.exit(1);
  }
}

createFavicon();
