import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  accentColor: string;
  textColor: string;
  mutedColor?: string;
  rightSlot?: React.ReactNode;
  centered?: boolean;
}

export default function ScreenHeader({
  eyebrow,
  title,
  description,
  accentColor,
  textColor,
  mutedColor,
  rightSlot,
  centered = false,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.row, centered && styles.centeredRow]}>
      <View style={styles.copy}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: accentColor }, centered && styles.centeredText]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: textColor }, centered && styles.centeredText]}>
          {title}
        </Text>
        {description ? (
          <Text
            style={[
              styles.description,
              { color: mutedColor || textColor },
              centered && styles.centeredText,
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  centeredRow: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
  },
  rightSlot: {
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: 'Parkinsans',
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'Parkinsans',
    fontWeight: '700',
  },
  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Parkinsans',
  },
  centeredText: {
    textAlign: 'center',
  },
});
