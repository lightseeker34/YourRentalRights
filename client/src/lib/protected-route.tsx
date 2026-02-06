import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";
import { useEffect, useRef } from "react";

function AuthSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-slate-50">
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

type PreloadableComponent = React.ComponentType<any> & {
  preload?: () => Promise<any>;
};

export function ProtectedRoute({ component: Component, path }: { component: PreloadableComponent; path: string }) {
  const { user, isLoading } = useAuth();
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (!preloadedRef.current && Component.preload) {
      preloadedRef.current = true;
      Component.preload();
    }
  }, [Component]);

  if (isLoading) {
    return (
      <Route path={path}>
        <AuthSkeleton />
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
