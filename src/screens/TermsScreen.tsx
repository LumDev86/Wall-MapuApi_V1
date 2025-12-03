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

const TermsScreen = () => {
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
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.lastUpdate}>Última actualización: Diciembre 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
          <Text style={styles.paragraph}>
            Al acceder y utilizar la aplicación Wall-Mapu, usted acepta estar sujeto a estos
            Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos
            términos, no podrá acceder al servicio.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Descripción del Servicio</Text>
          <Text style={styles.paragraph}>
            Wall-Mapu es una plataforma digital que conecta a usuarios con tiendas de productos
            para mascotas. El servicio permite:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Buscar y encontrar tiendas de mascotas cercanas</Text>
            <Text style={styles.bulletItem}>• Visualizar productos y precios</Text>
            <Text style={styles.bulletItem}>• Contactar con comercios</Text>
            <Text style={styles.bulletItem}>• Para comerciantes: publicar su tienda y productos</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Registro de Usuarios</Text>
          <Text style={styles.paragraph}>
            Para utilizar ciertas funciones de la aplicación, deberá registrarse proporcionando
            información veraz y actualizada. Usted es responsable de mantener la confidencialidad
            de su cuenta y contraseña.
          </Text>
          <Text style={styles.paragraph}>
            Los usuarios menores de 18 años deben contar con la autorización de sus padres o
            tutores legales para utilizar la aplicación.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Tipos de Usuarios</Text>
          <Text style={styles.subTitle}>4.1 Clientes</Text>
          <Text style={styles.paragraph}>
            Los clientes pueden buscar tiendas, ver productos y contactar comercios. La información
            personal proporcionada será utilizada únicamente para mejorar la experiencia de usuario.
          </Text>
          <Text style={styles.subTitle}>4.2 Comerciantes</Text>
          <Text style={styles.paragraph}>
            Los comerciantes (Pet Shops, Forrajerías, Veterinarias, Distribuidores) pueden publicar
            su tienda y productos mediante una suscripción activa. Deben proporcionar información
            fiscal veraz y cumplir con las normativas comerciales vigentes.
          </Text>
          <Text style={styles.subTitle}>4.3 Distribuidores</Text>
          <Text style={styles.paragraph}>
            Los distribuidores mayoristas requieren un código de autorización proporcionado por
            Wall-Mapu para registrarse. Este código es intransferible y puede ser revocado en
            caso de incumplimiento.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Suscripciones y Pagos</Text>
          <Text style={styles.paragraph}>
            Los comerciantes deben mantener una suscripción activa para que su tienda sea visible
            en la aplicación. Los pagos se procesan a través de Mercado Pago.
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Las suscripciones se renuevan automáticamente</Text>
            <Text style={styles.bulletItem}>• Puede cancelar en cualquier momento desde la app</Text>
            <Text style={styles.bulletItem}>• No se realizan reembolsos por períodos parciales</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Conducta del Usuario</Text>
          <Text style={styles.paragraph}>
            Los usuarios se comprometen a:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• No publicar contenido falso, engañoso o ilegal</Text>
            <Text style={styles.bulletItem}>• No utilizar la plataforma para actividades fraudulentas</Text>
            <Text style={styles.bulletItem}>• Respetar a otros usuarios y comercios</Text>
            <Text style={styles.bulletItem}>• No intentar acceder a cuentas de terceros</Text>
            <Text style={styles.bulletItem}>• No utilizar sistemas automatizados sin autorización</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Propiedad Intelectual</Text>
          <Text style={styles.paragraph}>
            Todo el contenido de la aplicación, incluyendo textos, gráficos, logotipos, iconos y
            software, es propiedad de Wall-Mapu o sus licenciantes y está protegido por las leyes
            de propiedad intelectual.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitación de Responsabilidad</Text>
          <Text style={styles.paragraph}>
            Wall-Mapu actúa como intermediario entre usuarios y comercios. No somos responsables de:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• La calidad de los productos ofrecidos por comercios</Text>
            <Text style={styles.bulletItem}>• Transacciones realizadas fuera de la plataforma</Text>
            <Text style={styles.bulletItem}>• Disputas entre usuarios y comercios</Text>
            <Text style={styles.bulletItem}>• Información incorrecta publicada por comercios</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Modificaciones</Text>
          <Text style={styles.paragraph}>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
            serán notificados a través de la aplicación. El uso continuado del servicio después de
            dichas modificaciones constituye la aceptación de los nuevos términos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Terminación</Text>
          <Text style={styles.paragraph}>
            Podemos suspender o terminar su acceso a la aplicación en cualquier momento, sin previo
            aviso, por incumplimiento de estos términos o por cualquier otra razón que consideremos
            apropiada.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Ley Aplicable</Text>
          <Text style={styles.paragraph}>
            Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa
            será sometida a la jurisdicción de los tribunales ordinarios de la Ciudad de
            Concepción del Uruguay, Entre Ríos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contacto</Text>
          <Text style={styles.paragraph}>
            Para cualquier consulta sobre estos términos, puede contactarnos a:
          </Text>
          <Text style={styles.contactInfo}>Email: legal@wallmapu.app</Text>
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
  contactInfo: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 8,
  },
});

export default TermsScreen;
