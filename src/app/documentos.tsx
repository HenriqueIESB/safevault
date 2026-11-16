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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { File, Paths } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

interface DocumentoItem {
  id: string;
  titulo: string;
  tipo: 'imagem' | 'pdf';
  uri: string;
  nomeArquivo: string;
  dataCriacao: string;
}

interface ArquivoSelecionado {
  uri: string;
  nome: string;
  tipo: 'imagem' | 'pdf';
}

const STORAGE_KEY = '@safevault:documentos';

export default function DocumentosScreen() {
  const insets = useSafeAreaInsets();

  const [documentos, setDocumentos] = useState<DocumentoItem[]>([]);
  const [busca, setBusca] = useState('');

  const [modalVisivel, setModalVisivel] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<ArquivoSelecionado | null>(null);

  const [imagemVisualizando, setImagemVisualizando] = useState<DocumentoItem | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<DocumentoItem | null>(null);

  useEffect(() => {
    carregarDocumentos();
  }, []);

  const carregarDocumentos = async () => {
    try {
      const dadosSalvos = await AsyncStorage.getItem(STORAGE_KEY);
      if (dadosSalvos) {
        setDocumentos(JSON.parse(dadosSalvos));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os documentos salvos.');
    }
  };

  const salvarNoStorage = async (novaLista: DocumentoItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
      setDocumentos(novaLista);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar os dados.');
    }
  };

  const formatarDataAtual = () => {
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const selecionarArquivo = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!resultado.canceled && resultado.assets.length > 0) {
        const arquivo = resultado.assets[0];
        const ehPdf =
          arquivo.mimeType === 'application/pdf' ||
          arquivo.name.toLowerCase().endsWith('.pdf');

        setArquivoSelecionado({
          uri: arquivo.uri,
          nome: arquivo.name,
          tipo: ehPdf ? 'pdf' : 'imagem',
        });

        if (!titulo.trim()) {
          const nomeSemExtensao = arquivo.name.replace(/\.[^/.]+$/, '');
          setTitulo(nomeSemExtensao);
        }
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível selecionar o arquivo.');
    }
  };

  const handleAdicionarDocumento = async () => {
    if (!titulo.trim()) {
      Alert.alert('Título obrigatório', 'Dê um nome para identificar este documento.');
      return;
    }

    if (!arquivoSelecionado) {
      Alert.alert('Arquivo obrigatório', 'Selecione uma imagem da galeria ou um arquivo PDF.');
      return;
    }

    let uriFinal = arquivoSelecionado.uri;

    try {
      const extensao =
        arquivoSelecionado.nome.split('.').pop() ||
        (arquivoSelecionado.tipo === 'pdf' ? 'pdf' : 'jpg');
      const nomeDestino = `doc_${Date.now()}.${extensao}`;
      const arquivoOrigem = new File(arquivoSelecionado.uri);
      const arquivoDestino = new File(Paths.document, nomeDestino);
      arquivoOrigem.copy(arquivoDestino);
      uriFinal = arquivoDestino.uri;
    } catch {
      uriFinal = arquivoSelecionado.uri;
    }

    const novoItem: DocumentoItem = {
      id: Date.now().toString(),
      titulo: titulo.trim(),
      tipo: arquivoSelecionado.tipo,
      uri: uriFinal,
      nomeArquivo: arquivoSelecionado.nome,
      dataCriacao: formatarDataAtual(),
    };

    const listaAtualizada = [novoItem, ...documentos];
    await salvarNoStorage(listaAtualizada);

    setTitulo('');
    setArquivoSelecionado(null);
    setModalVisivel(false);
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;

    try {
      const arquivo = new File(itemParaExcluir.uri);
      if (arquivo.exists) {
        arquivo.delete();
      }
    } catch {}

    const filtrados = documentos.filter((item) => item.id !== itemParaExcluir.id);
    await salvarNoStorage(filtrados);
    setItemParaExcluir(null);
  };

  const verificarBiometria = async (mensagem: string): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    try {
      const temLeitor = await LocalAuthentication.hasHardwareAsync();
      const temDigital = await LocalAuthentication.isEnrolledAsync();

      if (!temLeitor || !temDigital) {
        return true;
      }

      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: mensagem,
        fallbackLabel: 'Usar senha do aparelho',
      });

      return auth.success;
    } catch {
      return true;
    }
  };

  const executarAberturaDocumento = async (item: DocumentoItem) => {
    if (item.tipo === 'imagem') {
      setImagemVisualizando(item);
      return;
    }

    if (Platform.OS === 'android') {
      try {
        const arquivo = new File(item.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: arquivo.contentUri,
          flags: 1,
          type: 'application/pdf',
        });
      } catch {
        Alert.alert(
          'Leitor de PDF não encontrado',
          'Nenhum aplicativo de leitura de PDF foi encontrado neste aparelho. Tente usar o botão de compartilhar ao lado.'
        );
      }
      return;
    }

    try {
      const disponivel = await Sharing.isAvailableAsync();
      if (!disponivel) {
        Alert.alert('Indisponível', 'Não há visualizador de PDF disponível neste aparelho.');
        return;
      }
      await Sharing.shareAsync(item.uri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
        dialogTitle: item.titulo,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o arquivo PDF.');
    }
  };

  const abrirDocumentoComBiometria = async (item: DocumentoItem) => {
    const autenticado = await verificarBiometria(
      `Confirme sua identidade para abrir "${item.titulo}"`
    );
    if (!autenticado) return;

    await executarAberturaDocumento(item);
  };

  const executarExportacaoArquivo = async (item: DocumentoItem) => {
    try {
      const disponivel = await Sharing.isAvailableAsync();
      if (disponivel) {
        await Sharing.shareAsync(item.uri, {
          dialogTitle: item.titulo,
        });
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar o arquivo.');
    }
  };

  const compartilharDocumentoComBiometria = async (item: DocumentoItem) => {
    const autenticado = await verificarBiometria(
      `Confirme sua identidade para compartilhar "${item.titulo}"`
    );
    if (!autenticado) return;

    await executarExportacaoArquivo(item);
  };

  const documentosFiltrados = documentos.filter(
    (item) =>
      item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      item.tipo.toLowerCase().includes(busca.toLowerCase())
  );

  const renderItem = ({ item }: { item: DocumentoItem }) => {
    const ehPdf = item.tipo === 'pdf';

    return (
      <View style={styles.card}>
        <View style={styles.cardAccentStrip} />

        <View style={styles.cardTopRow}>
          <View style={styles.docIconBox}>
            <Ionicons
              name={ehPdf ? 'document-text' : 'image'}
              size={22}
              color="#E879F9"
            />
          </View>

          <View style={styles.docInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.titulo}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {ehPdf ? 'PDF' : 'IMAGEM'}
                </Text>
              </View>
              <Text style={styles.dateText}>Salvo em {item.dataCriacao}</Text>
            </View>
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

        <View style={styles.actionBox}>
          <View style={styles.fileStatusRow}>
            <Ionicons name="lock-closed-outline" size={15} color="#94A3B8" />
            <Text style={styles.fileStatusText} numberOfLines={1}>
              Arquivo protegido no cofre
            </Text>
          </View>

          <View style={styles.cardButtonsRow}>
            <TouchableOpacity
              style={styles.shareSmallBtn}
              activeOpacity={0.8}
              onPress={() => compartilharDocumentoComBiometria(item)}
            >
              <Ionicons name="share-outline" size={16} color="#E879F9" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.openBtn}
              activeOpacity={0.8}
              onPress={() => abrirDocumentoComBiometria(item)}
            >
              <Ionicons name="finger-print" size={16} color="#E879F9" />
              <Text style={styles.openBtnText}>Abrir</Text>
            </TouchableOpacity>
          </View>
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
            placeholder="Buscar documento ou tipo..."
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
          <Text style={styles.addBtnText}>Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          {documentosFiltrados.length}{' '}
          {documentosFiltrados.length === 1 ? 'documento salvo' : 'documentos salvos'}
        </Text>
        <View style={styles.bioTag}>
          <Ionicons name="shield-checkmark" size={12} color="#E879F9" />
          <Text style={styles.bioTagText}>Protegido por digital</Text>
        </View>
      </View>

      <FlatList
        data={documentosFiltrados}
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
              <Ionicons name="document-lock-outline" size={34} color="#E879F9" />
            </View>
            <Text style={styles.emptyTitle}>Cofre de documentos vazio</Text>
            <Text style={styles.emptySubtitle}>
              {busca
                ? 'Nenhum documento encontrado para essa busca.'
                : 'Toque em "+ Novo" para importar fotos da galeria ou arquivos PDF.'}
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
                <Ionicons name="document-lock" size={20} color="#E879F9" />
                <Text style={styles.modalTitle}>Novo Documento</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>NOME DO DOCUMENTO</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: CNH Digital, RG, Contrato PDF..."
              placeholderTextColor="#64748B"
              value={titulo}
              onChangeText={setTitulo}
            />

            <Text style={styles.inputLabel}>ARQUIVO</Text>

            <TouchableOpacity
              style={styles.uploadCard}
              activeOpacity={0.75}
              onPress={selecionarArquivo}
            >
              <View style={styles.pickerIconCircle}>
                <Ionicons name="folder-open" size={24} color="#E879F9" />
              </View>
              <View style={styles.uploadTextGroup}>
                <Text style={styles.pickerBtnTitle}>
                  Selecionar da Galeria ou PDF
                </Text>
                <Text style={styles.pickerBtnSub}>
                  Toque para escolher uma imagem ou documento PDF
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            {arquivoSelecionado && (
              <View style={styles.selectedFileBox}>
                {arquivoSelecionado.tipo === 'imagem' ? (
                  <Image
                    source={{ uri: arquivoSelecionado.uri }}
                    style={styles.previewThumb}
                  />
                ) : (
                  <Ionicons name="document-text" size={22} color="#E879F9" />
                )}
                <Text style={styles.selectedFileName} numberOfLines={1}>
                  {arquivoSelecionado.nome}
                </Text>
                <TouchableOpacity onPress={() => setArquivoSelecionado(null)}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisivel(false);
                  setArquivoSelecionado(null);
                  setTitulo('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAdicionarDocumento}
              >
                <Ionicons name="checkmark" size={18} color="#06040F" />
                <Text style={styles.saveBtnText}>Salvar no Cofre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={imagemVisualizando !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setImagemVisualizando(null)}
      >
        <View
          style={[
            styles.viewerOverlay,
            {
              paddingTop: Math.max(insets.top, 24),
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          <View style={styles.viewerHeader}>
            <View style={styles.viewerTitleGroup}>
              <Ionicons name="shield-checkmark" size={18} color="#E879F9" />
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {imagemVisualizando?.titulo}
              </Text>
            </View>

            <View style={styles.viewerActions}>
              {imagemVisualizando && (
                <TouchableOpacity
                  style={styles.viewerIconBtn}
                  onPress={() => executarExportacaoArquivo(imagemVisualizando)}
                >
                  <Ionicons name="share-outline" size={20} color="#E879F9" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.viewerCloseBtn}
                onPress={() => setImagemVisualizando(null)}
              >
                <Ionicons name="close" size={20} color="#06040F" />
                <Text style={styles.viewerCloseText}>Bloquear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {imagemVisualizando && (
            <Image
              source={{ uri: imagemVisualizando.uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
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

            <Text style={styles.confirmTitle}>Remover Documento</Text>
            <Text style={styles.confirmText}>
              Deseja excluir permanentemente{' '}
              <Text style={styles.confirmHighlight}>
                {itemParaExcluir?.titulo}
              </Text>{' '}
              do cofre?
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
    borderColor: 'rgba(232, 121, 249, 0.28)',
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
    backgroundColor: '#E879F9',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 4,
    shadowColor: '#E879F9',
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
    color: '#E879F9',
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
    borderColor: 'rgba(232, 121, 249, 0.35)',
    overflow: 'hidden',
    gap: 12,
  },
  cardAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#E879F9',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(232, 121, 249, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(232, 121, 249, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#E879F9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  deleteBtn: {
    padding: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#06040F',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1B3A',
    gap: 10,
  },
  fileStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  fileStatusText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '600',
  },
  cardButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareSmallBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(232, 121, 249, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 121, 249, 0.15)',
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.45)',
    gap: 5,
  },
  openBtnText: {
    color: '#E879F9',
    fontSize: 12,
    fontWeight: '800',
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
    backgroundColor: 'rgba(232, 121, 249, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.3)',
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
    borderColor: '#E879F9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
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
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06040F',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.35)',
    gap: 12,
    marginBottom: 16,
  },
  pickerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(232, 121, 249, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextGroup: {
    flex: 1,
    gap: 2,
  },
  pickerBtnTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pickerBtnSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 121, 249, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 10,
  },
  previewThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#06040F',
  },
  selectedFileName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
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
    backgroundColor: '#E879F9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#06040F',
    fontWeight: '800',
    fontSize: 14,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: '#06040F',
    paddingHorizontal: 16,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1B3A',
    gap: 12,
  },
  viewerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  viewerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  viewerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(232, 121, 249, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E879F9',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    gap: 4,
  },
  viewerCloseText: {
    color: '#06040F',
    fontSize: 13,
    fontWeight: '800',
  },
  fullImage: {
    flex: 1,
    width: '100%',
    marginTop: 12,
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