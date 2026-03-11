import { StatusBar } from 'react-native';
import {
  AuthProvider,
  CartProvider,
  FavoritesProvider,
  ChatProvider,
  JobsProvider,
  MechanicProfileProvider,
  MechanicServicesProvider,
  NotificationsProvider,
  SellerStoreProvider,
  SparePartsProfileProvider,
  ThemeProvider,
} from './context';
import { AppAlertProvider, NotificationsGlobalGate } from './components';
import { RootNavigator } from './navigation';
import { darkTheme } from './theme';

export default function App() {
  return (
    <ThemeProvider>
      <AppAlertProvider>
        <AuthProvider>
          <NotificationsProvider>
          <ChatProvider>
            <JobsProvider>
              <MechanicProfileProvider>
                <SparePartsProfileProvider>
                  <SellerStoreProvider>
                    <FavoritesProvider>
                      <CartProvider>
                        <MechanicServicesProvider>
                          <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />
                          <RootNavigator />
                          <NotificationsGlobalGate />
                        </MechanicServicesProvider>
                      </CartProvider>
                    </FavoritesProvider>
                  </SellerStoreProvider>
                </SparePartsProfileProvider>
              </MechanicProfileProvider>
            </JobsProvider>
          </ChatProvider>
          </NotificationsProvider>
        </AuthProvider>
      </AppAlertProvider>
    </ThemeProvider>
  );
}
