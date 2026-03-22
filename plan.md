# TURTLESHELL — Active Issues & Fix Plan
Last updated: 2026-03-10

---

## BOT ISSUES

### BOT-1 — Bot re-processes already-done accounts (ACTIVE)
- processed_ids.json persists to disk ✓
- conv_hash early-skip removed ✓
- REMAINING: Rewrite _process_conversation logic:
  1. Find keyword + post_link in messages
  2. Check LIVE if replied (outgoing bubbles) → no? reply
  3. Check LIVE if reposted → no? repost
  4. Mark processed only after BOTH confirmed
  - processed_ids = last gate only, not first gate

### BOT-2 — Bot cant read messages inside conversation (ACTIVE)
- messageEntry, dir=auto, dm-panel all return 0
- debug HTML is inbox snapshot not inside-convo snapshot
- inside_conv debug save added but not yet confirmed firing
- Root cause: snapshot taken before messages render

---

## SITE ISSUES

### SITE-1 — Mobile scroll reveal elements not showing (ACTIVE)
- Elements with .reveal class stay hidden on iOS
- IntersectionObserver fires at threshold:0 on mobile ✓
- BUT: observer fires DURING intro overlay — elements are
  technically "in viewport" but covered → observer marks them visible
  then overlay clears → elements now need re-check but observer already fired
- Fix: after finishIntro(), force re-run refreshRevealObserverTargets()
  AND reset .reveal elements that are in viewport to visible immediately
  Keep the fade animation exactly as-is — just ensure timing is right

### SITE-2 — Mobile intro timing / fitment (ACTIVE)
- Intro timing is good (4200ms fallback, 11000ms max)
- premiumSurfaceIn uses fill-mode: forwards (fixed from both) ✓
- Issue: phone screen fitment of intro itself needs checking
- Desktop animations stay exactly the same
- Mobile: same animations, just ensure elements visible after intro clears

### SITE-3 — Site doesnt auto-refresh on deploy for users (ACTIVE)
- No service worker or cache busting in place
- Users see stale version until they manually refresh
- Fix: Add Next.js ISR revalidation + cache-control headers in next.config
  OR add a simple version check that polls /api/version and hard-reloads
  when build ID changes — like big sites do silently in background

### SITE-4 — Activity log spacing glitch after Stop (FIXED ✓)
### SITE-5 — Activity log shows raw debug lines (FIXED ✓)

---

## PENDING FEATURES
### FEAT-1 — Require Sign-In for Contact / Request Forms
### FEAT-2 — Forgot Password

---

## PRIORITY ORDER
1. BOT-1 + BOT-2
2. SITE-1 + SITE-2 (mobile broken for users/friends)
3. SITE-3 (auto-refresh on deploy)
4. FEAT-1, FEAT-2
