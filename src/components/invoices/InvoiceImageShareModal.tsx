import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
  type ViewInstance,
} from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { BRAND } from '../../constants/theme';
import { shareInvoiceImage } from '../../services/imageService';
import type { Invoice } from '../../types/invoice';
import { getErrorMessage } from '../../utils/errors';
import { InvoiceImageSheet } from './InvoiceImageSheet';

interface InvoiceImageShareModalProps {
  invoice: Invoice | null;
  onDismiss: () => void;
}

/**
 * Renders a share-friendly invoice sheet, captures it as base64 PNG, writes
 * that PNG into the scoped cache, and opens the system share sheet.
 */
export function InvoiceImageShareModal({
  invoice,
  onDismiss,
}: InvoiceImageShareModalProps) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<ViewInstance>(null);
  const captureStartedRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    if (!invoice) {
      captureStartedRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setPreparing(false);
      return;
    }

    // A new invoice replaces any pending capture for the previous one, but do
    // not cancel the layout-driven capture for the invoice that just opened.
    if (captureStartedRef.current && captureStartedRef.current !== invoice.id) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      captureStartedRef.current = null;
    }
    setPreparing(true);
  }, [invoice?.id]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const captureAndShare = async (targetInvoice: Invoice) => {
    setPreparing(true);
    try {
      const base64 = await captureRef(sheetRef, {
        format: 'png',
        quality: 1,
        result: 'base64',
      });
      await shareInvoiceImage(targetInvoice.id, base64);
      setPreparing(false);
      onDismiss();
    } catch (error) {
      setPreparing(false);
      Alert.alert('Could not share invoice image', getErrorMessage(error));
      onDismiss();
    }
  };

  const handleSheetLayout = () => {
    if (!invoice || captureStartedRef.current === invoice.id) return;

    captureStartedRef.current = invoice.id;
    // Give the native text/layout pass one frame to settle before capturing.
    timerRef.current = setTimeout(() => {
      void captureAndShare(invoice);
    }, 150);
  };

  const requestDismiss = () => {
    if (preparing) return;
    onDismiss();
  };

  if (!invoice) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible
        onDismiss={requestDismiss}
        dismissable={!preparing}
        dismissableBackButton={!preparing}
        style={styles.modalWrapper}
        contentContainerStyle={styles.modalSurface}
      >
        <View style={styles.screen}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top, 8),
                paddingBottom: Math.max(insets.bottom, 8),
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View
              ref={sheetRef}
              collapsable={false}
              onLayout={handleSheetLayout}
              style={styles.sheetWrap}
            >
              <InvoiceImageSheet invoice={invoice} />
            </View>
          </ScrollView>

          {preparing ? (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color={BRAND.primary} />
              <Text style={styles.overlayTitle}>Preparing invoice image…</Text>
              <Text style={styles.overlayText}>
                The share sheet will open in a moment.
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'flex-start',
    marginTop: 0,
    marginBottom: 0,
    padding: 0,
  },
  modalSurface: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  sheetWrap: {
    width: '100%',
    maxWidth: 480,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(244, 247, 246, 0.97)',
  },
  overlayTitle: {
    marginTop: 16,
    color: BRAND.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  overlayText: {
    marginTop: 5,
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
