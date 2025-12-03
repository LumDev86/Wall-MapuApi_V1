import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();

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
        <Text style={styles.headerTitle}>Política de Privacidad</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.lastUpdate}>Última actualización: Diciembre 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introducción</Text>
          <Text style={styles.paragraph}>
            En Wall-Mapu nos comprometemos a proteger su privacidad. Esta Política de Privacidad
            explica cómo recopilamos, usamos, divulgamos y protegemos su información personal
            cuando utiliza nuestra aplicación móvil.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Información que Recopilamos</Text>

          <Text style={styles.subTitle}>2.1 Información proporcionada por el usuario</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Nombre completo y datos de contacto</Text>
            <Text style={styles.bulletItem}>• Correo electrónico y número de teléfono</Text>
            <Text style={styles.bulletItem}>• Fecha de nacimiento y género (opcional)</Text>
            <Text style={styles.bulletItem}>• Ubicación (ciudad, barrio)</Text>
            <Text style={styles.bulletItem}>• Información sobre mascotas (tipo, raza, edad)</Text>
            <Text style={styles.bulletItem}>• Para comercios: datos fiscales (CUIT, razón social, etc.)</Text>
          </View>

          <Text style={styles.subTitle}>2.2 Información recopilada automáticamente</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Datos de ubicación (con su permiso)</Text>
            <Text style={styles.bulletItem}>• Información del dispositivo</Text>
            <Text style={styles.bulletItem}>• Datos de uso de la aplicación</Text>
            <Text style={styles.bulletItem}>• Dirección IP</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Uso de la Información</Text>
          <Text style={styles.paragraph}>
            Utilizamos su información para:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Proporcionar y mejorar nuestros servicios</Text>
            <Text style={styles.bulletItem}>• Mostrar tiendas cercanas a su ubicación</Text>
            <Text style={styles.bulletItem}>• Personalizar su experiencia en la aplicación</Text>
            <Text style={styles.bulletItem}>• Enviar notificaciones relevantes (con su consentimiento)</Text>
            <Text style={styles.bulletItem}>• Procesar pagos de suscripciones para comercios</Text>
            <Text style={styles.bulletItem}>• Comunicarnos con usted sobre su cuenta</Text>
            <Text style={styles.bulletItem}>• Cumplir con obligaciones legales</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Comunicaciones y Marketing</Text>
          <Text style={styles.paragraph}>
            Para usuarios registrados como comerciantes, el correo electrónico proporcionado será
            utilizado para enviar:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Información sobre su suscripción</Text>
            <Text style={styles.bulletItem}>• Novedades y actualizaciones de la plataforma</Text>
            <Text style={styles.bulletItem}>• Promociones y ofertas especiales</Text>
            <Text style={styles.bulletItem}>• Facturas y comprobantes de pago</Text>
          </View>
          <Text style={styles.paragraph}>
            Puede optar por no recibir comunicaciones promocionales en cualquier momento desde
            la configuración de la aplicación.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Compartir Información</Text>
          <Text style={styles.paragraph}>
            No vendemos su información personal. Podemos compartir datos con:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Proveedores de servicios (procesadores de pago, hosting)</Text>
            <Text style={styles.bulletItem}>• Autoridades cuando sea requerido por ley</Text>
            <Text style={styles.bulletItem}>• Otros usuarios (solo información pública de tiendas)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Seguridad de Datos</Text>
          <Text style={styles.paragraph}>
            Implementamos medidas de seguridad técnicas y organizativas para proteger su
            información, incluyendo:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Encriptación de datos en tránsito (SSL/TLS)</Text>
            <Text style={styles.bulletItem}>• Almacenamiento seguro de contraseñas</Text>
            <Text style={styles.bulletItem}>• Acceso restringido a datos personales</Text>
            <Text style={styles.bulletItem}>• Monitoreo de actividades sospechosas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Retención de Datos</Text>
          <Text style={styles.paragraph}>
            Conservamos su información mientras mantenga una cuenta activa o según sea necesario
            para proporcionarle servicios. Los datos fiscales de comercios se conservan según
            los plazos legales establecidos por AFIP (10 años).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Sus Derechos</Text>
          <Text style={styles.paragraph}>
            De acuerdo con la Ley 25.326 de Protección de Datos Personales de Argentina,
            usted tiene derecho a:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Acceder a sus datos personales</Text>
            <Text style={styles.bulletItem}>• Rectificar datos inexactos</Text>
            <Text style={styles.bulletItem}>• Solicitar la eliminación de sus datos</Text>
            <Text style={styles.bulletItem}>• Oponerse al procesamiento de sus datos</Text>
            <Text style={styles.bulletItem}>• Solicitar la portabilidad de sus datos</Text>
          </View>
          <Text style={styles.paragraph}>
            Para ejercer estos derechos, contáctenos a privacidad@wallmapu.app
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Datos de Menores</Text>
          <Text style={styles.paragraph}>
            Nuestra aplicación no está dirigida a menores de 13 años. No recopilamos
            intencionalmente información de niños. Si descubrimos que hemos recopilado
            datos de un menor sin consentimiento parental, eliminaremos dicha información.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Cookies y Tecnologías Similares</Text>
          <Text style={styles.paragraph}>
            Utilizamos tecnologías de seguimiento para mejorar su experiencia, incluyendo:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Almacenamiento local para preferencias</Text>
            <Text style={styles.bulletItem}>• Analytics para entender el uso de la app</Text>
            <Text style={styles.bulletItem}>• Tokens de autenticación</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Cambios a esta Política</Text>
          <Text style={styles.paragraph}>
            Podemos actualizar esta política periódicamente. Le notificaremos sobre cambios
            significativos a través de la aplicación o por correo electrónico. Le recomendamos
            revisar esta página regularmente.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contacto</Text>
          <Text style={styles.paragraph}>
            Si tiene preguntas sobre esta Política de Privacidad, puede contactarnos a:
          </Text>
          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>Email:</Text>
            <Text style={styles.contactValue}>privacidad@wallmapu.app</Text>
            <Text style={styles.contactLabel}>Responsable de Datos:</Text>
            <Text style={styles.contactValue}>Wall-Mapu S.R.L.</Text>
            <Text style={styles.contactLabel}>Dirección:</Text>
            <Text style={styles.contactValue}>Concepción del Uruguay, Entre Ríos, Argentina</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Sus datos están protegidos bajo la Ley 25.326 de Protección de Datos Personales
            de la República Argentina.
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
    padding: 20,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletList: {
    marginTop: 8,
    marginLeft: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: '#555',
    lineHeight: 24,
  },
  contactBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  contactLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  contactValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 20,
  },
});

export default PrivacyPolicyScreen;
