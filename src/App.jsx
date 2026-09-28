import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import AppRouter from './routes/AppRouter.jsx';

const router = createBrowserRouter([{ path: '*', element: (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  ) }]);

const App = () => <RouterProvider router={router} />;

export default App;
