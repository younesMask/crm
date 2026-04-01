import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ContractsPage from './pages/ContractsPage'
import ContractFormPage from './pages/ContractFormPage'
import ContractDetailPage from './pages/ContractDetailPage'
import UsersPage from './pages/UsersPage'
import ActivityPage from './pages/ActivityPage'
import ClientsPage from './pages/ClientsPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/contracts" element={<ContractsPage />} />
                      <Route path="/contracts/new" element={<ContractFormPage />} />
                      <Route path="/contracts/:id" element={<ContractDetailPage />} />
                      <Route path="/contracts/:id/edit" element={<ContractFormPage />} />
                      <Route path="/users" element={<UsersPage />} />
                      <Route path="/activity" element={<ActivityPage />} />
                      <Route path="/clients" element={<ClientsPage />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
