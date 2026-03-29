// Monster definitions and pixel art drawing functions
// Each monster has stats that scale with area level and a draw function for canvas rendering

const MONSTER_TYPES = [
  {
    name: "Slime",
    color: "#4ecca3",
    baseHp: 30,
    baseAtk: 5,
    baseXp: 10,
    baseGold: 8,
    draw(ctx, w, h) {
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 20, 50, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7fe8c9";
      ctx.beginPath();
      ctx.ellipse(cx - 15, cy + 10, 15, 10, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.arc(cx - 14, cy + 15, 5, 0, Math.PI * 2);
      ctx.arc(cx + 14, cy + 15, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx - 12, cy + 14, 2, 0, Math.PI * 2);
      ctx.arc(cx + 16, cy + 14, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    name: "Goblin",
    color: "#8bc34a",
    baseHp: 45,
    baseAtk: 8,
    baseXp: 15,
    baseGold: 12,
    draw(ctx, w, h) {
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = this.color;
      ctx.fillRect(cx - 25, cy, 50, 50);
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 28, cy - 10);
      ctx.lineTo(cx - 48, cy - 30);
      ctx.lineTo(cx - 20, cy - 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 28, cy - 10);
      ctx.lineTo(cx + 48, cy - 30);
      ctx.lineTo(cx + 20, cy - 5);
      ctx.fill();
      ctx.fillStyle = "#ff0";
      ctx.beginPath();
      ctx.arc(cx - 10, cy - 5, 6, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy - 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.arc(cx - 10, cy - 5, 3, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy - 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 10, 0, Math.PI);
      ctx.stroke();
    }
  },
  {
    name: "Skeleton",
    color: "#e0d8c0",
    baseHp: 60,
    baseAtk: 12,
    baseXp: 22,
    baseGold: 18,
    draw(ctx, w, h) {
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 18, cy + 10, 36, 15);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(cx - 12, cy + 15, 5, 8);
      ctx.fillRect(cx - 3, cy + 15, 5, 8);
      ctx.fillRect(cx + 7, cy + 15, 5, 8);
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.arc(cx - 12, cy - 15, 9, 0, Math.PI * 2);
      ctx.arc(cx + 12, cy - 15, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e94560";
      ctx.beginPath();
      ctx.arc(cx - 12, cy - 15, 4, 0, Math.PI * 2);
      ctx.arc(cx + 12, cy - 15, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 2);
      ctx.lineTo(cx + 4, cy - 2);
      ctx.lineTo(cx, cy + 5);
      ctx.fill();
      ctx.fillStyle = this.color;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(cx - 20, cy + 30 + i * 10, 40, 4);
      }
      ctx.fillRect(cx - 3, cy + 25, 6, 50);
    }
  },
  {
    name: "Wolf",
    color: "#78909c",
    baseHp: 50,
    baseAtk: 15,
    baseXp: 20,
    baseGold: 14,
    draw(ctx, w, h) {
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 20, 45, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy - 10, 30, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 30);
      ctx.lineTo(cx - 30, cy - 55);
      ctx.lineTo(cx - 8, cy - 30);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 20, cy - 30);
      ctx.lineTo(cx + 30, cy - 55);
      ctx.lineTo(cx + 8, cy - 30);
      ctx.fill();
      ctx.fillStyle = "#ff5722";
      ctx.beginPath();
      ctx.ellipse(cx - 12, cy - 15, 6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 12, cy - 15, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.arc(cx - 12, cy - 15, 3, 0, Math.PI * 2);
      ctx.arc(cx + 12, cy - 15, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#90a4ae";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    name: "Dark Mage",
    color: "#9c27b0",
    baseHp: 55,
    baseAtk: 18,
    baseXp: 28,
    baseGold: 22,
    draw(ctx, w, h) {
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = "#4a148c";
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy);
      ctx.lineTo(cx - 40, cy + 60);
      ctx.lineTo(cx + 40, cy + 60);
      ctx.lineTo(cx + 30, cy);
      ctx.fill();
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(cx, cy - 5, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4a148c";
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy - 10);
      ctx.lineTo(cx, cy - 60);
      ctx.lineTo(cx + 25, cy - 5);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e040fb";
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 3, 4, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx + 35, cy - 30);
      ctx.lineTo(cx + 35, cy + 60);
      ctx.stroke();
      ctx.fillStyle = "#e040fb";
      ctx.beginPath();
      ctx.arc(cx + 35, cy - 35, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f8bbd0";
      ctx.beginPath();
      ctx.arc(cx + 33, cy - 37, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    name: "Orc",
    color: "#558b2f",
    baseHp: 80,
    baseAtk: 14,
    baseXp: 25,
    baseGold: 20,
    draw(ctx, w, h) {
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = this.color;
      ctx.fillRect(cx - 35, cy + 5, 70, 55);
      ctx.beginPath();
      ctx.arc(cx, cy - 5, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#33691e";
      ctx.fillRect(cx - 28, cy - 20, 56, 10);
      ctx.fillStyle = "#ff0";
      ctx.beginPath();
      ctx.arc(cx - 12, cy - 8, 6, 0, Math.PI * 2);
      ctx.arc(cx + 12, cy - 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.arc(cx - 12, cy - 8, 3, 0, Math.PI * 2);
      ctx.arc(cx + 12, cy - 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e0d8c0";
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy + 12);
      ctx.lineTo(cx - 8, cy + 25);
      ctx.lineTo(cx - 4, cy + 12);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 4, cy + 12);
      ctx.lineTo(cx + 8, cy + 25);
      ctx.lineTo(cx + 12, cy + 12);
      ctx.fill();
      ctx.fillStyle = this.color;
      ctx.fillRect(cx - 55, cy + 10, 22, 40);
      ctx.fillRect(cx + 33, cy + 10, 22, 40);
    }
  },
  {
    name: "Dragon",
    color: "#f44336",
    baseHp: 100,
    baseAtk: 22,
    baseXp: 40,
    baseGold: 35,
    draw(ctx, w, h) {
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 25, 50, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy - 15, 28, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8d6e63";
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 35);
      ctx.lineTo(cx - 25, cy - 60);
      ctx.lineTo(cx - 10, cy - 35);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 18, cy - 35);
      ctx.lineTo(cx + 25, cy - 60);
      ctx.lineTo(cx + 10, cy - 35);
      ctx.fill();
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy - 20, 7, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 10, cy - 20, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy - 20, 3, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 10, cy - 20, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#b71c1c";
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 5, 3, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy - 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c62828";
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy + 10);
      ctx.lineTo(cx - 80, cy - 25);
      ctx.lineTo(cx - 70, cy + 10);
      ctx.lineTo(cx - 55, cy - 10);
      ctx.lineTo(cx - 45, cy + 15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 40, cy + 10);
      ctx.lineTo(cx + 80, cy - 25);
      ctx.lineTo(cx + 70, cy + 10);
      ctx.lineTo(cx + 55, cy - 10);
      ctx.lineTo(cx + 45, cy + 15);
      ctx.fill();
      ctx.fillStyle = "#ff8a65";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 28, 25, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    name: "Demon Lord",
    color: "#b71c1c",
    baseHp: 120,
    baseAtk: 25,
    baseXp: 55,
    baseGold: 50,
    draw(ctx, w, h) {
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = "rgba(183, 28, 28, 0.15)";
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2c2c2c";
      ctx.beginPath();
      ctx.moveTo(cx - 35, cy);
      ctx.lineTo(cx - 45, cy + 65);
      ctx.lineTo(cx + 45, cy + 65);
      ctx.lineTo(cx + 35, cy);
      ctx.fill();
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4a0000";
      ctx.beginPath();
      ctx.moveTo(cx - 25, cy - 30);
      ctx.lineTo(cx - 35, cy - 70);
      ctx.lineTo(cx - 15, cy - 30);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 25, cy - 30);
      ctx.lineTo(cx + 35, cy - 70);
      ctx.lineTo(cx + 15, cy - 30);
      ctx.fill();
      ctx.fillStyle = "#ff0";
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy - 12, 6, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 10, cy - 12, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy - 12, 3, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 10, cy - 12, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff0";
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy + 5);
      ctx.lineTo(cx, cy + 15);
      ctx.lineTo(cx + 15, cy + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.moveTo(cx - 35, cy + 5);
      ctx.lineTo(cx - 85, cy - 40);
      ctx.lineTo(cx - 75, cy + 5);
      ctx.lineTo(cx - 60, cy - 20);
      ctx.lineTo(cx - 50, cy + 10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 35, cy + 5);
      ctx.lineTo(cx + 85, cy - 40);
      ctx.lineTo(cx + 75, cy + 5);
      ctx.lineTo(cx + 60, cy - 20);
      ctx.lineTo(cx + 50, cy + 10);
      ctx.fill();
    }
  }
];

// Get a random monster for a given area, with scaled stats
function getMonsterForArea(area) {
  // Pick a random monster type, weighted toward harder ones at higher areas
  const maxIndex = Math.min(MONSTER_TYPES.length, area + 2);
  const minIndex = Math.max(0, area - 2);
  const index = minIndex + Math.floor(Math.random() * (maxIndex - minIndex));
  const type = MONSTER_TYPES[index];

  const scale = 1 + (area - 1) * 0.25;

  return {
    name: type.name,
    hp: Math.round(type.baseHp * scale),
    maxHp: Math.round(type.baseHp * scale),
    atk: Math.round(type.baseAtk * scale),
    xp: Math.round(type.baseXp * scale),
    gold: Math.round(type.baseGold * scale * (0.8 + Math.random() * 0.4)),
    color: type.color,
    draw: type.draw.bind(type)
  };
}
