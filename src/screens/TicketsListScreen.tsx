import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { ticketService } from '../services/api';
import { Ticket, TicketStatus } from '../types/ticket.types';
import { MainStackNavigationProp } from '../types/navigation.types';

const TicketsListScreen = () => {
  const navigation = useNavigation<MainStackNavigationProp<'TicketsList'>>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statusOptions = [
    { id: 'all', label: 'Todos', icon: 'apps' },
    { id: 'open', label: 'Abiertos', icon: 'mail-open' },
    { id: 'in_progress', label: 'En proceso', icon: 'time' },
    { id: 'resolved', label: 'Resueltos', icon: 'checkmark-circle' },
    { id: 'closed', label: 'Cerrados', icon: 'close-circle' },
  ];

  const loadTickets = async () => {
    try {
      const params = selectedStatus !== 'all' ? { status: selectedStatus } : {};
      const response = await ticketService.getAll(params);
      setTickets(response.data);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [selectedStatus])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return '#FF9800';
      case 'in_progress':
        return '#2196F3';
      case 'resolved':
        return '#4CAF50';
      case 'closed':
        return '#757575';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'Abierto';
      case 'in_progress':
        return 'En proceso';
      case 'resolved':
        return 'Resuelto';
      case 'closed':
        return 'Cerrado';
      default:
        return status;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return { name: 'alert-circle', color: '#F44336' };
      case 'medium':
        return { name: 'alert', color: '#FF9800' };
      case 'low':
        return { name: 'information-circle', color: '#4CAF50' };
      default:
        return { name: 'help-circle', color: '#999' };
    }
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => {
    const priorityIcon = getPriorityIcon(item.priority);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketTitleRow}>
            <Ionicons
              name={priorityIcon.name as any}
              size={20}
              color={priorityIcon.color}
            />
            <Text style={styles.ticketSubject} numberOfLines={1}>
              {item.subject}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <Text style={styles.ticketMessage} numberOfLines={2}>
          {item.message}
        </Text>

        <View style={styles.ticketFooter}>
          <View style={styles.ticketMeta}>
            <Ionicons name="calendar-outline" size={14} color="#888" />
            <Text style={styles.ticketDate}>
              {new Date(item.createdAt).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>
          </View>
          {item.messages && item.messages.length > 0 && (
            <View style={styles.ticketMeta}>
              <Ionicons name="chatbubbles-outline" size={14} color="#888" />
              <Text style={styles.ticketDate}>{item.messages.length} mensajes</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Tickets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateTicket')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusOptions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === item.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={selectedStatus === item.id ? '#fff' : COLORS.text}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === item.id && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Tickets List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="mail-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay tickets</Text>
          <Text style={styles.emptySubtext}>
            {selectedStatus === 'all'
              ? 'Aún no has creado ningún ticket de soporte'
              : `No hay tickets con estado "${statusOptions.find(s => s.id === selectedStatus)?.label}"`}
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateTicket')}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.createButtonText}>Crear ticket</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  ticketMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketDate: {
    fontSize: 12,
    color: '#888',
  },
});

export default TicketsListScreen;
