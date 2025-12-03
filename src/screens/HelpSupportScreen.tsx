import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'account' | 'shops' | 'orders';
}

const faqs: FAQ[] = [
  {
    id: '1',
    category: 'general',
    question: '¿Qué es Wall-Mapu?',
    answer: 'Wall-Mapu es una plataforma que conecta a dueños de mascotas con tiendas locales de productos para animales. Puedes encontrar alimentos, accesorios, medicamentos y más cerca de tu ubicación.',
  },
  {
    id: '2',
    category: 'general',
    question: '¿Cómo encuentro tiendas cercanas?',
    answer: 'Puedes usar el mapa interactivo en la pestaña "Mapa" para ver todas las tiendas cerca de tu ubicación. También puedes buscar por nombre de tienda o producto en el buscador.',
  },
  {
    id: '3',
    category: 'account',
    question: '¿Cómo cambio mi contraseña?',
    answer: 'Ve a Perfil > Configuración > Cambiar contraseña. También puedes usar la opción "Olvidé mi contraseña" en la pantalla de inicio de sesión.',
  },
  {
    id: '4',
    category: 'account',
    question: '¿Cómo elimino mi cuenta?',
    answer: 'Para eliminar tu cuenta, ve a Configuración > Eliminar cuenta. Ten en cuenta que esta acción es irreversible y perderás todos tus datos.',
  },
  {
    id: '5',
    category: 'shops',
    question: '¿Cómo registro mi tienda?',
    answer: 'Para registrar tu tienda necesitas crear una cuenta como Minorista o Mayorista. Luego ve a "Mi Tienda" y completa el formulario de registro con los datos de tu negocio.',
  },
  {
    id: '6',
    category: 'shops',
    question: '¿Cuánto cuesta publicar mi tienda?',
    answer: 'Ofrecemos planes de suscripción mensuales y anuales. El plan mensual tiene un costo de $4.999 ARS y el anual de $49.990 ARS (ahorrás 2 meses). Tu tienda aparecerá en el mapa mientras tengas una suscripción activa.',
  },
  {
    id: '7',
    category: 'shops',
    question: '¿Cómo aparece mi tienda en el mapa?',
    answer: 'Una vez que completes el registro de tu tienda y actives tu suscripción, tu tienda aparecerá automáticamente en el mapa para todos los usuarios de la app.',
  },
  {
    id: '8',
    category: 'orders',
    question: '¿Cómo funciona el proceso de compra?',
    answer: 'Actualmente Wall-Mapu te permite encontrar tiendas y productos. Para realizar compras, debes contactar directamente a la tienda a través de los datos de contacto que aparecen en su perfil.',
  },
];

const HelpSupportScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const categories = [
    { id: 'all', label: 'Todos', icon: 'apps' },
    { id: 'general', label: 'General', icon: 'information-circle' },
    { id: 'account', label: 'Cuenta', icon: 'person' },
    { id: 'shops', label: 'Tiendas', icon: 'storefront' },
    { id: 'orders', label: 'Pedidos', icon: 'receipt' },
  ];

  const filteredFaqs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openWhatsApp = () => {
    const phoneNumber = '+5493442000000'; // Número de soporte
    const message = encodeURIComponent('Hola, necesito ayuda con la app Wall-Mapu');
    Linking.openURL(`https://wa.me/${phoneNumber}?text=${message}`);
  };

  const openEmail = () => {
    const subject = encodeURIComponent('Soporte Wall-Mapu');
    const body = encodeURIComponent(`
Hola equipo de Wall-Mapu,

[Describe tu consulta aquí]

---
Usuario: ${user?.name || 'No registrado'}
Email: ${user?.email || 'N/A'}
    `);
    Linking.openURL(`mailto:soporte@wallmapu.app?subject=${subject}&body=${body}`);
  };

  const handleSendMessage = async () => {
    if (!contactMessage.trim()) {
      Alert.alert('Error', 'Por favor escribe un mensaje');
      return;
    }

    setSendingMessage(true);

    // Simular envío - en producción conectaría con backend
    setTimeout(() => {
      setSendingMessage(false);
      setContactMessage('');
      Alert.alert(
        'Mensaje enviado',
        'Hemos recibido tu mensaje. Te responderemos a la brevedad a tu correo electrónico.',
        [{ text: 'OK' }]
      );
    }, 1500);
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
        <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Contacto rápido */}
        <View style={styles.quickContactSection}>
          <Text style={styles.quickContactTitle}>¿Necesitas ayuda inmediata?</Text>
          <View style={styles.quickContactButtons}>
            <TouchableOpacity style={styles.quickContactButton} onPress={openWhatsApp}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.quickContactText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickContactButton} onPress={openEmail}>
              <Ionicons name="mail" size={24} color={COLORS.primary} />
              <Text style={styles.quickContactText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>

          {/* Filtros de categoría */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={selectedCategory === cat.id ? '#fff' : COLORS.text}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Lista de FAQs */}
          <View style={styles.faqList}>
            {filteredFaqs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqItem}
                onPress={() => toggleFaq(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.gray}
                  />
                </View>
                {expandedId === faq.id && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Formulario de contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Envíanos un mensaje</Text>
          <View style={styles.contactForm}>
            <Text style={styles.contactLabel}>
              ¿No encontraste la respuesta? Cuéntanos tu problema y te ayudaremos.
            </Text>
            <TextInput
              style={styles.contactInput}
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={contactMessage}
              onChangeText={setContactMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!contactMessage.trim() || sendingMessage) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!contactMessage.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>Enviar mensaje</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Información adicional */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Más información</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => Linking.openURL('https://wallmapu.app/guia')}
            >
              <View style={styles.infoIcon}>
                <Ionicons name="book-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Guía de usuario</Text>
                <Text style={styles.infoDescription}>Aprende a usar todas las funciones</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => Linking.openURL('https://wallmapu.app/comercios')}
            >
              <View style={styles.infoIcon}>
                <Ionicons name="storefront-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Guía para comercios</Text>
                <Text style={styles.infoDescription}>Cómo publicar y gestionar tu tienda</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.infoItem, { borderBottomWidth: 0 }]}
              onPress={() => Linking.openURL('https://status.wallmapu.app')}
            >
              <View style={styles.infoIcon}>
                <Ionicons name="pulse-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Estado del servicio</Text>
                <Text style={styles.infoDescription}>Verifica si hay problemas técnicos</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Horario de atención */}
        <View style={styles.scheduleSection}>
          <Ionicons name="time-outline" size={20} color="#888" />
          <Text style={styles.scheduleText}>
            Horario de atención: Lunes a Viernes de 9:00 a 18:00 hs
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
  quickContactSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  quickContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickContactButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  quickContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
  },
  quickContactText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  categoriesContainer: {
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  faqList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  contactForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  contactInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 13,
    color: '#888',
  },
  scheduleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  scheduleText: {
    fontSize: 13,
    color: '#888',
  },
});

export default HelpSupportScreen;
