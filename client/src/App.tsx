import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { lazyWithPreload } from "@/lib/lazy-preload";

import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

const About = lazy(() => import("@/pages/about"));
const Resources = lazy(() => import("@/pages/resources"));
const AuthPage = lazy(() => import("@/pages/auth"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const Contact = lazy(() => import("@/pages/contact"));
const Forum = lazy(() => import("@/pages/forum"));
const ForumCategory = lazy(() => import("@/pages/forum-category"));
const ForumPost = lazy(() => import("@/pages/forum-post"));
const ForumMyPosts = lazy(() => import("@/pages/forum-my-posts"));

export const Dashboard = lazyWithPreload(() => import("@/pages/dashboard"));
export const IncidentView = lazyWithPreload(() => import("@/pages/incident-view"));
export const Profile = lazyWithPreload(() => import("@/pages/profile"));
export const AdminPanel = lazyWithPreload(() => import("@/pages/admin"));

function PageLoader() {
  return (
    <div className="flex flex-col gap-4 p-4 min-h-[50vh]">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="flex gap-4 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full sm:w-72 bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex justify-between items-start mb-1">
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-5 w-14 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-3 w-full bg-slate-200 rounded animate-pulse mb-1" />
            <div className="h-3 w-2/3 bg-slate-200 rounded animate-pulse mb-1" />
            <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Public Routes */}
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/resources" component={Resources} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/contact" component={Contact} />
          <Route path="/forum" component={Forum} />
          <Route path="/forum/category/:id" component={ForumCategory} />
          <Route path="/forum/post/:id" component={ForumPost} />
          <Route path="/forum/my-posts" component={ForumMyPosts} />
          
          {/* Protected App Routes */}
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/dashboard/incident/:id" component={IncidentView} />
          <ProtectedRoute path="/profile" component={Profile} />
          <ProtectedRoute path="/admin" component={AdminPanel} />
          
          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
