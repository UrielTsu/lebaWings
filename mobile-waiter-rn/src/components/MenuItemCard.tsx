import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MenuItem } from '../types';

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  quantityInCart?: number;
}

export const MenuItemCard: React.FC<Props> = ({ item, onAdd, quantityInCart = 0 }) => {
  const isAvailable = item.is_available;

  // Visualización del peso de cocina (1 = Rápido, 2 = Medio, 3 = Complejo)
  const getWeightBadge = (weight: number) => {
    switch (weight) {
      case 1:
        return { label: '⚡ Rápido (P1)', bg: '#DCFCE7', text: '#15803D' };
      case 2:
        return { label: '⏱️ Medio (P2)', bg: '#FEF3C7', text: '#B45309' };
      case 3:
        return { label: '🔥 Complejo (P3)', bg: '#FEE2E2', text: '#B91C1C' };
      default:
        return { label: `P${weight}`, bg: '#F3F4F6', text: '#4B5563' };
    }
  };

  const badge = getWeightBadge(item.prep_weight);

  return (
    <View style={[styles.card, !isAvailable && styles.cardDisabled]}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, !isAvailable && styles.textDisabled]}>
            {item.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: isAvailable ? badge.bg : '#E5E7EB' }]}>
            <Text style={[styles.badgeText, { color: isAvailable ? badge.text : '#9CA3AF' }]}>
              {isAvailable ? badge.label : 'Agotado'}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>

          {isAvailable ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => onAdd(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.addButtonText}>
                {quantityInCart > 0 ? `+ Añadir (${quantityInCart})` : '+ Añadir'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.disabledTag}>
              <Text style={styles.disabledTagText}>No disponible</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
    borderColor: '#E5E7EB',
  },
  content: {
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  textDisabled: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E11D48', // Color temático Leba Wings (Red Crimson)
  },
  addButton: {
    backgroundColor: '#111827',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledTag: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  disabledTagText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
});
