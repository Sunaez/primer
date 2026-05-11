import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface EmptyStateProps {
  title: string;
  description: string;
  theme: {
    surface: string;
    text: string;
    border: string;
  };
  accentColor: string;
  icon?: keyof typeof Ionicons.glyphMap;
  imageSource?: ImageSourcePropType;
}

export default function EmptyState({
  title,
  description,
  theme,
  accentColor,
  icon = 'sparkles',
  imageSource,
}: EmptyStateProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {imageSource ? (
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: accentColor }]}>
          <Ionicons name={icon} size={28} color="#fff" />
        </View>
      )}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.text }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  image: {
    width: 88,
    height: 88,
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Parkinsans',
    textAlign: 'center',
    opacity: 0.8,
  },
});
