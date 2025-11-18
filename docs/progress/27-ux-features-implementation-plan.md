# T209-T212: UX Features Implementation Plan

**Date**: 2025-11-19
**Status**: In Progress
**Estimated Time**: 28 hours total

---

## Overview

Implementing the remaining UX features to enhance user experience across devices and preferences:
- **T209**: Tablet-Specific Layouts (8h)
- **T210**: Landscape Orientation Support (6h)
- **T211**: Sound Effects System (8h) - Partially complete
- **T212**: Dark Mode Implementation (6h) - Partially complete

---

## Current Status Analysis

### Already Implemented (Partial)

**Sound System** (T211 ~60% complete):
- ✅ `frontend/hooks/use-sound.ts` - React hook for sound management
- ✅ `frontend/lib/sound-manager.ts` - Core sound manager with 12 sound types
- ✅ Volume control and localStorage persistence
- ❌ Missing: Actual sound files in `public/sounds/`
- ❌ Missing: Integration into game components

**Dark Mode** (T212 ~30% complete):
- ✅ Basic dark mode via `prefers-color-scheme` in globals.css
- ✅ CSS custom properties for theming
- ❌ Missing: Manual theme toggle (user preference)
- ❌ Missing: Theme provider context
- ❌ Missing: Persistent theme selection

**Responsive Design** (T209/T210 ~20% complete):
- ✅ Basic responsive layouts exist
- ❌ Missing: Tablet-specific optimizations
- ❌ Missing: Landscape orientation handling
- ❌ Missing: Optimized poker table for landscape

---

## Implementation Plan

### Phase 1: Complete Sound Effects System (T211) - 4h

**Sub-tasks**:
1. Create placeholder sound files (or use free assets)
2. Set up `public/sounds/` directory structure
3. Integrate sound effects into game components:
   - Betting actions (bet, call, raise, fold, check)
   - Card dealing
   - Win/lose notifications
   - Player join/leave
   - Timer warnings
4. Add sound settings UI component
5. Test sound playback across browsers

**Files to Create**:
- `public/sounds/*.mp3` (12 sound files)
- `frontend/components/game/sound-settings.tsx` (settings UI)

**Files to Modify**:
- `frontend/components/game/poker-table.tsx` (integrate sounds)
- `frontend/app/(game)/game/[id]/page.tsx` (add sound initialization)

---

### Phase 2: Complete Dark Mode (T212) - 3h

**Sub-tasks**:
1. Create theme provider with context
2. Add manual theme toggle (light/dark/system)
3. Enhance color palette for poker table in dark mode
4. Add theme persistence to localStorage
5. Create theme toggle UI component
6. Update all components for dark mode compatibility

**Files to Create**:
- `frontend/contexts/theme-context.tsx` (theme provider)
- `frontend/hooks/use-theme.ts` (theme hook)
- `frontend/components/ui/theme-toggle.tsx` (toggle button)

**Files to Modify**:
- `frontend/app/globals.css` (enhanced dark mode colors)
- `frontend/app/layout.tsx` (wrap with theme provider)
- `frontend/components/game/poker-table.tsx` (dark mode styles)

---

### Phase 3: Tablet-Specific Layouts (T209) - 4h

**Sub-tasks**:
1. Define tablet breakpoints (768px - 1024px)
2. Create tablet-optimized poker table layout
3. Optimize card sizes and player positions for tablet
4. Add touch-friendly controls (larger buttons)
5. Test on iPad and Android tablets

**Tailwind Breakpoints**:
```typescript
// md: 768px (tablet portrait)
// lg: 1024px (tablet landscape / desktop)
```

**Files to Modify**:
- `frontend/components/game/poker-table.tsx` (responsive layout)
- `frontend/components/game/player-seat.tsx` (responsive sizing)
- `frontend/components/game/action-controls.tsx` (touch-friendly)

---

### Phase 4: Landscape Orientation Support (T210) - 3h

