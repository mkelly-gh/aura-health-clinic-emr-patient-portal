import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { Dashboard } from './pages/provider/Dashboard';
import { PatientChart } from './pages/provider/PatientChart';
import { Portal } from './pages/patient/Portal';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} errorElement={<RouteErrorBoundary />} />
      <Route path="/provider" element={<Dashboard />} errorElement={<RouteErrorBoundary />} />
      <Route path="/provider/patient/:id" element={<PatientChart />} errorElement={<RouteErrorBoundary />} />
      <Route path="/portal" element={<Portal />} errorElement={<RouteErrorBoundary />} />
    </Routes>
  );
}