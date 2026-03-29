# Factory Idle

A resource management and factory automation game. Discover deposits, mine resources by tapping, and build machines to process raw materials.

## Files

- `index.html` — Page structure: resource display, explore/mine/craft/smelt panels, message log
- `game.js` — All game logic: resource definitions, explore/mine/craft/smelt systems, UI rendering
- `style.css` — Dark theme styling, button animations, float numbers, toast messages

## Game Flow

1. **Explore** — Player taps "Search for X" buttons. Each has a % chance to discover a deposit
2. **Mine** — Once discovered, tap resource buttons to collect (stone, coal, iron ore, copper ore)
3. **Build** — Use stone to craft a Stone Furnace (unlocks when stone is discovered)
4. **Smelt** — Furnace converts iron ore + coal → iron bar, copper ore + coal → copper bar (3s timer)

## Resources

| Resource   | Color   | Mineable | Discover Chance |
|-----------|---------|----------|----------------|
| Stone      | #999    | Yes      | 80%            |
| Coal       | #555    | Yes      | 60%            |
| Iron Ore   | #b05030 | Yes      | 50%            |
| Copper Ore | #c07040 | Yes      | 50%            |
| Iron Bar   | #aab0b8 | No       | Via smelting   |
| Copper Bar | #d4884a | No       | Via smelting   |

## Crafting

- **Stone Furnace**: 10 Stone — unlocks smelting panel

## Smelting

- **Iron Bar**: 1 Iron Ore + 1 Coal → 1 Iron Bar (3s)
- **Copper Bar**: 1 Copper Ore + 1 Coal → 1 Copper Bar (3s)
