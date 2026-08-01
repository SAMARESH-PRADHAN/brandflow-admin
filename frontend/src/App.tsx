import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

import { Suspense, lazy } from "react";

import AdminLayout from "./routes/_admin";
const DashboardPage = lazy(() => import("./routes/_admin.index"));
const AnalyticsPage = lazy(() => import("./routes/_admin.analytics"));
const ProductsPage = lazy(() => import("./routes/_admin.products"));
const B2BPage = lazy(() => import("./routes/_admin.products.b2b"));
const NewColl = lazy(() => import("./routes/_admin.products.new-collection"));
const KitsPage = lazy(() => import("./routes/_admin.products.welcome-kits"));
const OrdersPage = lazy(() => import("./routes/_admin.orders"));
const SamplesPage = lazy(() => import("./routes/_admin.orders.samples"));
const KanbanPage = lazy(() => import("./routes/_admin.orders.status"));
const OrderDetail = lazy(() => import("./routes/_admin.orders.$id"));
const CustomersPage = lazy(() => import("./routes/_admin.customers"));
const AgentsPage = lazy(() => import("./routes/_admin.agents"));
const AgentVisitsPage = lazy(() => import("./routes/_admin.agent-visits"));
const PaymentsPage = lazy(() => import("./routes/_admin.payments"));
const ReviewsPage = lazy(() => import("./routes/_admin.reviews"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

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
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
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
            <Route path="agent-visits" element={<AgentVisitsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            
          </Route>
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
