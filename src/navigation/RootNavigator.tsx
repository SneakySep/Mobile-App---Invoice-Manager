import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';

import { BRAND, appTheme } from '../constants/theme';
import { useInvoices } from '../providers/InvoicesProvider';
import { InvoiceCreatorScreen } from '../screens/InvoiceCreatorScreen';
import { InvoiceListScreen } from '../screens/InvoiceListScreen';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const navigationTheme: NavigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: appTheme.colors.primary,
    background: appTheme.colors.background,
    card: appTheme.colors.surface,
    text: appTheme.colors.onSurface,
    border: appTheme.colors.outlineVariant,
    notification: appTheme.colors.error,
  },
};

export function RootNavigator() {
  const { outstandingCount } = useInvoices();
  const invoiceBadge =
    outstandingCount > 0 ? (outstandingCount > 99 ? '99+' : outstandingCount) : undefined;

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: BRAND.primary,
          tabBarInactiveTintColor: BRAND.muted,
          tabBarHideOnKeyboard: true,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="CreateInvoice"
          component={InvoiceCreatorScreen}
          options={{
            title: 'New Invoice',
            tabBarLabel: 'New Invoice',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'file-document-plus' : 'file-document-plus-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Invoices"
          component={InvoiceListScreen}
          options={{
            title: 'Invoices',
            tabBarLabel: 'Invoices',
            tabBarBadge: invoiceBadge,
            tabBarBadgeStyle: styles.tabBadge,
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'receipt-text' : 'receipt-text-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: BRAND.surface,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  tabBadge: {
    backgroundColor: BRAND.danger,
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    minWidth: 18,
    height: 18,
    lineHeight: 18,
  },
});
