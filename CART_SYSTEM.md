# Sistema de Carrito Local

Este documento describe el sistema de carrito local implementado usando Context API y AsyncStorage.

## Descripción General

El carrito está implementado como un Context de React que proporciona una forma centralizada y persistente de manejar los productos que el usuario desea comprar. Los datos del carrito se guardan automáticamente en AsyncStorage y se restauran cuando la aplicación se reinicia.

## Archivos Creados

### 1. `src/context/CartContext.tsx`

Context principal que contiene toda la lógica del carrito.

**Interfaces:**

```typescript
interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextData {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}
```

**Funcionalidades:**

- **CartProvider**: Componente proveedor que envuelve la aplicación
- **useCart()**: Hook personalizado para acceder al contexto del carrito
- Persistencia automática en AsyncStorage con clave `cart`
- Carga automática del carrito al iniciar la aplicación

## Archivos Modificados

### 1. `App.tsx`

Se agregó CartProvider al árbol de componentes:

```typescript
import { CartProvider } from './src/context/CartContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="dark" />
        </AuthProvider>
      </CartProvider>
    </SafeAreaProvider>
  );
}
```

### 2. `src/screens/ProductDetailScreen.tsx`

Se integró la funcionalidad de agregar productos al carrito:

```typescript
import { useCart } from '../context/CartContext';
import { ToastAndroid } from 'react-native';

const ProductDetailScreen = ({ navigation, route }) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (product) {
      addItem(product, 1);
      ToastAndroid.show(`${product.name} agregado al carrito`, ToastAndroid.SHORT);
    }
  };
  // ...
};
```

## Ejemplos de Uso

### Usar el carrito en cualquier componente

```typescript
import { useCart } from '../context/CartContext';

const MiComponente = () => {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  } = useCart();

  return (
    <View>
      {/* Mostrar cantidad total de items */}
      <Text>Items en carrito: {getTotalItems()}</Text>

      {/* Mostrar precio total */}
      <Text>Total: ${getTotalPrice().toFixed(2)}</Text>

      {/* Agregar un producto */}
      <Button
        title="Agregar producto"
        onPress={() => addItem(product, 1)}
      />

      {/* Actualizar cantidad */}
      <Button
        title="Cambiar cantidad"
        onPress={() => updateQuantity(productId, 5)}
      />

      {/* Eliminar producto */}
      <Button
        title="Eliminar"
        onPress={() => removeItem(productId)}
      />

      {/* Vaciar carrito */}
      <Button
        title="Vaciar carrito"
        onPress={() => clearCart()}
      />
    </View>
  );
};
```

### En un carrito visual (CartScreen)

```typescript
import { useCart } from '../context/CartContext';

const CartScreen = () => {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCart();

  return (
    <ScrollView>
      {items.map(item => (
        <View key={item.product.id} style={styles.cartItem}>
          <Image source={{ uri: item.product.images[0] }} />
          <View>
            <Text>{item.product.name}</Text>
            <Text>${item.product.priceRetail}</Text>
          </View>
          <View>
            <TextInput
              value={item.quantity.toString()}
              onChangeText={(text) => updateQuantity(item.product.id, parseInt(text))}
            />
            <Button
              title="Eliminar"
              onPress={() => removeItem(item.product.id)}
            />
          </View>
        </View>
      ))}

      <Text style={styles.total}>
        Total: ${getTotalPrice().toFixed(2)}
      </Text>
    </ScrollView>
  );
};
```

## Comportamiento

### Agregar productos

- Si el producto **no existe** en el carrito, se agrega con la cantidad especificada (por defecto 1)
- Si el producto **ya existe** en el carrito, se incrementa su cantidad
- Usa `addItem(product)` para agregar con cantidad 1
- Usa `addItem(product, 5)` para agregar con cantidad 5

### Eliminar productos

- `removeItem(productId)` elimina completamente el producto del carrito
- `updateQuantity(productId, 0)` también lo elimina (cantidad <= 0)

### Persistencia

- El carrito se guarda automáticamente en AsyncStorage cada vez que cambia
- Se carga automáticamente cuando la aplicación inicia
- La clave de almacenamiento es `cart`

## Persistencia en AsyncStorage

Los datos se almacenan en formato JSON con esta estructura:

```json
[
  {
    "product": { /* objeto Product completo */ },
    "quantity": 2
  },
  {
    "product": { /* objeto Product completo */ },
    "quantity": 1
  }
]
```

## Notas Importantes

1. **TypeScript**: Todo el código está completamente tipado
2. **AsyncStorage**: Requiere `@react-native-async-storage/async-storage` (ya instalado)
3. **Errores**: Los errores de almacenamiento se capturan y registran en consola
4. **Performance**: El carrito se carga solo una vez al iniciar la aplicación
5. **Toast Notifications**: Se usa `ToastAndroid` para notificar cuando se agrega un producto (Android)

## Debugging

Para limpiar el carrito durante desarrollo:

```typescript
// En AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Limpiar todo
await AsyncStorage.removeItem('cart');

// O usar clearCart() del hook
const { clearCart } = useCart();
clearCart();
```
