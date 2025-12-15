import React, { useState } from 'react';
import { MainStackNavigationProp } from '../../types/navigation.types';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../constants/colors';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Tipos para mascotas
interface Pet {
  id: string;
  type: 'dog' | 'cat' | 'other';
  name: string;
  breed: string;
  age: string;
}

// Tipos para género
type Gender = 'female' | 'male' | 'other' | '';

interface CompleteProfileScreenProps {
  navigation: MainStackNavigationProp<'CompleteProfile'>;
}

const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = ({ navigation }) => {
  const { setNeedsProfileCompletion } = useAuth();

  // Datos opcionales del cliente
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender>('');
  const [barrio, setBarrio] = useState('');

  // Mascotas
  const [hasDogs, setHasDogs] = useState(false);
  const [hasCats, setHasCats] = useState(false);
  const [hasOtherPets, setHasOtherPets] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [petForm, setPetForm] = useState<Omit<Pet, 'id'>>({
    type: 'dog',
    name: '',
    breed: '',
    age: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);

  // Funciones para mascotas
  const addPet = () => {
    if (!petForm.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de tu mascota');
      return;
    }

    const newPet: Pet = {
      id: editingPet?.id || Date.now().toString(),
      ...petForm,
    };

    if (editingPet) {
      setPets(pets.map(p => p.id === editingPet.id ? newPet : p));
    } else {
      setPets([...pets, newPet]);
    }

    resetPetForm();
  };

  const resetPetForm = () => {
    setPetForm({ type: 'dog', name: '', breed: '', age: '' });
    setEditingPet(null);
    setShowPetModal(false);
  };

  const editPet = (pet: Pet) => {
    setEditingPet(pet);
    setPetForm({ type: pet.type, name: pet.name, breed: pet.breed, age: pet.age });
    setShowPetModal(true);
  };

  const deletePet = (petId: string) => {
    Alert.alert(
      'Eliminar mascota',
      '¿Estás seguro de eliminar esta mascota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => setPets(pets.filter(p => p.id !== petId)) },
      ]
    );
  };

  const formatBirthDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const handleSkip = () => {
    // Limpiar el flag y navegar al Home
    setNeedsProfileCompletion(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeTabs' }],
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Preparar datos para enviar
      const profileData: any = {};

      if (birthDate) {
        profileData.birthDate = birthDate.toISOString();
      }
      if (gender) {
        profileData.gender = gender;
      }
      if (barrio) {
        profileData.barrio = barrio;
      }

      // Tipos de mascotas
      profileData.hasDogs = hasDogs;
      profileData.hasCats = hasCats;
      profileData.hasOtherPets = hasOtherPets;

      // Detalles de mascotas
      if (pets.length > 0) {
        profileData.pets = pets;
      }

      // Llamar al API para actualizar el perfil
      await userService.updateProfile(profileData);

      // Limpiar el flag
      setNeedsProfileCompletion(false);

      Alert.alert(
        '¡Perfil completado!',
        'Tus datos han sido guardados correctamente.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'HomeTabs' }],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating profile:', error);
      // Limpiar el flag aunque falle
      setNeedsProfileCompletion(false);
      // Si falla, igual permitir continuar
      Alert.alert(
        'Aviso',
        'No se pudieron guardar algunos datos, pero puedes completarlos más tarde desde tu perfil.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'HomeTabs' }],
              });
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const hasAnyData = () => {
    return birthDate || gender || barrio || hasDogs || hasCats || hasOtherPets || pets.length > 0;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-circle-outline" size={80} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>¡Cuenta creada!</Text>
          <Text style={styles.subtitle}>
            Completa tu perfil para una mejor experiencia. Estos datos son opcionales y puedes agregarlos después.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Fecha de nacimiento */}
          <Text style={styles.label}>Fecha de nacimiento</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#999" />
            <Text style={[styles.datePickerText, !birthDate && styles.placeholderText]}>
              {birthDate ? formatBirthDate(birthDate) : 'Seleccionar fecha'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
            />
          )}

          {/* Género */}
          <Text style={styles.label}>Género</Text>
          <View style={styles.genderContainer}>
            {[
              { value: 'female', label: 'Femenino', icon: 'female' },
              { value: 'male', label: 'Masculino', icon: 'male' },
              { value: 'other', label: 'Otro', icon: 'person' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderButton,
                  gender === option.value && styles.genderButtonActive,
                ]}
                onPress={() => setGender(option.value as Gender)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={18}
                  color={gender === option.value ? '#fff' : COLORS.primary}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === option.value && styles.genderButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Barrio */}
          <Text style={styles.label}>Barrio</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="home-outline" size={20} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="Tu barrio o zona"
              placeholderTextColor={COLORS.placeholder}
              value={barrio}
              onChangeText={setBarrio}
            />
          </View>

          {/* Mascotas */}
          <Text style={styles.label}>¿Tienes mascotas?</Text>
          <View style={styles.petTypesContainer}>
            <TouchableOpacity
              style={[styles.petTypeButton, hasDogs && styles.petTypeButtonActive]}
              onPress={() => setHasDogs(!hasDogs)}
            >
              <Text style={styles.petTypeEmoji}>🐕</Text>
              <Text style={[styles.petTypeText, hasDogs && styles.petTypeTextActive]}>
                Perros
              </Text>
              {hasDogs && <Ionicons name="checkmark-circle" size={16} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.petTypeButton, hasCats && styles.petTypeButtonActive]}
              onPress={() => setHasCats(!hasCats)}
            >
              <Text style={styles.petTypeEmoji}>🐈</Text>
              <Text style={[styles.petTypeText, hasCats && styles.petTypeTextActive]}>
                Gatos
              </Text>
              {hasCats && <Ionicons name="checkmark-circle" size={16} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.petTypeButton, hasOtherPets && styles.petTypeButtonActive]}
              onPress={() => setHasOtherPets(!hasOtherPets)}
            >
              <Text style={styles.petTypeEmoji}>🐾</Text>
              <Text style={[styles.petTypeText, hasOtherPets && styles.petTypeTextActive]}>
                Otros
              </Text>
              {hasOtherPets && <Ionicons name="checkmark-circle" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>

          {/* Lista de mascotas */}
          {(hasDogs || hasCats || hasOtherPets) && (
            <View style={styles.petsSection}>
              <View style={styles.petsSectionHeader}>
                <Text style={styles.petsSectionTitle}>Mis mascotas</Text>
                <TouchableOpacity
                  style={styles.addPetButton}
                  onPress={() => {
                    setPetForm({
                      type: hasDogs ? 'dog' : hasCats ? 'cat' : 'other',
                      name: '',
                      breed: '',
                      age: '',
                    });
                    setShowPetModal(true);
                  }}
                >
                  <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                  <Text style={styles.addPetButtonText}>Agregar</Text>
                </TouchableOpacity>
              </View>

              {pets.length === 0 ? (
                <Text style={styles.noPetsText}>
                  Agrega los datos de tus mascotas (opcional)
                </Text>
              ) : (
                <View style={styles.petsList}>
                  {pets.map((pet) => (
                    <View key={pet.id} style={styles.petCard}>
                      <View style={styles.petCardLeft}>
                        <Text style={styles.petCardEmoji}>
                          {pet.type === 'dog' ? '🐕' : pet.type === 'cat' ? '🐈' : '🐾'}
                        </Text>
                        <View>
                          <Text style={styles.petCardName}>{pet.name}</Text>
                          <Text style={styles.petCardDetails}>
                            {pet.breed ? pet.breed : 'Sin raza'} {pet.age ? `• ${pet.age}` : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.petCardActions}>
                        <TouchableOpacity onPress={() => editPet(pet)}>
                          <Ionicons name="pencil" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deletePet(pet.id)}>
                          <Ionicons name="trash-outline" size={20} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Guardar y continuar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Omitir por ahora</Text>
          </TouchableOpacity>

          <Text style={styles.skipHint}>
            Puedes completar estos datos más tarde desde tu perfil
          </Text>
        </View>
      </ScrollView>

      {/* Modal para agregar/editar mascota */}
      <Modal
        visible={showPetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetPetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPet ? 'Editar mascota' : 'Agregar mascota'}
              </Text>
              <TouchableOpacity onPress={resetPetForm}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Tipo de mascota */}
            <Text style={styles.modalLabel}>Tipo</Text>
            <View style={styles.petTypeModalContainer}>
              {[
                { value: 'dog', label: 'Perro', emoji: '🐕', enabled: hasDogs },
                { value: 'cat', label: 'Gato', emoji: '🐈', enabled: hasCats },
                { value: 'other', label: 'Otro', emoji: '🐾', enabled: hasOtherPets },
              ]
                .filter((t) => t.enabled)
                .map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.petTypeModalButton,
                      petForm.type === option.value && styles.petTypeModalButtonActive,
                    ]}
                    onPress={() => setPetForm({ ...petForm, type: option.value as Pet['type'] })}
                  >
                    <Text style={styles.petTypeModalEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.petTypeModalText,
                        petForm.type === option.value && styles.petTypeModalTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Nombre */}
            <Text style={styles.modalLabel}>Nombre *</Text>
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Nombre de tu mascota"
                placeholderTextColor={COLORS.placeholder}
                value={petForm.name}
                onChangeText={(text) => setPetForm({ ...petForm, name: text })}
              />
            </View>

            {/* Raza */}
            <Text style={styles.modalLabel}>Raza</Text>
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: Labrador, Siamés, etc."
                placeholderTextColor={COLORS.placeholder}
                value={petForm.breed}
                onChangeText={(text) => setPetForm({ ...petForm, breed: text })}
              />
            </View>

            {/* Edad */}
            <Text style={styles.modalLabel}>Edad</Text>
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: 2 años, 6 meses"
                placeholderTextColor={COLORS.placeholder}
                value={petForm.age}
                onChangeText={(text) => setPetForm({ ...petForm, age: text })}
              />
            </View>

            {/* Botones */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={resetPetForm}>
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={addPet}>
                <Text style={styles.modalSaveButtonText}>
                  {editingPet ? 'Guardar' : 'Agregar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: COLORS.gray,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 10,
  },
  // Estilos para fecha de nacimiento
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.placeholder,
  },
  // Estilos para género
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 6,
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
  },
  genderButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: COLORS.white,
  },
  // Estilos para mascotas
  petTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  petTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 4,
    backgroundColor: COLORS.white,
  },
  petTypeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  petTypeEmoji: {
    fontSize: 16,
  },
  petTypeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  petTypeTextActive: {
    color: COLORS.white,
  },
  petsSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  petsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  petsSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  addPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addPetButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  noPetsText: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 16,
  },
  petsList: {
    gap: 8,
  },
  petCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  petCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  petCardEmoji: {
    fontSize: 24,
  },
  petCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  petCardDetails: {
    fontSize: 12,
    color: COLORS.gray,
  },
  petCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  // Botones
  buttonsContainer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray,
  },
  skipButtonText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: '600',
  },
  skipHint: {
    textAlign: 'center',
    color: COLORS.placeholder,
    fontSize: 13,
    marginTop: 16,
  },
  // Estilos para el modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalInputContainer: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalInput: {
    height: 50,
    fontSize: 16,
    color: COLORS.text,
  },
  petTypeModalContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  petTypeModalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 4,
    backgroundColor: COLORS.white,
  },
  petTypeModalButtonActive: {
    backgroundColor: COLORS.primary,
  },
  petTypeModalEmoji: {
    fontSize: 20,
  },
  petTypeModalText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  petTypeModalTextActive: {
    color: COLORS.white,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CompleteProfileScreen;
