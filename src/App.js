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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <JobsProvider>
            <MechanicProfileProvider>
              <MechanicServicesProvider>
                <StatusBar barStyle="light-content" backgroundColor="#000033" />
                <RootNavigator />
              </MechanicServicesProvider>
            </MechanicProfileProvider>
          </JobsProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
