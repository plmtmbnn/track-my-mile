import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { COLORS } from '@/constants/theme';

interface SpeedGaugeProps {
  speed: number;
  maxSpeed?: number;
  targetSpeed?: number;
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export const SpeedGauge: React.FC<SpeedGaugeProps> = ({
  speed,
  maxSpeed = 20,
  targetSpeed,
  size = 180,
}) => {
  const animatedSpeed = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedSpeed, {
      toValue: speed,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  }, [speed]);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.055;
  const startAngle = -220;
  const endAngle = 40;
  const totalAngle = endAngle - startAngle;

  const speedRatio = Math.min(speed / maxSpeed, 1);
  const targetRatio = targetSpeed ? Math.min(targetSpeed / maxSpeed, 1) : null;

  const currentAngle = startAngle + totalAngle * speedRatio;
  const targetAngle = targetRatio !== null ? startAngle + totalAngle * targetRatio : null;

  const bgArcPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const speedArcPath =
    speedRatio > 0.005
      ? describeArc(cx, cy, radius, startAngle, Math.min(currentAngle, endAngle))
      : null;

  // Needle position
  const needlePoint = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 2, currentAngle);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={COLORS.successDim} />
            <Stop offset="60%" stopColor={COLORS.primary} />
            <Stop offset="100%" stopColor="#ff6b35" />
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Path
          d={bgArcPath}
          stroke={COLORS.bgHighlight}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Speed arc */}
        {speedArcPath && (
          <Path
            d={speedArcPath}
            stroke="url(#speedGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Target speed marker */}
        {targetAngle !== null && (
          <G>
            {(() => {
              const tp = polarToCartesian(cx, cy, radius, targetAngle);
              const innerP = polarToCartesian(cx, cy, radius - strokeWidth - 4, targetAngle);
              return (
                <>
                  <Path
                    d={`M ${tp.x} ${tp.y} L ${innerP.x} ${innerP.y}`}
                    stroke={COLORS.warning}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  <Circle cx={tp.x} cy={tp.y} r={4} fill={COLORS.warning} />
                </>
              );
            })()}
          </G>
        )}

        {/* Needle dot */}
        <Circle cx={needlePoint.x} cy={needlePoint.y} r={5} fill={COLORS.textPrimary} opacity={0.9} />

        {/* Center decoration */}
        <Circle cx={cx} cy={cy} r={size * 0.08} fill={COLORS.bgCard} />
        <Circle cx={cx} cy={cy} r={size * 0.04} fill={COLORS.primary} opacity={0.6} />
      </Svg>

      {/* Speed value overlay */}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', top: size * 0.1 }]}>
        <Text style={[styles.speedValue, { fontSize: size * 0.2 }]}>
          {speed.toFixed(1)}
        </Text>
        <Text style={[styles.speedUnit, { fontSize: size * 0.07 }]}>km/h</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  speedValue: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textShadowColor: COLORS.primary,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  speedUnit: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
