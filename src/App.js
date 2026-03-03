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
import { RootNavigator } from './navigation';
import { darkTheme } from './theme';

export default function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
