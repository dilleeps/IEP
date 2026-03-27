import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { LanguageProvider } from "@/app/providers/LanguageProvider";
import { NotificationProvider } from "@/hooks/useNotification";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { AppRoutes } from "@/app/routing/AppRoutes";
import { NotificationContainer } from "@/components/NotificationContainer";
import { SupportChatbot } from "@/app/components/SupportChatbot";
import "./index.css";

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
      <NotificationProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
              <SupportChatbot />
              <NotificationContainer />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