**Sub-tasks**:
1. Detect orientation changes with `window.matchMedia`
2. Create landscape-optimized poker table layout
3. Rearrange UI elements for landscape (sidebar to top/bottom)
4. Add orientation lock hints for better experience
5. Test rotation on mobile devices

**Files to Create**:
- `frontend/hooks/use-orientation.ts` (orientation detection)
- `frontend/components/game/landscape-layout.tsx` (landscape variant)

**Files to Modify**:
- `frontend/components/game/poker-table.tsx` (conditional landscape layout)
- `frontend/app/globals.css` (landscape-specific styles)

---

## Detailed Implementation

### T211: Sound Effects System

**Step 1: Create Sound Files**

Since we don't have actual sound files, I'll create a script to download free sound effects from a CDN or use placeholder data URLs:

```bash
# public/sounds/
bet.mp3
call.mp3
raise.mp3
fold.mp3
check.mp3
win.mp3
lose.mp3
chip.mp3
card-deal.mp3
timer-warning.mp3
player-join.mp3
player-leave.mp3
```

**Step 2: Sound Settings Component**

```tsx
// frontend/components/game/sound-settings.tsx
interface SoundSettingsProps {
  volume: number;
  setVolume: (v: number) => void;
  enabled: boolean;
  setEnabled: (e: boolean) => void;
}
```

**Step 3: Integration Points**

```tsx
// In poker-table.tsx
const { play } = useSound();

// On bet action
play('bet');

// On card deal
play('card-deal');

// On win
play('win');
```

---

### T212: Dark Mode Implementation

**Step 1: Theme Context**

```tsx
// frontend/contexts/theme-context.tsx
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}
```

**Step 2: Enhanced Dark Mode Colors**

```css
/* Dark mode poker table */
.poker-table-dark {
  --felt-green: #1a472a;
  --felt-green-dark: #0d2417;
  --card-shadow: rgba(0, 0, 0, 0.5);
  --chip-highlight: #ffd700;
}
```

**Step 3: Theme Toggle UI**

```tsx
// frontend/components/ui/theme-toggle.tsx
// Sun icon for light mode
// Moon icon for dark mode
// System icon for auto
```

---

### T209: Tablet Layouts

**Responsive Poker Table**:

```tsx
// frontend/components/game/poker-table.tsx
<div className="
  w-full h-full
  md:max-w-4xl md:mx-auto // Tablet: centered, max width
  lg:max-w-6xl // Desktop: wider
">
  <div className="
    poker-table
    p-4 md:p-6 lg:p-8 // Responsive padding
  ">
    {/* Player seats with responsive positioning */}
    <div className="
      absolute
      left-1/2 -translate-x-1/2
      top-2 md:top-4 // Larger spacing on tablet
    ">
      <PlayerSeat size="sm md:size-base" />
    </div>
  </div>
</div>
```

**Touch-Friendly Controls**:

```tsx
// frontend/components/game/action-controls.tsx
<button className="
  h-10 md:h-12 lg:h-10 // Larger on tablet
  px-4 md:px-6 lg:px-4
  text-sm md:text-base lg:text-sm
  touch-manipulation // Prevent double-tap zoom
">
```

---

### T210: Landscape Orientation

**Orientation Detection Hook**:

```tsx
// frontend/hooks/use-orientation.ts
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: landscape)');

    const handleChange = (e: MediaQueryListEvent) => {
      setOrientation(e.matches ? 'landscape' : 'portrait');
    };

    mediaQuery.addEventListener('change', handleChange);
    setOrientation(mediaQuery.matches ? 'landscape' : 'portrait');

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return orientation;
}
```

**Landscape Layout**:

```tsx
// In poker-table.tsx
const orientation = useOrientation();

return (
  <div className={cn(
    "poker-table-container",
    orientation === 'landscape' && "landscape-mode"
  )}>
    {/* Rearranged layout for landscape */}
  </div>
);
```

**CSS for Landscape**:

