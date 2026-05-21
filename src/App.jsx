import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import AppRouter from './routes/AppRouter.jsx';

const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
