import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import THEMES from '@/constants/themes';

export interface OtherUserProps {
  username: string;
  bannerColor: string;
  theme: keyof typeof THEMES;
  photoURL: string | null;
  onRemove?: () => void;
  onBlock?: () => void;
  onAdd?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  requestSent?: boolean;
}

function ActionChip({
  icon,
  label,
  color,
  onPress,
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[
        styles.actionChip,
        { backgroundColor: color, opacity: disabled || !onPress ? 0.65 : 1 },
      ]}
    >
      <Ionicons name={icon} size={15} color="#fff" />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function OtherUser({
  username,
  bannerColor,
  theme,
  photoURL,
  onRemove,
  onBlock,
  onAdd,
  onAccept,
  onReject,
  onCancel,
  requestSent,
}: OtherUserProps) {
  const userTheme = THEMES[theme] || THEMES.Dark;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: userTheme.surface,
          borderColor: userTheme.border,
        },
      ]}
    >
      <View style={[styles.banner, { backgroundColor: bannerColor }]} />

      <View style={styles.identityRow}>
        <Image
          source={photoURL ? { uri: photoURL } : require('@/assets/images/default.jpg')}
          style={styles.avatar}
        />
        <View style={styles.identityCopy}>
          <Text style={[styles.username, { color: userTheme.text }]} numberOfLines={1}>
            {username}
          </Text>
          <View style={styles.themePill}>
            <View style={[styles.themeSwatch, { backgroundColor: userTheme.primary }]} />
            <Text style={[styles.themeText, { color: userTheme.text }]}>{theme} theme</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {onAccept ? (
          <ActionChip icon="checkmark" label="Accept" color="#2e9b57" onPress={onAccept} />
        ) : null}
        {onReject ? (
          <ActionChip icon="close" label="Reject" color="#d04a4a" onPress={onReject} />
        ) : null}
        {onAdd ? (
          requestSent ? (
            <ActionChip icon="paper-plane-outline" label="Sent" color="#3f78c9" disabled />
          ) : (
            <ActionChip icon="person-add-outline" label="Add" color="#2e9b57" onPress={onAdd} />
          )
        ) : null}
        {onCancel ? (
          <ActionChip
            icon="close-circle-outline"
            label="Cancel"
            color="#7a4fd1"
            onPress={onCancel}
          />
        ) : null}
        {onRemove ? (
          <ActionChip
            icon="person-remove-outline"
            label="Remove"
            color="#d04a4a"
            onPress={onRemove}
          />
        ) : null}
        {onBlock ? (
          <ActionChip icon="hand-left-outline" label="Block" color="#d88928" onPress={onBlock} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 14,
  },
  banner: {
    height: 70,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: -24,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#d1d5db',
  },
  identityCopy: {
    flex: 1,
    marginLeft: 14,
    paddingTop: 24,
  },
  username: {
    fontSize: 19,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
  themePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  themeSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  themeText: {
    fontSize: 12,
    opacity: 0.8,
    fontFamily: 'Parkinsans',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Parkinsans',
  },
});