```css
@media (orientation: landscape) and (max-height: 600px) {
  .poker-table-container {
    /* Compact layout for landscape mobile */
    padding: 0.5rem;
  }

  .player-seat {
    /* Smaller player avatars */
    scale: 0.8;
  }

  .sidebar {
    /* Move sidebar to top or make horizontal */
    position: static;
    width: 100%;
    height: auto;
  }
}
```

---

## Testing Strategy

### Sound Testing
1. Test all 12 sound types play correctly
2. Test volume control (0-100%)
3. Test enable/disable toggle
4. Test localStorage persistence
5. Cross-browser testing (Chrome, Safari, Firefox)

### Dark Mode Testing
1. Test theme toggle (light/dark/system)
2. Test system preference detection
3. Test localStorage persistence
4. Test all components in both themes
5. Test poker table contrast and readability

### Responsive Testing
1. Test on iPad (768x1024)
2. Test on Android tablet (800x1280)
3. Test on small laptop (1024x768)
4. Test portrait and landscape orientations
5. Test touch interactions (no hover states)

### Orientation Testing
1. Test orientation detection
2. Test layout switching on rotation
3. Test on mobile devices (iPhone, Android)
4. Test on tablet devices
5. Test rapid orientation changes

---

## Acceptance Criteria

### T211: Sound Effects
- [x] Sound manager implemented
- [ ] All 12 sound files available
- [ ] Sounds play on game actions
- [ ] Volume control working
- [ ] Enable/disable toggle working
- [ ] Settings persist in localStorage
- [ ] No errors in browser console

### T212: Dark Mode
- [x] Basic dark mode via prefers-color-scheme
- [ ] Manual theme toggle implemented
- [ ] Theme provider context created
- [ ] All components support dark mode
- [ ] Theme persists in localStorage
- [ ] Poker table readable in both themes
- [ ] Smooth theme transitions

### T209: Tablet Layouts
- [ ] Poker table optimized for 768-1024px
- [ ] Touch-friendly controls (min 44x44px)
- [ ] Readable text sizes on tablet
- [ ] Proper spacing and padding
- [ ] No horizontal scrolling
- [ ] Tested on real tablet devices

### T210: Landscape Orientation
- [ ] Orientation detection working
- [ ] Landscape layout implemented
- [ ] UI elements rearranged for landscape
- [ ] No vertical scrolling in landscape
- [ ] Poker table fits in viewport
- [ ] Smooth transition on rotation

---

## Risk Assessment

### Low Risk
- Theme toggle implementation (well-documented pattern)
- Responsive layouts (standard Tailwind approach)

### Medium Risk
- Sound file licensing (need free/licensed assets)
- Sound playback on iOS (requires user interaction)
- Orientation lock hints (browser support varies)

### Mitigation Strategies
1. Use free sound libraries (Freesound.org, Zapsplat)
2. Defer sound initialization until user interaction
3. Provide fallback layouts for unsupported orientations
4. Progressive enhancement approach

---

## Resources Needed

### Sound Assets
- Free sound effects from:
  - Freesound.org (CC0 license)
  - Zapsplat.com (free tier)
  - Mixkit.co (free license)
- Max file size: 50kb per sound (total ~600kb)

### Testing Devices
- iPad (Safari)
- Android tablet (Chrome)
- iPhone (Safari)
- Android phone (Chrome)

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| T211: Sound Effects | 4h | In Progress |
| T212: Dark Mode | 3h | Pending |
| T209: Tablet Layouts | 4h | Pending |
| T210: Landscape Support | 3h | Pending |
| Testing & Polish | 2h | Pending |
| **Total** | **16h** | **20% Complete** |

---

## Success Metrics

- All 4 UX features fully implemented
- No accessibility regressions
- Positive user feedback on dark mode
- No performance impact from sound system
- 100% responsive across tablet sizes
- Smooth orientation transitions

---

**Next Steps**:
1. Start with T211 (complete sound system)
2. Then T212 (complete dark mode)
3. Then T209 (tablet layouts)
4. Finally T210 (landscape support)
5. Comprehensive cross-device testing
