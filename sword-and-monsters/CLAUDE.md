# Sword & Monsters

A first-person RPG where you fight progressively harder monsters across 10 story-driven areas.

## Files

- `index.html` — Page structure: title, story, battle, victory, shop, and game over screens
- `game.js` — Core game loop: combat, XP/leveling, HP/healing, screen management, shop logic
- `monsters.js` — 8 monster types with canvas draw functions, stat scaling by area
- `items.js` — Equipment definitions (weapon/armor/accessory), consumables, shop inventory, XP curve
- `story.js` — Area names, narrative text for all 10 areas, intro/epilogue sequences
- `style.css` — All styling: mobile layout, animations (slash, hit, damage flash, floating numbers), shop UI, story screen

## Game Systems

### Combat
- Turn-based: player attacks or heals, then monster attacks
- Damage = base ATK with 20% random variance, minus target DEF
- Heal potions restore 35% of max HP (limited charges)

### Progression
- **XP/Levels:** Monsters give XP. Level up grants +10 max HP, +2 ATK, full heal. XP curve: `30 * level^1.5`
- **Gold:** Monsters drop gold (with random variance). Spent at shop between areas
- **Equipment:** 3 slots — weapon (ATK), armor (DEF), accessory (max HP). 5-6 tiers per slot, unlocked by area
- **Areas:** Player fights multiple monsters per area, chooses when to advance. Full heal on area transition

### Monsters
8 types cycle through areas with stat scaling (`1 + (area-1) * 0.25`):
Slime, Goblin, Skeleton, Wolf, Dark Mage, Orc, Dragon, Demon Lord

### Story
- Intro: monsters attack village, elder gives you a sword
- 10 areas with unique narrative (Village Outskirts → Demon Gate)
- Epilogue after area 10, then areas cycle with escalating difficulty
