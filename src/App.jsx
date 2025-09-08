import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { CreateProductPage } from './pages/CreateProductPage'
import ErrorBoundary from './components/ErrorBoundary'
import { Toaster } from './components/ui/sonner'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-product" element={<CreateProductPage />} />
          {/* Add more routes here as needed */}
        </Routes>
      <Toaster />
      </Router>
    </ErrorBoundary>
  )
}

export default App
