import { StatusBar } from 'react-native';
import { AuthProvider, ThemeProvider } from './context';
import { RootNavigator } from './navigation';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000033" />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
