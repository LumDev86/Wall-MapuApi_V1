import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionService, shopService } from '../services/api';
import { Subscription, SubscriptionPlan } from '../types/subscription.types';
import { Shop } from '../types/product.types';
import { COLORS } from '../constants/colors';

interface SubscriptionScreenProps {
  navigation: any;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanDetails {
  name: string;
  price: number;
  features: PlanFeature[];
}

// Precios de PRUEBA - Cambiar a 9999 y 19999 para producción
const IS_TEST_MODE = true;

const PLANS: Record<SubscriptionPlan, PlanDetails> = {
  retailer: {
    name: 'Plan Minorista',
    price: IS_TEST_MODE ? 1 : 9999,
    features: [
      { text: 'Aparecer en el mapa', included: true },
      { text: 'Publicar productos', included: true },
      { text: 'Banner destacado', included: false },
      { text: 'Estadísticas avanzadas', included: false },
    ],
  },
  wholesaler: {
    name: 'Plan Mayorista',
    price: IS_TEST_MODE ? 2 : 19999,
    features: [
      { text: 'Aparecer en el mapa', included: true },
      { text: 'Publicar productos', included: true },
      { text: 'Banner destacado', included: true },
      { text: 'Estadísticas avanzadas', included: true },
    ],
  },
};

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener información del shop
      const shopData = await shopService.getMyShop();
      setShop(shopData);

