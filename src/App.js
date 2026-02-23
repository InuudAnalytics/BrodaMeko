import { StatusBar } from 'react-native';
import {
  AuthProvider,
  ChatProvider,
  JobsProvider,
  MechanicProfileProvider,
  MechanicServicesProvider,
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
              <MechanicServicesProvider>
                <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />
                <RootNavigator />
              </MechanicServicesProvider>
            </MechanicProfileProvider>
          </JobsProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
