import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { ticketService } from '../services/api';
import { TicketCategory, TicketPriority } from '../types/ticket.types';
import { MainStackNavigationProp } from '../types/navigation.types';

const CreateTicketScreen = () => {
  const navigation = useNavigation<MainStackNavigationProp<'CreateTicket'>>();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'general', label: 'General', icon: 'information-circle', description: 'Consultas generales' },
    { id: 'technical', label: 'Técnico', icon: 'construct', description: 'Problemas técnicos' },
    { id: 'account', label: 'Cuenta', icon: 'person', description: 'Problemas con tu cuenta' },
    { id: 'billing', label: 'Facturación', icon: 'card', description: 'Consultas de pago' },
    { id: 'feature_request', label: 'Sugerencia', icon: 'bulb', description: 'Nueva función' },
  ];

  const priorities = [
    { id: 'low', label: 'Baja', icon: 'arrow-down-circle', color: '#4CAF50' },
    { id: 'medium', label: 'Media', icon: 'remove-circle', color: '#FF9800' },
    { id: 'high', label: 'Alta', icon: 'arrow-up-circle', color: '#F44336' },
  ];

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Por favor ingresa un asunto');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'Por favor describe tu problema o consulta');
      return;
    }

    setLoading(true);

    try {
      await ticketService.create({
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority,
      });

      Alert.alert(
        'Ticket creado',
        'Tu ticket ha sido creado exitosamente. Te responderemos a la brevedad.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo crear el ticket. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Crear Ticket</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Subject Input */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Asunto <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: No puedo acceder a mi tienda"
            placeholderTextColor="#999"
            value={subject}
            onChangeText={setSubject}
            maxLength={100}
          />
          <Text style={styles.helperText}>{subject.length}/100 caracteres</Text>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Categoría <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.optionsGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.optionCard,
                  category === cat.id && styles.optionCardActive,
                ]}
                onPress={() => setCategory(cat.id as TicketCategory)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={24}
                  color={category === cat.id ? COLORS.primary : '#888'}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    category === cat.id && styles.optionLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
                <Text style={styles.optionDescription}>{cat.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Prioridad</Text>
          <View style={styles.priorityRow}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.priorityChip,
                  priority === p.id && { backgroundColor: p.color },
                ]}
                onPress={() => setPriority(p.id as TicketPriority)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={p.icon as any}
                  size={20}
                  color={priority === p.id ? '#fff' : p.color}
                />
                <Text
                  style={[
                    styles.priorityLabel,
                    priority === p.id && styles.priorityLabelActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Descripción <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.helperText}>
            Describe tu problema o consulta con el mayor detalle posible
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe tu problema o consulta aquí..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
            maxLength={1000}
          />
          <Text style={styles.helperText}>{message.length}/1000 caracteres</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!subject.trim() || !message.trim() || loading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!subject.trim() || !message.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Crear Ticket</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Responderemos tu ticket a la brevedad. Recibirás notificaciones en tu correo electrónico.
          </Text>
        </View>
      </ScrollView>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9F6',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },
  optionLabelActive: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    textAlign: 'center',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  priorityLabelActive: {
    color: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
});

export default CreateTicketScreen;
