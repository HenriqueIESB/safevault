import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  const navegarPara = (rota: Href) => {
    router.push(rota);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Barra Superior */}
        <View style={styles.topBar}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Cofre Protegido</Text>
          </View>

          <View style={styles.cyberBadge}>
            <Ionicons name="finger-print" size={14} color="#E879F9" />
            <Text style={styles.cyberText}>Biometria</Text>
          </View>
        </View>

        {/* Emblema Central (Apenas Azul Neon) */}
        <View style={styles.heroSection}>
          <View style={styles.logoCore}>
            <Ionicons name="shield-checkmark" size={44} color="#00F5D4" />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.titleWhite}>SAFE</Text>
            <Text style={styles.titleNeon}>VAULT</Text>
          </View>

          <Text style={styles.subtitle}>
            Central blindada para credenciais críticas e documentos confidenciais.
          </Text>
        </View>

        {/* Menu de Cofres */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="finger-print" size={15} color="#00F5D4" />
            <Text style={styles.sectionLabel}>SELECIONE O MÓDULO</Text>
          </View>

          {/* Card 1: Senhas */}
          <TouchableOpacity
            style={[styles.card, styles.cyanCard]}
            activeOpacity={0.75}
            onPress={() => navegarPara('/senhas')}
          >
            <View style={styles.cyanAccentStrip} />

            <View style={[styles.iconBox, styles.cyanIconBox]}>
              <Ionicons name="key" size={26} color="#00F5D4" />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Senhas</Text>
                <View style={styles.cyanPill}>
                  <Text style={styles.cyanPillText}>CREDENCIAIS</Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>
                Logins, bancos, e-mails e chaves de acesso
              </Text>
            </View>

            <View style={[styles.actionBtn, styles.cyanActionBtn]}>
              <Ionicons name="arrow-forward" size={18} color="#06040F" />
            </View>
          </TouchableOpacity>

          {/* Card 2: Documentos */}
          <TouchableOpacity
            style={[styles.card, styles.magentaCard]}
            activeOpacity={0.75}
            onPress={() => navegarPara('/documentos')}
          >
            <View style={styles.magentaAccentStrip} />

            <View style={[styles.iconBox, styles.magentaIconBox]}>
              <Ionicons name="document-text" size={26} color="#E879F9" />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Documentos</Text>
                <View style={styles.magentaPill}>
                  <Text style={styles.magentaPillText}>ARQUIVOS</Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>
                Fotos de RG, CNH, contratos e PDFs privados
              </Text>
            </View>

            <View style={[styles.actionBtn, styles.magentaActionBtn]}>
              <Ionicons name="arrow-forward" size={18} color="#06040F" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Ionicons name="lock-closed" size={13} color="#00F5D4" />
          <Text style={styles.footerText}>
            CRIPTOGRAFIA LOCAL • ACESSO BIOMÉTRICO
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#06040F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.35)',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F5D4',
    shadowColor: '#00F5D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  liveText: {
    color: '#00F5D4',
    fontSize: 12,
    fontWeight: '700',
  },
  cyberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 121, 249, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.4)',
    gap: 6,
  },
  cyberText: {
    color: '#E879F9',
    fontSize: 12,
    fontWeight: '700',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 8,
  },
  logoCore: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#130F2B',
    borderWidth: 2,
    borderColor: '#00F5D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#00F5D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleWhite: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  titleNeon: {
    fontSize: 34,
    fontWeight: '900',
    color: '#00F5D4',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 245, 212, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#A5B4FC',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 270,
  },
  menuSection: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#100D23',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 14,
    overflow: 'hidden',
  },
  cyanCard: {
    borderColor: 'rgba(0, 245, 212, 0.45)',
    shadowColor: '#00F5D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  magentaCard: {
    borderColor: 'rgba(232, 121, 249, 0.45)',
    shadowColor: '#E879F9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cyanAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#00F5D4',
  },
  magentaAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#E879F9',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cyanIconBox: {
    backgroundColor: 'rgba(0, 245, 212, 0.14)',
    borderColor: 'rgba(0, 245, 212, 0.4)',
  },
  magentaIconBox: {
    backgroundColor: 'rgba(232, 121, 249, 0.14)',
    borderColor: 'rgba(232, 121, 249, 0.4)',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cyanPill: {
    backgroundColor: 'rgba(0, 245, 212, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cyanPillText: {
    color: '#00F5D4',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  magentaPill: {
    backgroundColor: 'rgba(232, 121, 249, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  magentaPillText: {
    color: '#E879F9',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cyanActionBtn: {
    backgroundColor: '#00F5D4',
  },
  magentaActionBtn: {
    backgroundColor: '#E879F9',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  footerText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});