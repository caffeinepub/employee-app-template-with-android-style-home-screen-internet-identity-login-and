import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet, useNavigate } from '@tanstack/react-router';
import HomeScreen from '../pages/HomeScreen';
import FrieslandFungies from '../pages/modules/FrieslandFungies';
import LandVanOns from '../pages/modules/LandVanOns';
import Pottle from '../pages/modules/Pottle';
import AdminDashboard from '../pages/AdminDashboard';
import AdminGuard from '../components/AdminGuard';
import { useEffect } from 'react';
import { useAccessStatus } from '../hooks/useAccessStatus';

// Root route with layout
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Home route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeScreen,
});

// Module routes
const frieslandRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/friesland-fungies',
  component: FrieslandFungies,
});

const landVanOnsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/land-van-ons',
  component: LandVanOns,
});

const pottleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pottle',
  component: Pottle,
});

// Admin route with guard
function AdminRoute() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminRoute,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  frieslandRoute,
  landVanOnsRoute,
  pottleRoute,
  adminRoute,
]);

// Create router
const router = createRouter({ routeTree });

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
