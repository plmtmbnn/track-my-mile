# TrackMyMile - Gemini Context

## Project Overview
TrackMyMile is a production-grade React Native application for treadmill workout tracking and control. It leverages the Bluetooth Low Energy (BLE) FiTness Machine Service (FTMS) protocol to provide real-time metrics, automated workout coaching, and active treadmill control.

## Core Mandates
- **Stability & Reliability (Phase 1):** Robust BLE lifecycle with auto-reconnect and exponential backoff. No duplicate subscriptions; guaranteed cleanup.
- **Data Integrity (Phase 2):** High-fidelity metrics via monotonic validation and spike filtering. All raw data must pass through the `DataProcessor` before UI/Storage.
- **Immersive Feedback (Phase 3):** Hands-free operation via Text-to-Speech (TTS) and Haptic cues. Real-time pace trend analysis (Increasing/Decreasing/Stable).
- **Safety First (Phase 4):** All treadmill control commands must pass through the `SafetyGuard`. No sudden speed jumps (max 2km/h delta). Emergency stop on disconnect.
- **Performance:** Maintain 60FPS UI using `react-native-reanimated`. Avoid re-renders from 1Hz/10Hz BLE data streams.

## Technical Stack
- **Framework:** React Native 0.84.x (TypeScript)
- **BLE:** `react-native-ble-plx` (FTMS Service 0x1826)
- **State:** Zustand + MMKV persistence.
- **Feedback:** `react-native-tts` (Audio) and Native Vibration API (Haptics).
- **Logic:** Core business logic is strictly decoupled from UI in `src/core/`.

## Project Structure
- `src/core/`: The "Brain" of the application (Domain-driven modules).
    - `ble/`: Connection lifecycle, auto-reconnect, and subscription management.
    - `metrics/`: Data pipeline, smoothing (Moving Average), and Lap tracking.
    - `experience/`: Audio/Haptic services and workout feedback controllers.
    - `control/`: FTMS command implementation, Workout Engine, and Safety Guard.
- `src/components/`: Pure UI components (feature-based).
- `src/hooks/`: React-side bridges to core services (e.g., `useWorkoutSession`).
- `src/utils/`: Parsers (FTMS), Generators (GPX), and stateless formatters.

## Key Workflows
1. **Data Pipeline:** `BLEManager` (Raw) → `DataProcessor` (Smoothed/Validated) → `WorkoutFeedbackController` (Audio/Haptics) → `Store/UI`.
2. **Active Control:** `WorkoutEngine` (Auto Mode) → `SafetyGuard` (Validation) → `FTMSController` (BLE Binary Command) → Treadmill.
3. **Workout Lifecycle:** Explicit states: `IDLE` -> `RUNNING` -> `PAUSED` -> `STOPPED` -> `SAVED`.
4. **Auto-Laps:** Every 1,000m, `LapTracker` emits a split summary for coaching feedback.

## Coding Conventions
- **Modular Logic:** Business logic must reside in `src/core` classes. Components should be "thin" view layers.
- **Strict Typing:** Every BLE characteristic and workout metric must have a corresponding interface in `types.ts`.
- **Command Safety:** Never call `ftmsController.setSpeed` directly without `safetyGuard` validation.
- **Resource Cleanup:** All BLE subscriptions and TTS queues must be explicitly cleared in `destroy()` or `stop()` methods.

## Documentation Reference
- **FTMS Service:** 0x1826
- **Treadmill Data Char:** 0x2ACD (Read/Notify)
- **FTMS Control Point:** 0x2AD9 (Write/Indicate)
- **GPX Schema:** Standard v1.1 for Garmin/Strava compatibility.
