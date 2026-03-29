# Game Arcade

A collection of mobile-friendly web games, hosted on GitHub Pages.

**Live URL:** https://ericedem.github.io/mobile-game/

## Project Structure

```
/                          # Root hub page (game picker)
/sword-and-monsters/       # RPG monster battler game
/.github/workflows/        # GitHub Actions deploy to Pages
```

## Architecture

- Pure HTML/CSS/JS — no frameworks, no build step, no dependencies
- Each game lives in its own subfolder with its own `index.html`
- Root `index.html` is the arcade hub with cards linking to each game
- Designed mobile-first (touch-friendly, `100dvh` layout, PWA-capable)
- Canvas-based sprite rendering (no image assets needed)

## Deployment

- Deployed via GitHub Pages from the `main` branch
- Push to `main` triggers automatic deployment
- Development branch: `claude/mobile-game-exploration-kruaS`
- Always push to both the dev branch and `main` for deployment

## Adding a New Game

1. Create a new subfolder (e.g., `/new-game/`)
2. Add `index.html` and supporting JS/CSS files
3. Add a game card to the root `index.html`
4. Add a `CLAUDE.md` in the game subfolder documenting its structure