      // Obtener suscripción actual si existe (usa /subscriptions/me)
      try {
        console.log('Fetching subscription for current user...');
        const subscriptionData = await subscriptionService.getMySubscription();
        if (subscriptionData) {
          console.log('Subscription fetched successfully:', subscriptionData);
          setSubscription(subscriptionData);
        } else {
          console.log('No active subscription found');
          setSubscription(null);
        }
      } catch (error: any) {
        console.error('Error fetching subscription:', error);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        // Error inesperado - mostrar como warning pero continuar
        console.warn('Could not fetch subscription, continuing without it');
        setSubscription(null);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      // Si no tiene tienda (404) o hay error del servidor
      if (error.response?.status === 404) {
        setShop(null);
      } else {
        Alert.alert(
          'Error',
          'No se pudo cargar la información. Por favor intenta de nuevo.',
          [
            { text: 'Reintentar', onPress: () => fetchData() },
            { text: 'Volver', onPress: () => navigation.goBack() },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!shop) return;

    Alert.alert(
      'Confirmar Suscripción',
      `¿Deseas suscribirte al ${PLANS[plan].name} por $${PLANS[plan].price.toLocaleString('es-AR')}/mes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setSubscribing(true);
              const response = await subscriptionService.create({
                plan,
                shopId: shop.id,
                autoRenew: true,
              });

              if (response.initPoint) {
                // Abrir URL de Mercado Pago
                const supported = await Linking.canOpenURL(response.initPoint);
                if (supported) {
                  await Linking.openURL(response.initPoint);
                  Alert.alert(
                    'Pago en proceso',
                    'Por favor completa el pago en Mercado Pago. Usa "Actualizar" para verificar el estado del pago.',
                    [{ text: 'OK', onPress: () => fetchData() }]
                  );
                } else {
                  Alert.alert('Error', 'No se pudo abrir el enlace de pago');
                }
              } else {
                // initPoint es null - problema con MercadoPago en el backend
                console.error('Subscription created but initPoint is null:', response);
                Alert.alert(
                  'Error de configuración',
                  'La suscripción se creó pero no se pudo generar el enlace de pago de MercadoPago. Por favor contacta al soporte técnico.\n\nID de suscripción: ' + response.id,
                  [{ text: 'OK', onPress: () => fetchData() }]
                );
              }
            } catch (error: any) {
              console.error('Error creating subscription:', error);
              console.error('Error response data:', error.response?.data);
              const status = error.response?.status;
              const message = error.response?.data?.message;

              let errorMsg = 'No se pudo crear la suscripción.';

              // Error 500 - Problema del servidor (Mercado Pago)
              if (status === 500) {
                const errorDetails = error.response?.data?.error || '';
                if (errorDetails.includes('cardholderIdentification') ||
                    errorDetails.includes('Mercado Pago') ||
                    errorDetails.includes('MercadoPago')) {
                  Alert.alert(
                    'Error de configuración',
                    'Hay un problema con la configuración de Mercado Pago en el servidor. Por favor contacta al soporte técnico.\n\nError: ' + errorDetails,
                    [{ text: 'OK' }]
                  );
                  return;
                }
                errorMsg = 'Error del servidor. Contacta al soporte.';
              }

              if (status === 400) {
                const msgLower = (message || '').toLowerCase();

                // Si el error indica que ya existe una suscripción pendiente
                if (msgLower.includes('pendiente') || msgLower.includes('pending') ||
                    msgLower.includes('ya tiene') || msgLower.includes('already has')) {

                  // Primero obtener la suscripción actual para tener su ID
                  fetchData().then(async () => {
                    // Intentar obtener la suscripción directamente del backend
                    try {
                      const pendingSubscription = await subscriptionService.getMySubscription();

                      if (!pendingSubscription) {
                        Alert.alert('Error', 'No se pudo encontrar la suscripción pendiente');
                        return;
                      }

                      Alert.alert(
                        'Suscripción pendiente',
                        'Ya tienes una suscripción pendiente. ¿Deseas cancelarla para crear una nueva?',
                        [
                          { text: 'No', style: 'cancel' },
                          {
                            text: 'Sí, cancelar pendiente',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                console.log('Canceling pending subscription with ID:', pendingSubscription.id);
                                await subscriptionService.cancel(pendingSubscription.id);
                                Alert.alert(
                                  'Suscripción cancelada',
                                  'La suscripción pendiente ha sido cancelada. Ahora puedes crear una nueva.',
                                  [{ text: 'OK', onPress: () => fetchData() }]
                                );
                              } catch (cancelError: any) {
                                console.error('Error canceling pending subscription:', cancelError);
                                console.error('Error response:', cancelError.response?.data);
                                Alert.alert(
                                  'Error',
                                  cancelError.response?.data?.message || 'No se pudo cancelar la suscripción pendiente'
                                );
                              }
                            },
                          },
                        ]
                      );
                    } catch (fetchError: any) {
                      console.error('Error fetching pending subscription:', fetchError);
                      Alert.alert(
                        'Error',
                        'No se pudo obtener la información de la suscripción pendiente. Por favor, ve a la pantalla de Suscripción para cancelarla manualmente.'
                      );
                    }
                  });
                  return;
                }

                errorMsg = message || 'La tienda ya tiene una suscripción activa o se excedió el límite de intentos.';
              } else if (status === 403) {
                errorMsg = 'No tienes permiso para crear una suscripción para esta tienda.';
              } else if (status === 500) {
                errorMsg = 'Error del servidor. Puede haber un problema con la configuración de Mercado Pago. Contacta al soporte.';
              }

              Alert.alert('Error', errorMsg);
            } finally {
              setSubscribing(false);
            }
          },
        },
      ]
    );
  };

  const handleRetryPayment = async () => {
    if (!subscription) return;

    try {
      setSubscribing(true);
      const response = await subscriptionService.retryPayment(subscription.id);

      if (response.subscription.initPoint) {
        const supported = await Linking.canOpenURL(response.subscription.initPoint);
        if (supported) {
          await Linking.openURL(response.subscription.initPoint);
          Alert.alert(
            'Reintento de pago',
            'Por favor completa el pago en Mercado Pago.',
            [{ text: 'OK', onPress: () => fetchData() }]
          );
        }
      } else {
        Alert.alert('Éxito', response.message);
        await fetchData();
      }
    } catch (error: any) {
      console.error('Error retrying payment:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo reintentar el pago'
      );
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = () => {
    if (!subscription) {
      Alert.alert('Error', 'No se encontró la suscripción a cancelar');
      return;
    }

    const isPending = subscription.status === 'pending';
    const title = isPending ? 'Cancelar Suscripción Pendiente' : 'Cancelar Suscripción';
    const message = isPending
      ? '¿Estás seguro que deseas cancelar la suscripción pendiente? Podrás crear una nueva después.'
      : '¿Estás seguro que deseas cancelar tu suscripción? Perderás acceso a los beneficios al finalizar el período actual.';

    Alert.alert(
      title,
      message,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('Canceling subscription with ID:', subscription.id);
              await subscriptionService.cancel(subscription.id);
              Alert.alert('Suscripción cancelada', 'Tu suscripción ha sido cancelada exitosamente');
              await fetchData();
            } catch (error: any) {
              console.error('Error canceling subscription:', error);
              console.error('Error response:', error.response?.data);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'No se pudo cancelar la suscripción'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCheckPaymentStatus = async () => {
    if (!subscription) return;

    try {
      setLoading(true);
      const statusResponse = await subscriptionService.getPaymentStatus(subscription.id);

      if (statusResponse.status === 'active') {
        Alert.alert('Pago confirmado', 'Tu suscripción está activa');
      } else if (statusResponse.status === 'pending') {
        Alert.alert('Pago pendiente', statusResponse.message);
      } else {
        Alert.alert('Estado del pago', statusResponse.message);
      }

      await fetchData();
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      Alert.alert('Error', 'No se pudo verificar el estado del pago');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { text: 'Activo', color: '#4CAF50', icon: 'checkmark-circle' as const },
      pending: { text: 'Pendiente', color: '#FF9800', icon: 'time' as const },
      expired: { text: 'Expirado', color: COLORS.error, icon: 'alert-circle' as const },
      failed: { text: 'Fallido', color: COLORS.error, icon: 'close-circle' as const },
      cancelled: { text: 'Cancelado', color: COLORS.gray, icon: 'ban' as const },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;

    return (
      <View style={[styles.statusBadge, { backgroundColor: badge.color + '20' }]}>
        <Ionicons name={badge.icon} size={16} color={badge.color} />
        <Text style={[styles.statusText, { color: badge.color }]}>{badge.text}</Text>
      </View>
    );
  };

  const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Suscripción</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.noShopContainer}>
          <Ionicons name="storefront-outline" size={80} color={COLORS.gray} />
          <Text style={styles.noShopTitle}>Primero necesitas una tienda</Text>
          <Text style={styles.noShopText}>
            Para suscribirte y aparecer en el mapa, primero debes crear tu tienda.
          </Text>
          <TouchableOpacity
            style={styles.createShopButton}
            onPress={() => navigation.replace('CreateShop')}
          >
            <Ionicons name="add-circle-outline" size={24} color={COLORS.white} />
            <Text style={styles.createShopButtonText}>Crear mi tienda</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suscripción</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {subscription ? (
          // Usuario tiene suscripción
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suscripción Actual</Text>

            <View style={styles.subscriptionCard}>
              {/* Status Badge */}
              <View style={styles.subscriptionHeader}>
                <Text style={styles.planName}>{PLANS[subscription.plan].name}</Text>
                {getStatusBadge(subscription.status)}
              </View>

              {/* Subscription Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.gray} />
                  <Text style={styles.detailLabel}>Fecha de inicio:</Text>
                  <Text style={styles.detailValue}>{formatDate(subscription.startDate)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={20} color={COLORS.gray} />
                  <Text style={styles.detailLabel}>Fecha de vencimiento:</Text>
                  <Text style={styles.detailValue}>{formatDate(subscription.endDate)}</Text>
                </View>

                {subscription.status === 'active' && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={20} color={COLORS.gray} />
                    <Text style={styles.detailLabel}>Días restantes:</Text>
                    <Text style={[styles.detailValue, styles.daysRemaining]}>
                      {getDaysRemaining(subscription.endDate)} días
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={20} color={COLORS.gray} />
                  <Text style={styles.detailLabel}>Monto:</Text>
                  <Text style={styles.detailValue}>
                    ${parseFloat(subscription.amount.toString()).toLocaleString('es-AR')}/mes
                  </Text>
                </View>

                {subscription.autoRenew && subscription.status === 'active' && (
                  <View style={styles.detailRow}>
                    <Ionicons name="refresh" size={20} color={COLORS.primary} />
                    <Text style={styles.detailLabel}>Renovación automática:</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]}>Activada</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {subscription.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryButton]}
                      onPress={handleCheckPaymentStatus}
                      disabled={subscribing}
                    >
                      {subscribing ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
                          <Text style={styles.primaryButtonText}>Verificar Pago</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.dangerButton]}
                      onPress={handleCancelSubscription}
                      disabled={subscribing}
                    >
                      <Ionicons name="close-circle-outline" size={20} color={COLORS.error} />
                      <Text style={styles.dangerButtonText}>Cancelar Pendiente</Text>
                    </TouchableOpacity>
                  </>
                )}

                {(subscription.status === 'failed' && subscription.canRetryPayment) && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={handleRetryPayment}
                    disabled={subscribing}
                  >
                    {subscribing ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="card-outline" size={20} color={COLORS.white} />
                        <Text style={styles.primaryButtonText}>
                          Reintentar Pago ({subscription.attemptsRemaining} intentos)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {subscription.status === 'expired' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => handleSubscribe(subscription.plan)}
                    disabled={subscribing}
                  >
                    {subscribing ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="refresh-circle-outline" size={20} color={COLORS.white} />
                        <Text style={styles.primaryButtonText}>Renovar Suscripción</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {subscription.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={handleCancelSubscription}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={COLORS.error} />
                    <Text style={styles.dangerButtonText}>Cancelar Suscripción</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Current Plan Features */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresSectionTitle}>Beneficios Incluidos</Text>
              {PLANS[subscription.plan].features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons
                    name={feature.included ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={feature.included ? COLORS.primary : COLORS.gray}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      !feature.included && styles.featureTextDisabled,
                    ]}
                  >
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          // Usuario no tiene suscripción - Mostrar planes
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Elige tu Plan</Text>
            <Text style={styles.sectionSubtitle}>
              Selecciona el plan que mejor se adapte a tu negocio
            </Text>

            {/* Botón de ayuda para suscripciones pendientes */}
            <View style={styles.helpContainer}>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={async () => {
                  Alert.alert(
                    '¿Tienes una suscripción pendiente?',
                    'Si el backend dice que ya tienes una suscripción pero no la ves aquí, intenta actualizando la página deslizando hacia abajo. Si el problema persiste, contacta al soporte.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Refrescar ahora',
                        onPress: () => {
                          setRefreshing(true);
                          fetchData().finally(() => setRefreshing(false));
                        },
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.helpButtonText}>¿Problemas con suscripción pendiente?</Text>
              </TouchableOpacity>
            </View>

            {/* Plan Cards */}
            <View style={styles.plansContainer}>
              {(Object.keys(PLANS) as SubscriptionPlan[]).map((planKey) => {
                const plan = PLANS[planKey];
                const isRecommended = planKey === 'wholesaler';

                return (
                  <View key={planKey} style={styles.planCard}>
                    {isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recomendado</Text>
                      </View>
                    )}

                    <View style={styles.planCardHeader}>
                      <Text style={styles.planCardTitle}>{plan.name}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceSymbol}>$</Text>
                        <Text style={styles.priceAmount}>
                          {plan.price.toLocaleString('es-AR')}
                        </Text>
                        <Text style={styles.pricePeriod}>/mes</Text>
                      </View>
                    </View>

                    <View style={styles.planFeaturesList}>
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.planFeatureRow}>
                          <Ionicons
                            name={feature.included ? 'checkmark-circle' : 'close-circle'}
                            size={18}
                            color={feature.included ? COLORS.primary : COLORS.gray}
                          />
                          <Text
                            style={[
                              styles.planFeatureText,
                              !feature.included && styles.planFeatureTextDisabled,
                            ]}
                          >
                            {feature.text}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.subscribeButton,
                        isRecommended && styles.subscribeButtonRecommended,
                      ]}
                      onPress={() => handleSubscribe(planKey)}
                      disabled={subscribing}
                    >
                      {subscribing ? (
                        <ActivityIndicator
                          size="small"
                          color={isRecommended ? COLORS.white : COLORS.primary}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="rocket-outline"
                            size={20}
                            color={isRecommended ? COLORS.white : COLORS.primary}
                          />
                          <Text
                            style={[
                              styles.subscribeButtonText,
                              isRecommended && styles.subscribeButtonTextRecommended,
                            ]}
                          >
                            Suscribirse
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={24} color={COLORS.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Información importante</Text>
                  <Text style={styles.infoText}>
                    • La suscripción se renueva automáticamente cada mes{'\n'}
                    • Puedes cancelar en cualquier momento{'\n'}
                    • El pago se procesa de forma segura mediante Mercado Pago{'\n'}
                    • Los beneficios se activan inmediatamente después del pago
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerPlaceholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 24,
    lineHeight: 20,
  },
  subscriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  daysRemaining: {
    color: COLORS.primary,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  dangerButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  featuresSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
  },
  featureTextDisabled: {
    color: COLORS.gray,
    textDecorationLine: 'line-through',
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  planCardHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  planCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  pricePeriod: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 8,
  },
  planFeaturesList: {
    gap: 12,
    marginBottom: 20,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planFeatureText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  planFeatureTextDisabled: {
    color: COLORS.gray,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  subscribeButtonRecommended: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subscribeButtonTextRecommended: {
    color: COLORS.white,
  },
  infoSection: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
  noShopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: COLORS.white,
  },
  noShopTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  noShopText: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  createShopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  helpContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
  },
  helpButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default SubscriptionScreen;
