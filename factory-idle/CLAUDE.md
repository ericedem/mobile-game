# Factory Idle

A resource management and factory automation game. Gather food and wood, hire workers, discover deposits, mine resources, and build machines to process raw materials.

## Files

- `index.html` — Page structure: resource display, explore/mine/craft/smelt/factory/power/upgrade panels, message log
- `game.js` — All game logic: resource definitions, explore/mine/craft/smelt/factory/power/upgrade systems, UI rendering
- `style.css` — Dark theme styling, button animations, float numbers, toast messages

## Game Flow

1. **Gather** — Search for food and wood deposits, tap to collect
2. **Workers** — Hire field workers (produce food), woodcutters (produce wood), and explorers (find deposits) using food
3. **Tools** — Craft axe (speeds wood gathering + workers), then pickaxe (unlocks stone/coal/ore mining)
4. **Mine** — Tap resource buttons to collect from discovered deposits (stone, coal, iron ore, copper ore, lithium)
5. **Build** — Use resources to craft structures: Stone Furnace, Factory, Power Plant
6. **Smelt** — Furnaces convert ores + coal → metal bars (3s timer)
7. **Factory** — Factories produce copper wire and circuits using coal
8. **Power** — Coal power plants auto-convert coal → power units (4s timer, continuous)
9. **Upgrade** — Retrofit furnaces/factories to electric versions (use power instead of coal, faster)
10. **Auto Miners** — Handcraft single-use auto miners to gather resources automatically (15 iterations)
11. **Batteries & Drones** — Build batteries, then search drones that auto-discover deposits (8 iterations)

## Resources

| Resource     | Color   | Mineable | Source            |
|-------------|---------|----------|-------------------|
| Food         | #4caf50 | Yes      | Explore & mine    |
| Wood         | #8B5E3C | Yes      | Explore & mine    |
| Stone        | #999    | Yes      | Explore & mine    |
| Coal         | #555    | Yes      | Explore & mine    |
| Iron Ore     | #b05030 | Yes      | Explore & mine    |
| Copper Ore   | #c07040 | Yes      | Explore & mine    |
| Lithium      | #b0e0e6 | Yes      | Explore & mine    |
| Iron Bar     | #aab0b8 | No       | Smelting          |
| Copper Bar   | #d4884a | No       | Smelting          |
| Copper Wire  | #e09050 | No       | Factory           |
| Circuit      | #4caf50 | No       | Factory           |
| Power        | #ffeb3b | No       | Power Plant       |
| Auto Miner   | #607d8b | No       | Handcraft         |
| Battery      | #66bb6a | No       | Factory           |
| Search Drone | #80deea | No       | Handcraft         |

## Tools

- **Axe**: 10 Wood — speeds wood mining (1s instead of 2s), speeds workers (0.5x interval)
- **Pickaxe**: 5 Stone + 5 Wood — unlocks stone, coal, iron, copper mining

## Workers

All available from start. Consume 1 food per cycle. Slow without tools.

- **Field Worker**: 8s base interval, produces 3 food
- **Woodcutter**: 7s base interval, produces 2 wood
- **Explorer**: 10s base interval, finds resource deposits

### Worker Upgrades

- **Stone Tools**: 15 Stone — 50% speed boost to all workers (stacks with axe for 4x speed)

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
- **Battery**: 1 Lithium + 2 Copper Wire + 1 Iron Bar → 1 Battery (4s)

### Electric Factory (upgraded)
- **Copper Wire**: 1 Copper Bar → 1 Copper Wire (1.5s)
- **Circuit**: 3 Copper Wire + 1 Iron Bar + 1 Power → 1 Circuit (3.5s)
- **Battery**: 1 Lithium + 2 Copper Wire + 1 Iron Bar → 1 Battery (3s, uses power)

## Coal Power Plant

- **Generate Power**: 2 Coal → 5 Power (4s, auto-loops continuously)

## Handcraft Recipes

- **Auto Miner**: 5 Coal + 3 Iron Bar + 3 Copper Bar + 1 Circuit
- **Search Drone**: 1 Battery + 1 Circuit + 2 Copper Wire

## Upgrades

- **Electric Furnace**: 2 Circuit + 4 Copper Wire — retrofits one furnace
- **Electric Factory**: 3 Circuit + 6 Copper Wire — retrofits one factory

## Auto Miners

Single-use machines deployed on a resource deposit. Run 15 iterations at 3s intervals, then expire.

## Search Drones

Single-use drones that automatically search for resource deposits. Run 8 search iterations, then expire.

## Code Patterns

- `consumeResources(cost)` — Helper that checks canAfford and deducts resources, returns boolean
- `showPanel(panel)` — Removes hidden class and adds panel-reveal animation on first show
- `renderResources()` — Incremental DOM updates via `resourceBadges` tracking object
- Independent `requestAnimationFrame` tick loops for each machine system
- `formatCost()` — Color-coded cost display (green=affordable, red=insufficient)
