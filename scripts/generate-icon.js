/**
 * Generates a 256x256 app icon PNG.
 * Run: node scripts/generate-icon.js
 * Requires: pnpm add -D canvas
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 256;
const c = createCanvas(SIZE, SIZE);
const ctx = c.getContext('2d');

// Background — rounded rectangle
const r = 48;
ctx.beginPath();
ctx.moveTo(r, 0);
ctx.lineTo(SIZE - r, 0);
ctx.quadraticCurveTo(SIZE, 0, SIZE, r);
ctx.lineTo(SIZE, SIZE - r);
ctx.quadraticCurveTo(SIZE, SIZE, SIZE - r, SIZE);
ctx.lineTo(r, SIZE);
ctx.quadraticCurveTo(0, SIZE, 0, SIZE - r);
ctx.lineTo(0, r);
ctx.quadraticCurveTo(0, 0, r, 0);
ctx.closePath();

// Gradient background
const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
bg.addColorStop(0, '#005fb8');
bg.addColorStop(1, '#0078d4');
ctx.fillStyle = bg;
ctx.fill();

// Subtle inner glow
const glow = ctx.createRadialGradient(SIZE/2, SIZE * 0.3, 10, SIZE/2, SIZE/2, SIZE * 0.7);
glow.addColorStop(0, 'rgba(255,255,255,0.15)');
glow.addColorStop(1, 'rgba(255,255,255,0)');
ctx.fillStyle = glow;
ctx.fill();

// Note paper shape
const px = 56, py = 44, pw = 144, ph = 172, pr = 14;
// Folded corner
const fold = 32;

ctx.beginPath();
ctx.moveTo(px + pr, py);
ctx.lineTo(px + pw - fold, py);
ctx.lineTo(px + pw, py + fold);
ctx.lineTo(px + pw, py + ph - pr);
ctx.quadraticCurveTo(px + pw, py + ph, px + pw - pr, py + ph);
ctx.lineTo(px + pr, py + ph);
ctx.quadraticCurveTo(px, py + ph, px, py + ph - pr);
ctx.lineTo(px, py + pr);
ctx.quadraticCurveTo(px, py, px + pr, py);
ctx.closePath();

ctx.fillStyle = '#ffffff';
ctx.fill();

// Paper shadow
ctx.shadowColor = 'rgba(0,0,0,0.2)';
ctx.shadowBlur = 16;
ctx.shadowOffsetY = 4;
ctx.fill();
ctx.shadowColor = 'transparent';

// Folded corner triangle
ctx.beginPath();
ctx.moveTo(px + pw - fold, py);
ctx.lineTo(px + pw - fold, py + fold);
ctx.lineTo(px + pw, py + fold);
ctx.closePath();
ctx.fillStyle = '#e0e0e0';
ctx.fill();

// Lines on the note
ctx.lineCap = 'round';

// Line 1
ctx.beginPath();
ctx.moveTo(px + 24, py + 56);
ctx.lineTo(px + pw - 24, py + 56);
ctx.strokeStyle = '#005fb8';
ctx.lineWidth = 7;
ctx.stroke();

// Line 2
ctx.beginPath();
ctx.moveTo(px + 24, py + 82);
ctx.lineTo(px + pw - 48, py + 82);
ctx.strokeStyle = '#60a5d6';
ctx.lineWidth = 6;
ctx.stroke();

// Line 3
ctx.beginPath();
ctx.moveTo(px + 24, py + 106);
ctx.lineTo(px + pw - 68, py + 106);
ctx.strokeStyle = '#a0c8e8';
ctx.lineWidth = 5;
ctx.stroke();

// Checkbox
const cx2 = px + 24, cy2 = py + 132;
ctx.beginPath();
ctx.roundRect(cx2, cy2, 16, 16, 3);
ctx.fillStyle = '#005fb8';
ctx.fill();

// Checkmark
ctx.beginPath();
ctx.moveTo(cx2 + 3.5, cy2 + 8);
ctx.lineTo(cx2 + 7, cy2 + 12);
ctx.lineTo(cx2 + 12.5, cy2 + 4.5);
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 2.5;
ctx.stroke();

// Checkbox text line
ctx.beginPath();
ctx.moveTo(cx2 + 24, cy2 + 8);
ctx.lineTo(px + pw - 44, cy2 + 8);
ctx.strokeStyle = '#bbb';
ctx.lineWidth = 4;
ctx.stroke();

// Small + icon at bottom right
const plusX = SIZE - 72, plusY = SIZE - 72, plusR = 28;
ctx.beginPath();
ctx.arc(plusX, plusY, plusR, 0, Math.PI * 2);
ctx.fillStyle = '#ffffff';
ctx.fill();

ctx.beginPath();
ctx.moveTo(plusX, plusY - 12);
ctx.lineTo(plusX, plusY + 12);
ctx.moveTo(plusX - 12, plusY);
ctx.lineTo(plusX + 12, plusY);
ctx.strokeStyle = '#005fb8';
ctx.lineWidth = 4;
ctx.lineCap = 'round';
ctx.stroke();

// Export
const out = path.join(__dirname, '..', 'assets', 'icon.png');
fs.writeFileSync(out, c.toBuffer('image/png'));
console.log('Icon saved to', out);
