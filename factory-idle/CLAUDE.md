# Factory Idle

A resource management and factory automation game. Discover deposits, mine resources by tapping, and build machines to process raw materials.

## Files

- `index.html` — Page structure: resource display, explore/mine/craft/smelt/factory/power/upgrade panels, message log
- `game.js` — All game logic: resource definitions, explore/mine/craft/smelt/factory/power/upgrade systems, UI rendering
- `style.css` — Dark theme styling, button animations, float numbers, toast messages

## Game Flow

1. **Explore** — Player taps "Search for X" buttons. Timed searches discover deposit pools
2. **Mine** — Once discovered, tap resource buttons to collect from deposits (stone, coal, iron ore, copper ore)
3. **Build** — Use resources to craft structures: Stone Furnace, Factory, Power Plant
4. **Smelt** — Furnaces convert ores + coal → metal bars (3s timer)
5. **Factory** — Factories produce copper wire and circuits using coal
6. **Power** — Power plants convert coal → power units (4s timer)
7. **Upgrade** — Retrofit furnaces/factories to electric versions (use power instead of coal, faster)

## Resources

| Resource     | Color   | Mineable | Source            |
|-------------|---------|----------|-------------------|
| Stone        | #999    | Yes      | Explore & mine    |
| Coal         | #555    | Yes      | Explore & mine    |
| Iron Ore     | #b05030 | Yes      | Explore & mine    |
| Copper Ore   | #c07040 | Yes      | Explore & mine    |
| Iron Bar     | #aab0b8 | No       | Smelting          |
| Copper Bar   | #d4884a | No       | Smelting          |
| Copper Wire  | #e09050 | No       | Factory           |
| Circuit      | #4caf50 | No       | Factory           |
| Power        | #ffeb3b | No       | Power Plant       |

## Building

- **Stone Furnace**: 10 Stone — unlocks smelting panel
- **Factory**: 15 Stone + 5 Iron Bar + 5 Copper Bar — unlocks factory panel
- **Power Plant**: 5 Circuit + 10 Copper Wire + 5 Copper Bar + 5 Iron Bar — unlocks power panel

## Smelting (Furnaces)

- **Iron Bar**: 1 Iron Ore + 1 Coal → 1 Iron Bar (3s)
- **Copper Bar**: 1 Copper Ore + 1 Coal → 1 Copper Bar (3s)

### Electric Furnace (upgraded)
- **Iron Bar**: 1 Iron Ore + 1 Power → 1 Iron Bar (2s)
- **Copper Bar**: 1 Copper Ore + 1 Power → 1 Copper Bar (2s)

## Factory Recipes

- **Copper Wire**: 1 Copper Bar → 1 Copper Wire (2s)
- **Circuit**: 3 Copper Wire + 1 Iron Bar + 1 Coal → 1 Circuit (5s)

### Electric Factory (upgraded)
- **Copper Wire**: 1 Copper Bar → 1 Copper Wire (1.5s)
- **Circuit**: 3 Copper Wire + 1 Iron Bar + 1 Power → 1 Circuit (3.5s)

## Power Plant

- **Generate Power**: 2 Coal → 5 Power (4s)

## Upgrades

- **Electric Furnace**: 2 Circuit + 4 Copper Wire — retrofits one furnace
- **Electric Factory**: 3 Circuit + 6 Copper Wire — retrofits one factory
