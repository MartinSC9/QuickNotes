/**
 * Generates a portfolio preview image (1280x720) for Quick Notes.
 * Shows a mockup of the app with sample notes.
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1280, H = 720;
const c = createCanvas(W, H);
const ctx = c.getContext('2d');

/* ── Helpers ── */
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Background gradient ── */
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, '#e8ecf1');
bg.addColorStop(1, '#d5dce6');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

/* ── App window frame ── */
const winX = 80, winY = 40, winW = W - 160, winH = H - 80;

// Window shadow
ctx.shadowColor = 'rgba(0,0,0,0.18)';
ctx.shadowBlur = 40;
ctx.shadowOffsetY = 8;
roundRect(winX, winY, winW, winH, 10);
ctx.fillStyle = '#ffffff';
ctx.fill();
ctx.shadowColor = 'transparent';

// Window border
roundRect(winX, winY, winW, winH, 10);
ctx.strokeStyle = '#e0e0e0';
ctx.lineWidth = 1;
ctx.stroke();

/* ── Titlebar ── */
const tbH = 38;
ctx.save();
roundRect(winX, winY, winW, tbH, 10);
ctx.rect(winX, winY + tbH - 10, winW, 10); // fill bottom corners
ctx.clip();
ctx.fillStyle = '#f8f8f8';
ctx.fillRect(winX, winY, winW, tbH);
ctx.restore();

// Titlebar border
ctx.beginPath();
ctx.moveTo(winX, winY + tbH);
ctx.lineTo(winX + winW, winY + tbH);
ctx.strokeStyle = '#e5e5e5';
ctx.lineWidth = 1;
ctx.stroke();

// Title text
ctx.font = '12px "Segoe UI"';
ctx.fillStyle = '#666';
ctx.textBaseline = 'middle';
ctx.fillText('Quick Notes', winX + 16, winY + tbH / 2);

// Window controls
const ctrlY = winY + tbH / 2;
const ctrlX = winX + winW - 16;
ctx.strokeStyle = '#999';
ctx.lineWidth = 1;

// Close
ctx.beginPath();
ctx.moveTo(ctrlX - 5, ctrlY - 5);
ctx.lineTo(ctrlX + 5, ctrlY + 5);
ctx.moveTo(ctrlX + 5, ctrlY - 5);
ctx.lineTo(ctrlX - 5, ctrlY + 5);
ctx.stroke();

// Maximize
ctx.strokeRect(ctrlX - 50 - 4, ctrlY - 4, 8, 8);

// Minimize
ctx.beginPath();
ctx.moveTo(ctrlX - 95, ctrlY);
ctx.lineTo(ctrlX - 85, ctrlY);
ctx.stroke();

/* ── Toolbar area ── */
const toolY = winY + tbH;
const toolH = 48;

// Search bar
roundRect(winX + 16, toolY + 10, 400, 30, 6);
ctx.fillStyle = '#f3f3f3';
ctx.fill();
ctx.strokeStyle = '#e0e0e0';
ctx.lineWidth = 1;
ctx.stroke();

ctx.font = '12px "Segoe UI"';
ctx.fillStyle = '#aaa';
ctx.fillText('🔍  Search notes...', winX + 30, toolY + 27);

// New Note button
roundRect(winX + winW - 120, toolY + 10, 100, 30, 4);
ctx.fillStyle = '#005fb8';
ctx.fill();
ctx.font = '600 12px "Segoe UI"';
ctx.fillStyle = '#fff';
ctx.textAlign = 'center';
ctx.fillText('+ New Note', winX + winW - 70, toolY + 27);
ctx.textAlign = 'left';

// Toggle buttons
// OS button
roundRect(winX + winW - 190, toolY + 10, 30, 30, 6);
ctx.fillStyle = '#f3f3f3';
ctx.fill();
ctx.strokeStyle = '#e0e0e0';
ctx.stroke();

// Theme button
roundRect(winX + winW - 154, toolY + 10, 30, 30, 6);
ctx.fillStyle = '#f3f3f3';
ctx.fill();
ctx.strokeStyle = '#e0e0e0';
ctx.stroke();

