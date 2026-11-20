import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import {
  MAX_CUSTOMER_NAME_LENGTH,
  MAX_CUSTOMER_PHONE_LENGTH,
  MAX_SCHEDULE_LENGTH,
  MAX_SERVICE_ADDRESS_LENGTH,
  MAX_SERVICE_NOTES_LENGTH,
} from '../../constants/pricing';
import { BRAND } from '../../constants/theme';
import { SectionCard } from '../SectionCard';

interface CustomerCardProps {
  value: string;
  onChangeText: (value: string) => void;
  errorText?: string;
  customerPhone: string;
  onChangeCustomerPhone: (value: string) => void;
  customerPhoneError?: string;
  serviceAddress: string;
  onChangeServiceAddress: (value: string) => void;
  serviceAddressError?: string;
  scheduledFor: string;
  onChangeScheduledFor: (value: string) => void;
  scheduledForError?: string;
  serviceNotes: string;
  onChangeServiceNotes: (value: string) => void;
  serviceNotesError?: string;
}

export function CustomerCard({
  value,
  onChangeText,
  errorText,
  customerPhone,
  onChangeCustomerPhone,
  customerPhoneError,
  serviceAddress,
  onChangeServiceAddress,
  serviceAddressError,
  scheduledFor,
  onChangeScheduledFor,
  scheduledForError,
  serviceNotes,
  onChangeServiceNotes,
  serviceNotesError,
}: CustomerCardProps) {
  const [showJobDetails, setShowJobDetails] = useState(false);

  return (
    <SectionCard
      title="Customer & job"
      subtitle="Start with the customer; add job details when you have them."
      icon="account-outline"
    >
      <TextInput
        mode="outlined"
        label="Customer name"
        placeholder="e.g. Maria Santos"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={MAX_CUSTOMER_NAME_LENGTH}
        left={<TextInput.Icon icon="account" color={BRAND.primary} />}
        error={Boolean(errorText)}
        returnKeyType="done"
        accessibilityLabel="Customer name"
      />
      {errorText ? (
        <Text style={styles.error}>{errorText}</Text>
      ) : null}

      <View style={styles.footerRow}>
        <Text style={styles.helper}>The invoice number and date are created when you save.</Text>
        <Text style={styles.counter}>
          {value.length}/{MAX_CUSTOMER_NAME_LENGTH}
        </Text>
      </View>

      <Button
        mode="text"
        icon={showJobDetails ? 'chevron-up' : 'plus-circle-outline'}
        onPress={() => setShowJobDetails((current) => !current)}
        style={styles.jobDetailsButton}
        contentStyle={styles.jobDetailsContent}
      >
        {showJobDetails ? 'Hide optional job details' : 'Add phone, schedule or address'}
      </Button>

      {showJobDetails ? (
        <View style={styles.jobFields}>
          <TextInput
            mode="outlined"
            label="Customer phone"
            placeholder="e.g. 0917 123 4567"
            value={customerPhone}
            onChangeText={onChangeCustomerPhone}
            autoCorrect={false}
            keyboardType="phone-pad"
            maxLength={MAX_CUSTOMER_PHONE_LENGTH}
            left={<TextInput.Icon icon="phone-outline" color={BRAND.primary} />}
            error={Boolean(customerPhoneError)}
            accessibilityLabel="Customer phone number"
          />
          {customerPhoneError ? <Text style={styles.error}>{customerPhoneError}</Text> : null}

          <TextInput
            mode="outlined"
            label="Service schedule"
            placeholder="e.g. Fri, 9:00 AM"
            value={scheduledFor}
            onChangeText={onChangeScheduledFor}
            autoCapitalize="sentences"
            maxLength={MAX_SCHEDULE_LENGTH}
            left={<TextInput.Icon icon="calendar-clock-outline" color={BRAND.primary} />}
            error={Boolean(scheduledForError)}
            style={styles.field}
            accessibilityLabel="Service schedule"
          />
          {scheduledForError ? <Text style={styles.error}>{scheduledForError}</Text> : null}

          <TextInput
            mode="outlined"
            label="Service address"
            placeholder="Where will the cleaning happen?"
            value={serviceAddress}
            onChangeText={onChangeServiceAddress}
            autoCapitalize="sentences"
            maxLength={MAX_SERVICE_ADDRESS_LENGTH}
            multiline
            numberOfLines={2}
            left={<TextInput.Icon icon="map-marker-outline" color={BRAND.primary} />}
            error={Boolean(serviceAddressError)}
            style={styles.field}
            accessibilityLabel="Service address"
          />
          {serviceAddressError ? <Text style={styles.error}>{serviceAddressError}</Text> : null}

          <TextInput
            mode="outlined"
            label="Service notes"
            placeholder="Optional access, parking, or cleaning notes"
            value={serviceNotes}
            onChangeText={onChangeServiceNotes}
            autoCapitalize="sentences"
            maxLength={MAX_SERVICE_NOTES_LENGTH}
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="note-text-outline" color={BRAND.primary} />}
            error={Boolean(serviceNotesError)}
            style={styles.field}
            accessibilityLabel="Service notes"
          />
          {serviceNotesError ? <Text style={styles.error}>{serviceNotesError}</Text> : null}
          <Text style={styles.jobHint}>
            Job details appear on shared and printed invoices.
          </Text>
        </View>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  error: {
    color: BRAND.danger,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
    marginHorizontal: 4,
    gap: 12,
  },
  jobDetailsButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: -8,
  },
  jobDetailsContent: {
    minHeight: 42,
  },
  jobFields: {
    marginTop: 4,
  },
  field: {
    marginTop: 12,
  },
  jobHint: {
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    marginHorizontal: 4,
  },
  helper: {
    color: BRAND.muted,
    fontSize: 12,
    flex: 1,
  },
  counter: {
    color: BRAND.muted,
    fontSize: 12,
  },
});
