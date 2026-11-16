import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

interface SenhaItem {
  id: string;
  titulo: string;
  usuario: string;
  senha: string;
}

const STORAGE_KEY = '@safevault:senhas';

export default function SenhasScreen() {
  const insets = useSafeAreaInsets();

  const [senhas, setSenhas] = useState<SenhaItem[]>([]);
  const [busca, setBusca] = useState('');
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<string, boolean>>({});

  const [modalVisivel, setModalVisivel] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [usuario, setUsuario] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  const [itemParaExcluir, setItemParaExcluir] = useState<SenhaItem | null>(null);

  useEffect(() => {
    carregarSenhas();
  }, []);

  const carregarSenhas = async () => {
    try {
      const dadosSalvos = await AsyncStorage.getItem(STORAGE_KEY);
      if (dadosSalvos) {
        setSenhas(JSON.parse(dadosSalvos));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as senhas salvas.');
    }
  };

  const salvarNoStorage = async (novaLista: SenhaItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
      setSenhas(novaLista);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar os dados.');
    }
  };

  const gerarSenhaForte = () => {
    const maiusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const simbolos = '!@#$%&*_-+=';
    const todos = maiusculas + minusculas + numeros + simbolos;

    let senhaGerada =
      maiusculas[Math.floor(Math.random() * maiusculas.length)] +
      minusculas[Math.floor(Math.random() * minusculas.length)] +
      numeros[Math.floor(Math.random() * numeros.length)] +
      simbolos[Math.floor(Math.random() * simbolos.length)];

    for (let i = 4; i < 14; i++) {
      senhaGerada += todos[Math.floor(Math.random() * todos.length)];
    }

    const embaralhada = senhaGerada
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    setNovaSenha(embaralhada);
  };

  const handleAdicionarSenha = async () => {
    if (!titulo.trim() || !usuario.trim() || !novaSenha.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha o serviço, usuário e senha.');
      return;
    }

    const novoItem: SenhaItem = {
      id: Date.now().toString(),
      titulo: titulo.trim(),
      usuario: usuario.trim(),
      senha: novaSenha.trim(),
    };

    const listaAtualizada = [novoItem, ...senhas];
    await salvarNoStorage(listaAtualizada);

    setTitulo('');
    setUsuario('');
    setNovaSenha('');
    setModalVisivel(false);
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;

    const filtradas = senhas.filter((item) => item.id !== itemParaExcluir.id);
    await salvarNoStorage(filtradas);
    setItemParaExcluir(null);
  };

  const alternarVisibilidade = async (id: string) => {
    if (senhasVisiveis[id]) {
      setSenhasVisiveis((prev) => ({ ...prev, [id]: false }));
      return;
    }

    try {
      const temLeitor = await LocalAuthentication.hasHardwareAsync();
      const temDigital = await LocalAuthentication.isEnrolledAsync();

      if (!temLeitor || !temDigital) {
        setSenhasVisiveis((prev) => ({ ...prev, [id]: true }));
        return;
      }

      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme sua identidade para revelar a senha',
        fallbackLabel: 'Usar senha do aparelho',
      });

      if (auth.success) {
        setSenhasVisiveis((prev) => ({ ...prev, [id]: true }));
      }
    } catch {
      setSenhasVisiveis((prev) => ({ ...prev, [id]: true }));
    }
  };

  const senhasFiltradas = senhas.filter(
    (item) =>
      item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      item.usuario.toLowerCase().includes(busca.toLowerCase())
  );

  const renderItem = ({ item }: { item: SenhaItem }) => {
    const estaVisivel = !!senhasVisiveis[item.id];

    return (
      <View style={styles.card}>
        <View style={styles.cardAccentStrip} />

        <View style={styles.cardTopRow}>
          <View style={styles.serviceIcon}>
            <Ionicons name="key" size={20} color="#00F5D4" />
          </View>

          <View style={styles.serviceInfo}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardUser}>{item.usuario}</Text>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => setItemParaExcluir(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#F87171" />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordBox}>
          <View style={styles.passwordValueContainer}>
            <Ionicons
              name={estaVisivel ? 'lock-open-outline' : 'lock-closed-outline'}
              size={15}
              color={estaVisivel ? '#00F5D4' : '#64748B'}
            />
            <Text
              style={[
                styles.passwordText,
                estaVisivel && styles.passwordTextRevealed,
              ]}
            >
              {estaVisivel ? item.senha : '••••••••••••'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.revealBtn, estaVisivel && styles.revealBtnActive]}
            onPress={() => alternarVisibilidade(item.id)}
          >
            <Ionicons
              name={estaVisivel ? 'eye-off-outline' : 'finger-print'}
              size={16}
              color={estaVisivel ? '#06040F' : '#00F5D4'}
            />
            <Text
              style={[
                styles.revealBtnText,
                estaVisivel && styles.revealBtnTextActive,
              ]}
            >
              {estaVisivel ? 'Ocultar' : 'Revelar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerControls}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar serviço ou login..."
            placeholderTextColor="#64748B"
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={() => setModalVisivel(true)}
        >
          <Ionicons name="add" size={22} color="#06040F" />
          <Text style={styles.addBtnText}>Nova</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          {senhasFiltradas.length}{' '}
          {senhasFiltradas.length === 1 ? 'credencial salva' : 'credenciais salvas'}
        </Text>
        <View style={styles.bioTag}>
          <Ionicons name="shield-checkmark" size={12} color="#00F5D4" />
          <Text style={styles.bioTagText}>Protegido por digital</Text>
        </View>
      </View>

      <FlatList
        data={senhasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="key-outline" size={34} color="#00F5D4" />
            </View>
            <Text style={styles.emptyTitle}>Cofre vazio</Text>
            <Text style={styles.emptySubtitle}>
              {busca
                ? 'Nenhuma senha encontrada para essa busca.'
                : 'Toque em "+ Nova" acima para salvar sua primeira credencial com segurança.'}
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisivel(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 16 },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color="#00F5D4" />
                <Text style={styles.modalTitle}>Nova Credencial</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>SERVIÇO OU SITE</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Nubank, Gmail, Instagram..."
              placeholderTextColor="#64748B"
              value={titulo}
              onChangeText={setTitulo}
            />

            <Text style={styles.inputLabel}>E-MAIL OU USUÁRIO</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: seuemail@dominio.com"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              value={usuario}
              onChangeText={setUsuario}
            />

            <View style={styles.passwordLabelRow}>
              <Text style={styles.inputLabel}>SENHA</Text>
              <TouchableOpacity
                style={styles.generateBtn}
                activeOpacity={0.75}
                onPress={gerarSenhaForte}
              >
                <Ionicons name="flash" size={13} color="#06040F" />
                <Text style={styles.generateBtnText}>Gerar Senha Forte</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Digite ou gere uma senha"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              value={novaSenha}
              onChangeText={setNovaSenha}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAdicionarSenha}
              >
                <Ionicons name="checkmark" size={18} color="#06040F" />
                <Text style={styles.saveBtnText}>Salvar no Cofre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={itemParaExcluir !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setItemParaExcluir(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="trash" size={26} color="#F87171" />
            </View>

            <Text style={styles.confirmTitle}>Remover Credencial</Text>
            <Text style={styles.confirmText}>
              Deseja excluir permanentemente a senha de{' '}
              <Text style={styles.confirmHighlight}>
                {itemParaExcluir?.titulo}
              </Text>
              ?
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setItemParaExcluir(null)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={confirmarExclusao}
              >
                <Ionicons name="trash-outline" size={17} color="#FFFFFF" />
                <Text style={styles.confirmDeleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06040F',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerControls: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#100D23',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F5D4',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 4,
    shadowColor: '#00F5D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  addBtnText: {
    color: '#06040F',
    fontWeight: '800',
    fontSize: 14,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  counterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bioTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bioTagText: {
    color: '#00F5D4',
    fontSize: 11.5,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 30,
    gap: 12,
  },
  card: {
    backgroundColor: '#100D23',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.35)',
    overflow: 'hidden',
    gap: 12,
  },
  cardAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#00F5D4',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cardUser: {
    color: '#A5B4FC',
    fontSize: 13,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#06040F',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1B3A',
  },
  passwordValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  passwordText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
  },
  passwordTextRevealed: {
    color: '#00F5D4',
    letterSpacing: 0.5,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 212, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.4)',
    gap: 5,
  },
  revealBtnActive: {
    backgroundColor: '#00F5D4',
  },
  revealBtnText: {
    color: '#00F5D4',
    fontSize: 12,
    fontWeight: '800',
  },
  revealBtnTextActive: {
    color: '#06040F',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 4, 15, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#100D23',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1.5,
    borderColor: '#00F5D4',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#06040F',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#252147',
    fontSize: 14.5,
    marginBottom: 16,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F5D4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  generateBtnText: {
    color: '#06040F',
    fontSize: 11,
    fontWeight: '800',
  },
  passwordInput: {
    color: '#00F5D4',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E2954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00F5D4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#06040F',
    fontWeight: '800',
    fontSize: 14,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 4, 15, 0.88)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmBox: {
    backgroundColor: '#100D23',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(248, 113, 113, 0.45)',
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
  },
  confirmText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  confirmHighlight: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});