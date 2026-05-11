import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface MetricPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  textColor: string;
  accentColor: string;
  backgroundColor: string;
}

export default function MetricPill({
  icon,
  label,
  value,
  textColor,
  accentColor,
  backgroundColor,
}: MetricPillProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.iconWrap, { backgroundColor: accentColor }]}>
        <Ionicons name={icon} size={16} color="#fff" />
      </View>
      <View>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        <Text style={[styles.value, { color: textColor }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    opacity: 0.75,
    fontFamily: 'Parkinsans',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
});
