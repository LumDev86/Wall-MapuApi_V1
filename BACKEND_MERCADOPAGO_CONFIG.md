# Configuración de MercadoPago para Backend - Wall-Mapu

## Variables de entorno requeridas

El backend necesita estas variables de entorno configuradas:

```env
# MercadoPago Credentials (Argentina)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxxxxxx

# URLs de redirección después del pago
MERCADOPAGO_SUCCESS_URL=https://wall-mapuapi-production.up.railway.app/api/subscriptions/webhook/success
MERCADOPAGO_FAILURE_URL=https://wall-mapuapi-production.up.railway.app/api/subscriptions/webhook/failure
MERCADOPAGO_PENDING_URL=https://wall-mapuapi-production.up.railway.app/api/subscriptions/webhook/pending

# Webhook URL para notificaciones IPN
MERCADOPAGO_WEBHOOK_URL=https://wall-mapuapi-production.up.railway.app/api/subscriptions/webhook
```

## Precios de suscripción (PRUEBAS)

Para las pruebas, configurar estos precios:

| Plan | Precio |
|------|--------|
| `retailer` | $1.00 ARS |
| `wholesaler` | $2.00 ARS |

## Precios de suscripción (PRODUCCIÓN)

| Plan | Precio |
|------|--------|
| `retailer` | $9,999.00 ARS |
| `wholesaler` | $19,999.00 ARS |

## Endpoints requeridos en el backend

### Endpoints actuales que funcionan:
- ✅ `POST /api/subscriptions` - Crear suscripción
- ✅ `GET /api/subscriptions/me` - Obtener mi suscripción

### Endpoints que FALTAN implementar o arreglar:

1. **`DELETE /api/subscriptions/:id`** - Cancelar suscripción
   - O alternativamente: `DELETE /api/subscriptions/me`

2. **`GET /api/subscriptions/:id/payment-status`** - Verificar estado del pago
   - O incluir el estado actualizado en `GET /api/subscriptions/me`

3. **`POST /api/subscriptions/:id/retry-payment`** - Reintentar pago fallido
   - Debe generar nuevo `initPoint` de MercadoPago

## Problema actual

Cuando se crea una suscripción, el campo `initPoint` viene como `null`:

```json
{
  "id": "470dd962-5caa-4f2f-8bc4-808d1b36bb69",
  "plan": "retailer",
  "status": "pending",
  "initPoint": null,  // <-- PROBLEMA: debería ser la URL de MercadoPago
  "amount": "18000.00",
  "autoRenew": true
}
```

## Código de ejemplo para crear preferencia de MercadoPago (Node.js)

```javascript
const mercadopago = require('mercadopago');

// Configurar SDK
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// Precios por plan (en pesos argentinos)
const PLAN_PRICES = {
  retailer: 1,      // $1 para pruebas (cambiar a 9999 en producción)
  wholesaler: 2,    // $2 para pruebas (cambiar a 19999 en producción)
};

async function createSubscriptionPreference(subscription, user, shop) {
  const planPrice = PLAN_PRICES[subscription.plan];

  const preference = {
    items: [
      {
        id: subscription.id,
        title: `Suscripción ${subscription.plan === 'retailer' ? 'Minorista' : 'Mayorista'} - Wall-Mapu`,
        description: `Suscripción mensual para ${shop.name}`,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: planPrice,
      },
    ],
    payer: {
      email: user.email,
      name: user.firstName || user.name,
      surname: user.lastName || '',
    },
    back_urls: {
      success: process.env.MERCADOPAGO_SUCCESS_URL,
      failure: process.env.MERCADOPAGO_FAILURE_URL,
      pending: process.env.MERCADOPAGO_PENDING_URL,
    },
    auto_return: 'approved',
    external_reference: subscription.id, // ID de la suscripción para identificarla en el webhook
    notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
    statement_descriptor: 'WALLMAPU',
    expires: false,
  };

  try {
    const response = await mercadopago.preferences.create(preference);

    // Retornar el init_point (URL de checkout)
    return {
      initPoint: response.body.init_point,
      preferenceId: response.body.id,
    };
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    throw error;
  }
}
```

## Webhook para recibir notificaciones de pago

```javascript
// POST /api/subscriptions/webhook
async function handleMercadoPagoWebhook(req, res) {
  const { type, data } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;

    // Obtener información del pago
    const payment = await mercadopago.payment.findById(paymentId);

    const subscriptionId = payment.body.external_reference;
    const status = payment.body.status;

    // Actualizar suscripción según el estado
    switch (status) {
      case 'approved':
        await updateSubscription(subscriptionId, {
          status: 'active',
          lastPaymentDate: new Date(),
          startDate: new Date(),
          endDate: addMonths(new Date(), 1), // 1 mes de suscripción
        });
        break;
      case 'pending':
      case 'in_process':
        await updateSubscription(subscriptionId, { status: 'pending' });
        break;
      case 'rejected':
        await updateSubscription(subscriptionId, { status: 'failed' });
        break;
    }
  }

  res.status(200).send('OK');
}
```

## URLs de redirección después del pago

El usuario será redirigido a estas URLs después de pagar. Puedes hacer que redirijan a deep links de la app:

### Opción 1: Redirigir al sitio web
```
SUCCESS: https://wallmapu.com/payment/success?subscription_id={id}
FAILURE: https://wallmapu.com/payment/failure?subscription_id={id}
PENDING: https://wallmapu.com/payment/pending?subscription_id={id}
```

### Opción 2: Redirigir a la app (deep link)
```
SUCCESS: wallmapu://payment/success?subscription_id={id}
FAILURE: wallmapu://payment/failure?subscription_id={id}
PENDING: wallmapu://payment/pending?subscription_id={id}
```

## Testing con tarjetas de prueba

Para probar en modo sandbox, usar estas tarjetas:

### Tarjeta APROBADA:
- Número: 5031 7557 3453 0604
- CVV: 123
- Vencimiento: 11/25
- Nombre: APRO (para aprobar)

### Tarjeta RECHAZADA:
- Número: 5031 7557 3453 0604
- CVV: 123
- Vencimiento: 11/25
- Nombre: OTHE (para rechazar)

### Tarjeta PENDIENTE:
- Número: 5031 7557 3453 0604
- CVV: 123
- Vencimiento: 11/25
- Nombre: CONT (para dejar pendiente)

## Checklist para el desarrollador

- [ ] Configurar `MERCADOPAGO_ACCESS_TOKEN` en variables de entorno
- [ ] Configurar `MERCADOPAGO_PUBLIC_KEY` en variables de entorno
- [ ] Cambiar precios a $1 y $2 para pruebas
- [ ] Implementar creación de preferencia de MercadoPago al crear suscripción
- [ ] Guardar `initPoint` en la respuesta de crear suscripción
- [ ] Implementar webhook para recibir notificaciones de pago
- [ ] Implementar endpoint `DELETE /api/subscriptions/:id` o `/me`
- [ ] Probar flujo completo con tarjetas de prueba
