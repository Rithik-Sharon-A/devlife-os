const fs = require("fs");
const path = require("path");

const svgIcon = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#0a0a0f" rx="200"/>
  <rect x="150" y="150" width="724" height="724" fill="#13131a" rx="120"/>
  <polygon points="512,220 800,780 224,780" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c6aff"/>
      <stop offset="100%" style="stop-color:#00d4aa"/>
    </linearGradient>
  </defs>
</svg>`;

const assetsDir = path.join(__dirname, "..", "assets");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(path.join(assetsDir, "icon.svg"), svgIcon.trim());
console.log("SVG icon created at assets/icon.svg");
console.log("Convert to PNG using any online tool:");
console.log("https://svgtopng.com");
console.log("Upload icon.svg, download as icon.png");
console.log("Resize to 1024x1024");
