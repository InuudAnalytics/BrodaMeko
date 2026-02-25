import { StatusBar } from 'react-native';
import {
  AuthProvider,
  ChatProvider,
  JobsProvider,
  MechanicProfileProvider,
  MechanicServicesProvider,
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
        <ChatProvider>
          <JobsProvider>
            <MechanicProfileProvider>
              <SparePartsProfileProvider>
                <SellerStoreProvider>
                  <MechanicServicesProvider>
                    <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />
                    <RootNavigator />
                  </MechanicServicesProvider>
                </SellerStoreProvider>
              </SparePartsProfileProvider>
            </MechanicProfileProvider>
          </JobsProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
