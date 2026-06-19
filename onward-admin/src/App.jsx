import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout.jsx';
import AppRoutes from './routes/index.jsx';
import Login from './pages/Login.jsx';

export default function App() {
  const { authed } = useAuth();
  if (!authed) return <Login />;

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/*" element={<AppRoutes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
