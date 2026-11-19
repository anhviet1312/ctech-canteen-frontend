import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../layouts/MainLayout'
import LoginPage from '../pages/Login'
import DashboardPage from '../pages/Dashboard'
import CategoriesPage from '../pages/Categories'
import SuppliersPage from '../pages/Suppliers'
import ProductsPage from '../pages/Products'
import ImportsPage from '../pages/Imports'
import CreateImportPage from '../pages/Imports/CreateImport'
import ExportsPage from '../pages/Exports'
import CreateExportPage from '../pages/Exports/CreateExport'
import InventoryPage from '../pages/Inventory'
import ProposalsPage from '../pages/Proposals'
import CreateProposalPage from '../pages/Proposals/CreateProposal'
import ProposalDetailPage from '../pages/Proposals/ProposalDetail'
import ReportsPage from '../pages/Reports'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="imports" element={<ImportsPage />} />
        <Route path="imports/create" element={<CreateImportPage />} />
        <Route path="exports" element={<ExportsPage />} />
        <Route path="exports/create" element={<CreateExportPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="proposals" element={<ProposalsPage />} />
        <Route path="proposals/create" element={<CreateProposalPage />} />
        <Route path="proposals/:id" element={<ProposalDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  )
}
