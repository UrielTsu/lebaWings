import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../hooks/useCart';
import { MenuItemCard } from '../components/MenuItemCard';
import { WaiterApi } from '../services/api';

const TABLES = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Barra 1', 'Barra 2', 'Terraza 1'];

export const TakeOrderScreen: React.FC = () => {
  const {
    menu,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading,
    refreshing,
    onRefresh,
    error,
  } = useMenu();

  const {
    cart,
    tableNumber,
    setTableNumber,
    waiterName,
    setWaiterName,
    generalNotes,
    setGeneralNotes,
    addItem,
    removeItem,
    clearCart,
    totalAmount,
    totalWeight,
    totalItemsCount,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);

  const handleSendOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Comanda vacía', 'Selecciona al menos un producto antes de enviar.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        table_number: tableNumber,
        waiter_name: waiterName,
        notes: generalNotes,
        items: cart.map((ci) => ({
          menu_item_id: ci.menu_item.id,
          quantity: ci.quantity,
          sauce_or_notes: ci.sauce_or_notes,
        })),
      };

      const res = await WaiterApi.submitOrder(payload);

      if (res.success) {
        Alert.alert(
          '¡Comanda Enviada!',
          `Orden #${res.data?.order_id} enviada con éxito para ${tableNumber}. Peso total: ${res.data?.total_weight} pts.`
        );
        clearCart();
        setIsCartModalVisible(false);
      }
    } catch (err: any) {
      // Si un producto se agotó en cocina concurrentemente, el backend lo reportará
      Alert.alert('Error de Envío', err.message || 'No se pudo enviar la orden a cocina.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuantityInCart = (itemId: number) => {
    const item = cart.find((ci) => ci.menu_item.id === itemId);
    return item ? item.quantity : 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Superior: Mesero y Mesa */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pubTitle}>LEBA WINGS 🍗</Text>
          <Text style={styles.waiterText}>Mesero: {waiterName}</Text>
        </View>

        <View style={styles.tableSelector}>
          <Text style={styles.tableLabel}>Mesa:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TABLES.map((table) => (
              <TouchableOpacity
                key={table}
                style={[styles.tableChip, tableNumber === table && styles.tableChipActive]}
                onPress={() => setTableNumber(table)}
              >
                <Text
                  style={[
                    styles.tableChipText,
                    tableNumber === table && styles.tableChipTextActive,
                  ]}
                >
                  {table}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Selector de Categorías */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catTab, selectedCategory === cat && styles.catTabActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.catTabText,
                  selectedCategory === cat && styles.catTabTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista del Menú con Stock Booleano */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E11D48" />
          <Text style={styles.centerText}>Cargando carta de Leba Wings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryBtnText}>Reintentar conexión</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={menu}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MenuItemCard
              item={item}
              onAdd={addItem}
              quantityInCart={getQuantityInCart(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Barra Flotante de Comanda Activa */}
      {cart.length > 0 && (
        <View style={styles.floatingBar}>
          <TouchableOpacity
            style={styles.floatingBarContent}
            onPress={() => setIsCartModalVisible(true)}
            activeOpacity={0.85}
          >
            <View>
              <Text style={styles.floatingCount}>
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} • {tableNumber}
              </Text>
              <Text style={styles.floatingWeight}>Carga de cocina: {totalWeight} pts</Text>
            </View>
            <View style={styles.floatingRight}>
              <Text style={styles.floatingTotal}>${totalAmount.toFixed(2)}</Text>
              <Text style={styles.floatingAction}>Ver Comanda ➔</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Confirmación y Detalle de Comanda */}
      <Modal
        visible={isCartModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCartModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comanda Actual - {tableNumber}</Text>
              <TouchableOpacity onPress={() => setIsCartModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalItemsList}>
              {cart.map((cItem, index) => (
                <View key={`${cItem.menu_item.id}-${index}`} style={styles.modalItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemName}>{cItem.menu_item.name}</Text>
                    <Text style={styles.modalItemSub}>
                      ${cItem.menu_item.price.toFixed(2)} c/u • Peso P{cItem.menu_item.prep_weight}
                    </Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => removeItem(cItem.menu_item.id, cItem.sauce_or_notes)}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyNum}>{cItem.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => addItem(cItem.menu_item, cItem.sauce_or_notes)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notas para cocina / barra:</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Ej: Alitas bien doradas, salsa aparte..."
                  value={generalNotes}
                  onChangeText={setGeneralNotes}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSendOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>🚀 Mandar Comanda a Cocina</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pubTitle: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: 0.5 },
  waiterText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  tableSelector: { marginTop: 10 },
  tableLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 },
  tableChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  tableChipActive: { backgroundColor: '#111827' },
  tableChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  tableChipTextActive: { color: '#FFFFFF' },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  catTabActive: { backgroundColor: '#E11D48' },
  catTabText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  catTabTextActive: { color: '#FFFFFF' },
  listContent: { padding: 14, paddingBottom: 100 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centerText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  retryBtnText: { color: '#FFF', fontWeight: '600' },
  floatingBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 14,
    backgroundColor: '#111827',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  floatingBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  floatingCount: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  floatingWeight: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  floatingRight: { alignItems: 'flex-end' },
  floatingTotal: { color: '#4ADE80', fontSize: 17, fontWeight: '800' },
  floatingAction: { color: '#F3F4F6', fontSize: 11, fontWeight: '600', marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  closeBtn: { fontSize: 20, fontWeight: '700', color: '#9CA3AF' },
  modalItemsList: { maxHeight: 320 },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  modalItemSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  qtyNum: { marginHorizontal: 10, fontSize: 14, fontWeight: '700' },
  notesSection: { marginTop: 16 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    fontSize: 13,
    minHeight: 50,
  },
  modalFooter: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#111827' },
  submitButton: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
