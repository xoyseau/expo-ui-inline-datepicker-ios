# @expo/ui iOS inline DateTimePicker keeps a wrong height (expo#47765)

Measurements for [expo/expo#47765](https://github.com/expo/expo/issues/47765) on `@expo/ui@57.0.21` (SDK 57), before and after `patches/@expo%2Fui@57.0.21.patch`.

## Run

```sh
bun install          # applies the patch (package.json patchedDependencies)
bunx expo run:ios
```

To see the unpatched picker, remove `patchedDependencies` from `package.json`, delete `node_modules/@expo/ui` and run `bun install` again.

To test the largest accessibility text size, run this and relaunch the app:

```sh
xcrun simctl ui booted content_size accessibility-extra-extra-extra-large
```

## What the screen does

The screen shows two inline `DateTimePicker`s (`display="inline"`, `mode="date"`). One is set to August 2026, which spans 6 calendar weeks, and the other to October 2026, which spans 5.

Each picker sits in a red-bordered `View`, and the screen lists every height that view reported through `onLayout`. Three seconds after launch the app moves both selections forward by one day, the same as tapping a date. Tapping the label at the top does it again.

The labels ignore the text size setting, so the calendars stay on screen at accessibility sizes.

## Results

The heights include the 2pt border, so each is the `Host` height plus 2. That keeps them matching the screenshots. The widths are the `Host` width inside the border, and AX5 is the largest accessibility text size.

| Build | Simulator | Text size | Aug (6 weeks) | Oct (5 weeks) |
| --- | --- | --- | --- | --- |
| Unpatched | iPhone 17 Pro, iOS 26.5 (368pt) | Large | 376.67, then 360.33 after re-selection | 376.67, then 395.67 after re-selection |
| Unpatched | iPhone 15, iOS 17.0 (359pt) | Large | 2, then 308.67, later 336.33 | 2, then 308.67, later 336.33 |
| Patched | iPhone 17 Pro, iOS 26.5 (368pt) | Large | 360.33, unchanged | 360.33, unchanged |
| Patched | iPhone 17 Pro, iOS 26.5 (368pt) | AX5 | 455.67, unchanged, last row visible | 455.67, unchanged |
| Patched | iPhone 16, iOS 18.6 (359pt) | Large | 353.67, unchanged | 353.67, unchanged |
| Patched | iPhone 16, iOS 18.6 (359pt) | AX5 | 455.67, unchanged, last row visible | 455.67, unchanged |
| Patched | iPhone 15, iOS 17.0 (359pt) | Large | 2, then 336.33, unchanged | 2, then 336.33, unchanged |
| Patched | iPhone 15, iOS 17.0 (359pt) | AX5 | 2, then 439.33, unchanged, last row visible | 2, then 439.33, unchanged |

Without the patch, the first height the picker reports is wrong. It's too tall on iOS 26.5, with empty space under the last row, and too short on iOS 17. On iOS 26.5 the first `Host` height is 374.67, the same intermediate value #47765 reports on the same iOS version, and it stays there until the selection changes (screenshot 1). Re-selecting doesn't reliably fix it either, because on iOS 26.5 the 5-week month then ends up taller than the 6-week one. On iOS 17 the repro doesn't show what moved the height from 308.67 to 336.33.

With the patch, the first measured height is already the final one and it doesn't change. It's also the same for 5-week and 6-week months, because the calendar always reserves six rows, so paging between months can't change it.

The leading 2 on iOS 17 is the border before the `Host` has measured anything, meaning a `Host` height of 0. It appears with and without the patch.

Screenshots for every row are in `screenshots/`.

## Why the patch measures an off-screen copy

As an experiment, the patch was changed to measure the on-screen picker in `sizeThatFits` instead of the off-screen copy, with nothing else changed. On iOS 26.5 August reported 360.33 and stayed there, but October went from 360.33 to 428.33 after re-selection (`screenshots/10-experiment-measure-onscreen-ios26.5.png`). Measuring the on-screen picker isn't stable, and the off-screen copy is what keeps the height fixed.

## Changing the text size while the picker is on screen

With the app open at the default size, the text size was switched to AX5 with `xcrun simctl ui ... content_size` and then back again. Both months follow it and match the heights of a fresh launch at each size.

| Simulator | Large | Switched to AX5 | Back to Large |
| --- | --- | --- | --- |
| iPhone 17 Pro, iOS 26.5 | 360.33 | 455.67, last row visible | 360.33 |
| iPhone 15, iOS 17.0 | 336.33 | 439.33, last row visible | 336.33 |

Screenshots 11 to 14 show this. An earlier version of the patch kept one off-screen picker and updated its `traitOverrides`. Its trait collection only picked up the new size after `updateTraitsIfNeeded()`, and even then it measured 370 on iOS 26.5 instead of 455.67. So the patch now makes a new off-screen picker whenever the text size changes.

Caching the on-screen picker's first measurement, which needs no off-screen picker at all, was also tried. It re-measured the laid-out picker after the switch and got 385.67 for August and 453.67 for October instead of 455.67, which is why the off-screen picker stays.

## Not covered

`@expo/ui` supports iOS 16.4, but no iOS 16 simulator was available, so iOS 17.0 is the oldest version tested. iOS 27 wasn't tested either, so iOS 26.5 is the newest. The patch copies the content size category onto its off-screen picker with `traitOverrides`, which needs iOS 17, so on iOS 16 that picker may not follow accessibility text sizes.
