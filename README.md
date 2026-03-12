# ⚡ FTMS Treadmill Controller

React Native + Expo app to connect and control FTMS-compatible treadmills via Bluetooth LE.

## Features (MVP v1)
- 📱 **Landscape-only** layout optimized for runtime use
- 🔵 **BLE Scan** — discovers nearby FTMS treadmills (filters by FTMS Service UUID)
- 🔗 **Connect/Disconnect** with auto-service discovery
- 📊 **Live Metrics** via Treadmill Data characteristic (0x2ACD) notifications:
  - Speed (current + average), Distance, Inclination
  - Elapsed time, Pace, Calories, Heart Rate, MET
- 🎮 **Machine Control** via FTMS Control Point (0x2AD9):
  - Start / Pause / Stop
  - Set speed (+0.1 / +1 increments + quick presets)
  - Set inclination (+0.5 / +1 increments + quick presets)
- 🎨 Dark industrial UI with animated speed gauge

---

## Tech Stack
| Library | Purpose |
|---|---|
| `react-native-ble-plx` | Bluetooth LE |
| `expo-screen-orientation` | Lock to landscape |
| `@rneui/themed` | UI theme context |
| `react-native-svg` | Speed gauge |
| `expo-router` | Navigation |

---

## Setup

### 1. Prerequisites
- Node.js 18+
- Expo CLI: `npm i -g expo-cli`
- EAS CLI (for builds): `npm i -g eas-cli`
- Android: Android Studio + physical device with BLE
- iOS: Xcode + physical iPhone/iPad (BLE doesn't work in simulator)

### 2. Install dependencies
```bash
cd track-my-mile
npm install
```

### 3. Run in development (Expo Go won't work — BLE requires dev build)

**Android:**
```bash
npx expo run:android
```

**iOS:**
```bash
npx expo run:ios
```

### 4. Build for production
```bash
# Configure EAS first
eas build:configure

# Android APK
eas build --platform android --profile preview

# iOS IPA
eas build --platform ios --profile preview
```

---

## Android Permissions
Automatically requested at runtime. Defined in `app.json`:
- `BLUETOOTH_SCAN`
- `BLUETOOTH_CONNECT`
- `ACCESS_FINE_LOCATION`

## iOS Permissions
Defined in `app.json` → `infoPlist`:
- `NSBluetoothAlwaysUsageDescription`

---

## Project Structure
```
track-my-mile/
├── app/
│   ├── _layout.tsx          # Root layout (landscape lock, theme)
│   └── index.tsx            # App entry → DashboardScreen
├── src/
│   ├── types/
│   │   └── ftms.ts          # All FTMS UUIDs, types, constants
│   ├── services/
│   │   ├── ftmsParser.ts    # BLE byte parser (per FTMS spec)
│   │   └── ftmsService.ts   # BLE manager, connect, notify, control
│   ├── hooks/
│   │   └── useFTMS.ts       # State management hook
│   ├── components/
│   │   ├── SpeedGauge.tsx   # SVG arc gauge
│   │   ├── MetricCard.tsx   # Data display card
│   │   ├── SpeedControl.tsx # +/- speed control
│   │   ├── InclinationControl.tsx
│   │   ├── ControlButton.tsx
│   │   └── DeviceList.tsx   # BLE device scanner list
│   ├── screens/
│   │   └── DashboardScreen.tsx  # Main landscape UI
│   └── constants/
│       └── theme.ts         # Colors, spacing, typography
├── app.json                 # Expo config + permissions
├── package.json
└── tsconfig.json
```

---

## FTMS Bluetooth Protocol Reference

| Characteristic | UUID | Usage |
|---|---|---|
| Fitness Machine Feature | `0x2ACC` | Read supported features |
| Treadmill Data | `0x2ACD` | Notify — live metrics |
| Fitness Machine Control Point | `0x2AD9` | Write — start/stop/speed |
| Fitness Machine Status | `0x2ADA` | Notify — machine state |
| Supported Speed Range | `0x2AD4` | Read speed limits |
| Supported Inclination Range | `0x2AD5` | Read incline limits |

### Control Point Op Codes
| Op Code | Hex | Description |
|---|---|---|
| Request Control | `0x00` | Must call before any write |
| Start/Resume | `0x07` | Start belt |
| Stop/Pause | `0x08` | `0x01`=stop, `0x02`=pause |
| Set Target Speed | `0x02` | 2 bytes, unit 0.01 km/h |
| Set Target Inclination | `0x03` | 2 bytes signed, unit 0.1% |

---

## Troubleshooting

**"BLE not available"** — Run on a physical device, not simulator/emulator

**Treadmill not found** — Some manufacturers use proprietary UUIDs alongside FTMS. Try removing the service UUID filter in `ftmsService.ts` → `startScan()` if your device isn't appearing.

**"Control not permitted"** — The treadmill may require you to press Start on the physical console first before accepting remote control.

**iOS build fails** — Make sure you have a valid provisioning profile and the BLE entitlements are set in your Apple Developer account.
# track-my-mile
