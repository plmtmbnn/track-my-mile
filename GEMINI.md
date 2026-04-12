# TrackMyMile - Gemini Context

## Project Overview
TrackMyMile is a production-grade React Native application for treadmill workout tracking and control. It leverages the Bluetooth Low Energy (BLE) FiTness Machine Service (FTMS) protocol to provide real-time metrics, automated workout coaching, and active treadmill control.

## Core Mandates
- **Stability & Reliability (Phase 1):** Robust BLE lifecycle with auto-reconnect and exponential backoff. Guaranteed cleanup of subscriptions.
- **Data Integrity (Phase 2):** High-fidelity metrics via monotonic validation and spike filtering. All data must pass through `DataProcessor` to handle machine resets.
- **Immersive Feedback (Phase 3):** Hands-free operation via prioritized Audio (TTS) and Haptic cues. Real-time pace trend analysis.
- **Active Control (Phase 4):** Commands must pass through `SafetyGuard`. Emergency auto-pause on 5s zero-speed detection or BLE disconnect.
- **Elite Experience (Phase 5):** Velocity-first "Living Interface". Massive typography (110pt) for readability at speed. Dynamic chroma-feedback backgrounds.

## Technical Stack
- **Framework:** React Native 0.84.x (TypeScript)
- **BLE:** `react-native-ble-plx` (FTMS Service 0x1826)
- **State:** Zustand + MMKV persistence for UI preferences and workout history.
- **Animations:** `react-native-reanimated` + `moti` for 60FPS liquid transitions.
- **Visuals:** `@react-native-community/blur` for Glassmorphism; `react-native-linear-gradient` for dynamic backgrounds.

## Project Structure
- `src/core/`: The "Brain" (Domain-driven logic).
    - `ble/`: Connection lifecycle and subscription management.
    - `metrics/`: Data pipeline and Monotonic distance validation.
    - `experience/`: AudioController (prioritized queue) and HapticService.
    - `control/`: FTMS command implementation and Safety Guard.
- `src/components/`: Adaptive UI components.
    - `Dashboard/`: GlassCard, AnimatedMetric, StatusBanner (Goal tracking).
    - `Charts/`: CombinedWorkoutChart (Dual-axis Speed/Incline).
- `src/hooks/`: Business logic bridges.
    - `useWorkoutSession`: Accurate timer and session state machine.
    - `useGoalTracking`: Real-time "Ahead/Behind" performance derivation.
- `src/utils/`: 
    - `ChartScaler`: Smooth interpolation (Lerp/Smoothstep) for dynamic scaling.
    - `ChartLabelGenerator`: Distance-aware label formatting (meters vs km).

## Key Workflows
1. **Performance Mapping:** `Data` → `ChartScaler` (Smooth interpolation) → `ChartLabelGenerator` → `LineChart`.
2. **Auto-Pause:** `useWorkoutSession` monitors 1Hz stream → Triggers `PAUSE` if Speed=0 for >5s or BLE state disconnects.
3. **Interactive Summary:** `FINISHED` state → Modal with Save GPX (History), Discard (Reset), or Share (Native) actions.
4. **Onboarding:** Launch-time check for Bluetooth and Location permissions via `Alert` + `Linking`.

## Coding Conventions
- **Non-Breaking Layers:** UI enhancements must consume core data without mutating underlying engine logic.
- **Named Exports:** UI components MUST use named exports to prevent `undefined` element errors.
- **Memoization:** Wrap all heavy charting and label generation in `useMemo` keyed to the 1Hz update.
- **Resource Cleanup:** `handleTerminate` must be used for full disconnection and state reset.

## Documentation Reference
- **FTMS Service:** 0x1826
- **Treadmill Data Char:** 0x2ACD (Read/Notify)
- **FTMS Control Point:** 0x2AD9 (Write/Indicate)
- **Speed Resolution:** 0.01 km/h (FTMS Standard)
- **Incline Resolution:** 0.1 % (FTMS Standard)
