import { StatusBar } from 'react-native';
import { AuthProvider, ChatProvider, JobsProvider, MechanicServicesProvider, ThemeProvider } from './context';
import { RootNavigator } from './navigation';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <JobsProvider>
            <MechanicServicesProvider>
              <StatusBar barStyle="light-content" backgroundColor="#000033" />
              <RootNavigator />
            </MechanicServicesProvider>
          </JobsProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
