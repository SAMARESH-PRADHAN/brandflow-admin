import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

import AdminLayout from "./routes/_admin";
import DashboardPage from "./routes/_admin.index";
import AnalyticsPage from "./routes/_admin.analytics";
import ProductsPage from "./routes/_admin.products";
import B2BPage from "./routes/_admin.products.b2b";
import NewColl from "./routes/_admin.products.new-collection";
import KitsPage from "./routes/_admin.products.welcome-kits";
import OrdersPage from "./routes/_admin.orders";
import SamplesPage from "./routes/_admin.orders.samples";
import KanbanPage from "./routes/_admin.orders.status";
import OrderDetail from "./routes/_admin.orders.$id";
import CustomersPage from "./routes/_admin.customers";
import AgentsPage from "./routes/_admin.agents";
import PaymentsPage from "./routes/_admin.payments";
import ReviewsPage from "./routes/_admin.reviews";
import SettingsPage from "./routes/_admin.settings";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/b2b" element={<B2BPage />} />
            <Route path="products/new-collection" element={<NewColl />} />
            <Route path="products/welcome-kits" element={<KitsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/samples" element={<SamplesPage />} />
            <Route path="orders/status" element={<KanbanPage />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
