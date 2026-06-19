const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, size, size);

  const padding = size * 0.15;
  const radius = size * 0.2;
  const x = padding;
  const y = padding;
  const w = size - padding * 2;
  const h = size - padding * 2;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = "#13131a";
  ctx.fill();

  const cx = size / 2;
  const cy = size / 2;
  const triSize = size * 0.28;

  ctx.beginPath();
  ctx.moveTo(cx, cy - triSize);
  ctx.lineTo(cx + triSize * 0.87, cy + triSize * 0.5);
  ctx.lineTo(cx - triSize * 0.87, cy + triSize * 0.5);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(
    cx - triSize,
    cy - triSize,
    cx + triSize,
    cy + triSize
  );
  gradient.addColorStop(0, "#7c6aff");
  gradient.addColorStop(0.5, "#5b8af5");
  gradient.addColorStop(1, "#00d4aa");
  ctx.fillStyle = gradient;
  ctx.fill();

  const assetsDir = path.dirname(filename);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename} (${size}x${size})`);
}

const assetsDir = path.join(__dirname, "..", "assets");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

generateIcon(1024, path.join(assetsDir, "icon.png"));
generateIcon(1024, path.join(assetsDir, "adaptive-icon.png"));
generateIcon(1284, path.join(assetsDir, "splash-icon.png"));

console.log("All icons generated!");