/* ── Note Cards ── */
const gridX = winX + 16;
const gridY = toolY + toolH + 12;
const cardW = (winW - 64) / 3;
const cardH = 150;
const gap = 14;

const sampleNotes = [
  { color: '#005fb8', title: 'Meeting Notes', text: 'Review Q2 targets with team.\nPrepare presentation slides.\nSchedule follow-up for Friday.', date: 'Mar 30, 2026', pinned: true },
  { color: '#107c10', title: 'Grocery List', text: 'Milk, eggs, bread, avocados,\nchicken breast, rice, olive oil,\ntomatoes, onions, garlic', date: 'Mar 29, 2026', pinned: false },
  { color: '#c24e00', title: 'Project Ideas', text: 'Weather app with AI insights\nRecipe manager with meal planning\nBudget tracker with charts', date: 'Mar 28, 2026', pinned: false },
  { color: '#7160e8', title: 'Book Recommendations', text: 'Atomic Habits - James Clear\nDeep Work - Cal Newport\nThe Pragmatic Programmer', date: 'Mar 27, 2026', pinned: false },
  { color: '#0e8a7b', title: 'Workout Plan', text: 'Monday: Chest + Triceps\nWednesday: Back + Biceps\nFriday: Legs + Shoulders', date: 'Mar 26, 2026', pinned: false },
  { color: '#d48c00', title: 'Travel Checklist', text: 'Passport ✓\nHotel booking ✓\nFlight tickets ✓\nTravel insurance...', date: 'Mar 25, 2026', pinned: false },
];

sampleNotes.forEach((note, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const cx = gridX + col * (cardW + gap);
  const cy = gridY + row * (cardH + gap);

  // Card shadow
  ctx.shadowColor = 'rgba(0,0,0,0.06)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  roundRect(cx, cy, cardW, cardH, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.shadowColor = 'transparent';

  // Card border
  roundRect(cx, cy, cardW, cardH, 8);
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top color bar
  ctx.save();
  roundRect(cx, cy, cardW, 4, 8);
  ctx.rect(cx, cy + 4, cardW, 4);
  ctx.clip();
  ctx.fillStyle = note.color;
  ctx.fillRect(cx, cy, cardW, 8);
  ctx.restore();

  // Title
  ctx.font = '600 13px "Segoe UI"';
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText(note.title, cx + 14, cy + 28);

  // Pin indicator
  if (note.pinned) {
    ctx.font = '10px "Segoe UI"';
    ctx.fillStyle = '#005fb8';
    ctx.fillText('📌', cx + cardW - 28, cy + 26);
  }

  // Preview text
  ctx.font = '11px "Segoe UI"';
  ctx.fillStyle = '#777';
  const lines = note.text.split('\n');
  lines.forEach((line, li) => {
    if (li < 3) ctx.fillText(line, cx + 14, cy + 50 + li * 18);
  });

  // Date
  ctx.font = '10px "Segoe UI"';
  ctx.fillStyle = '#bbb';
  ctx.fillText(note.date, cx + 14, cy + cardH - 14);
});

/* ── App icon + branding in corner ── */
// Small icon
const iconSize = 32;
const iconX = winX + winW - iconSize - 18;
const iconY = winY + winH - iconSize - 18;

roundRect(iconX, iconY, iconSize, iconSize, 6);
const iconGrad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize);
iconGrad.addColorStop(0, '#005fb8');
iconGrad.addColorStop(1, '#0078d4');
ctx.fillStyle = iconGrad;
ctx.fill();

// Mini note lines on icon
ctx.strokeStyle = '#fff';
ctx.lineWidth = 1.5;
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo(iconX + 8, iconY + 11);
ctx.lineTo(iconX + 24, iconY + 11);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(iconX + 8, iconY + 17);
ctx.lineTo(iconX + 20, iconY + 17);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(iconX + 8, iconY + 23);
ctx.lineTo(iconX + 16, iconY + 23);
ctx.stroke();

/* ── Export ── */
const out = path.join(__dirname, '..', '..', 'agency-portfolio', 'src', 'assets', 'projects', 'quick-notes', '1.png');
fs.writeFileSync(out, c.toBuffer('image/png'));
console.log('Preview saved to', out);
