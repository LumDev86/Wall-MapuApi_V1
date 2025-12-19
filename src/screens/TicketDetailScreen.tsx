import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { ticketService } from '../services/api';
import { Ticket, TicketMessage, TicketStatus } from '../types/ticket.types';
import { MainStackNavigationProp, MainStackParamList } from '../types/navigation.types';
import { useAuth } from '../context/AuthContext';

type TicketDetailRouteProp = RouteProp<MainStackParamList, 'TicketDetail'>;

const TicketDetailScreen = () => {
  const navigation = useNavigation<MainStackNavigationProp<'TicketDetail'>>();
  const route = useRoute<TicketDetailRouteProp>();
  const { user } = useAuth();
  const { ticketId } = route.params;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadTicket = async () => {
    try {
      const data = await ticketService.getById(ticketId);
      setTicket(data);
    } catch (error: any) {
      console.error('Error loading ticket:', error);
      Alert.alert('Error', 'No se pudo cargar el ticket');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      Alert.alert('Error', 'Por favor escribe un mensaje');
      return;
    }

    setSendingReply(true);

    try {
      await ticketService.reply(ticketId, {
        message: replyMessage.trim(),
      });

      setReplyMessage('');
      await loadTicket(); // Reload to get the new message

      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending reply:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo enviar la respuesta'
      );
    } finally {
      setSendingReply(false);
    }
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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'General',
      technical: 'Técnico',
      account: 'Cuenta',
      billing: 'Facturación',
      feature_request: 'Sugerencia',
    };
    return labels[category] || category;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (!ticket) {
    return null;
  }

  const statusColor = getStatusColor(ticket.status);
  const canReply = ticket.status !== 'closed';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket #{ticket.id.slice(0, 8)}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Ticket Info */}
      <View style={styles.ticketInfo}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketSubject}>{ticket.subject}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusLabel(ticket.status)}</Text>
          </View>
        </View>

        <View style={styles.ticketMetaRow}>
          <View style={styles.ticketMetaItem}>
            <Ionicons name="pricetag-outline" size={16} color="#888" />
            <Text style={styles.ticketMetaText}>{getCategoryLabel(ticket.category)}</Text>
          </View>
          <View style={styles.ticketMetaItem}>
            <Ionicons name="flag-outline" size={16} color="#888" />
            <Text style={styles.ticketMetaText}>{getPriorityLabel(ticket.priority)}</Text>
          </View>
          <View style={styles.ticketMetaItem}>
            <Ionicons name="calendar-outline" size={16} color="#888" />
            <Text style={styles.ticketMetaText}>
              {new Date(ticket.createdAt).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Initial Message */}
        <View style={styles.messageGroup}>
          <View style={[styles.messageBubble, styles.userMessage]}>
            <Text style={styles.messageText}>{ticket.message}</Text>
            <Text style={styles.messageTime}>
              {new Date(ticket.createdAt).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Replies */}
        {ticket.messages && ticket.messages.length > 0 && (
          <>
            {ticket.messages.map((msg: TicketMessage) => (
              <View key={msg.id} style={styles.messageGroup}>
                <View
                  style={[
                    styles.messageBubble,
                    msg.isAdminReply ? styles.adminMessage : styles.userMessage,
                  ]}
                >
                  {msg.isAdminReply && (
                    <View style={styles.adminBadge}>
                      <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
                      <Text style={styles.adminBadgeText}>Soporte</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      msg.isAdminReply && styles.adminMessageText,
                    ]}
                  >
                    {msg.message}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      msg.isAdminReply && styles.adminMessageTime,
                    ]}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Reply Input */}
      {canReply ? (
        <View style={styles.replyContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Escribe tu respuesta..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            value={replyMessage}
            onChangeText={setReplyMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!replyMessage.trim() || sendingReply) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendReply}
            disabled={!replyMessage.trim() || sendingReply}
          >
            {sendingReply ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.closedNotice}>
          <Ionicons name="lock-closed" size={20} color="#888" />
          <Text style={styles.closedNoticeText}>Este ticket está cerrado</Text>
        </View>
      )}
    </KeyboardAvoidingView>
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
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketSubject: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  ticketMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  ticketMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketMetaText: {
    fontSize: 13,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageGroup: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  adminMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
  adminMessageText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
    textAlign: 'right',
  },
  adminMessageTime: {
    color: '#888',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  closedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    gap: 8,
  },
  closedNoticeText: {
    fontSize: 14,
    color: '#888',
  },
});

export default TicketDetailScreen;
