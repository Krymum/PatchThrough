# Patch Through

A small idle game about a night operator at a 1950s small-town telephone
exchange. Calls light up the switchboard and you patch them through by hand.
Little by little, apprentices, then automatic switches, take the work off
your hands, until there is nothing left to plug in.

It has an ending. The exchange goes fully automatic, the position is
abolished, and the credits roll. There is no prestige loop and no exploding
numbers.

> Work in progress: the whole progression is playable, from the first lamp
> to the automatic exchange. Stories, sound and final art are on the way.

## Play

The game runs in any modern browser, on desktop or phone. Tap (or click) a
lit lamp to answer, then tap the jack the caller asks for. Keyboard players
can use <kbd>Tab</kbd>, <kbd>Enter</kbd> and <kbd>Escape</kbd>.

Progress is saved in your browser's local storage. Apprentices and automatic
switches keep earning while you are away, at half rate and for up to four
hours.

## Pacing

A full shift lasts about two and a half hours:

| Stage                  | Around      | What changes                                  |
| ---------------------- | ----------- | --------------------------------------------- |
| The night shift        | 0–15 min    | Main Street, a handful of cords               |
| The town grows         | 15–40 min   | Mill Row and Hilltop join the board           |
| The apprentices        | 40–80 min   | Colleagues answer the lamps you leave ringing |
| The switches           | 80–120 min  | Grey cabinets replace districts, seats empty  |
| Dial telephones        | 120–140 min | Only long-distance calls still need you       |
| The automatic exchange | ~140 min    | The board falls silent                        |

`src/game/balance.test.ts` plays the whole game with a scripted operator and
fails if a stage drifts outside its window, so tuning stays honest.

## Run it locally

Requires Node.js 22 or later.

```sh
npm install
npm run dev       # start the dev server
npm test          # run the unit tests
npm run lint      # ESLint + Prettier check
npm run build     # type-check and build the static site into dist/
```

## How the code is organised

```
src/
  game/      Pure TypeScript game logic: no React, no DOM, fully unit-tested.
    config.ts       Every balance value, in one place.
    engine.ts       Event-driven, seeded simulation (deterministic).
    progression.ts  Districts, apprentices and income, derived from purchases.
    offline.ts      Capped catch-up for time spent away.
    save/           Versioned save format, migrations, guarded storage access.
  content/   All player-facing text. English is the reference; French is
             type-checked against it, so a missing string fails the build.
  ui/        React components, styles, and the single hook bridging React
             to the engine.
```

## Contributing

Issues and pull requests are welcome.

- Keep game rules in `src/game/` and cover them with tests.
- Put tuning numbers in `src/game/config.ts`, not in the code that uses them.
- Add new text to both `src/content/en` and `src/content/fr`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).
- `npm run lint`, `npm test` and `npm run build` must pass with no warnings;
  CI runs the same checks on every push.

## Credits

All code, text and graphics are original to this project. Graphics are drawn
with SVG and CSS; no external images are used. The town of Larkfield and everyone in it are
fictional.

## License

[MIT](LICENSE)
