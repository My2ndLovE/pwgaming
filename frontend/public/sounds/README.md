# Game Sound Effects

This directory contains sound effects for the poker game.

## Sound Files

All sound files are in MP3 format for broad browser compatibility.

### Game Actions
- `bet.mp3` - Played when a player places a bet
- `call.mp3` - Played when a player calls
- `raise.mp3` - Played when a player raises
- `fold.mp3` - Played when a player folds
- `check.mp3` - Played when a player checks

### Game Events
- `card-deal.mp3` - Played when cards are dealt
- `chip.mp3` - Played for chip movements
- `win.mp3` - Played when a player wins
- `lose.mp3` - Played when a player loses

### Player Events
- `player-join.mp3` - Played when a player joins the table
- `player-leave.mp3` - Played when a player leaves the table
- `timer-warning.mp3` - Played when action timer is running low

## Sound Generation

For development, these sounds are generated using Web Audio API. In production, replace with professional sound assets.

### Recommended Sources for Professional Sounds

Free/Licensed:
- https://freesound.org (CC0 license)
- https://mixkit.co (free license)
- https://zapsplat.com (free tier)

### Requirements
- Format: MP3
- Max size per file: 50kb
- Total size: ~600kb
- Sample rate: 44.1kHz or 48kHz
- Bit rate: 128kbps

## Attribution

Current sounds: Generated using Web Audio API (no attribution required)

Replace with licensed sounds before production deployment.
