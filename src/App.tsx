import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import CreateAccount from "./components/CreateAccount";
import AccountDetail from "./components/AccountDetail";
import Profile from "./components/Profile";
import EditAccount from "./pages/EditAccount";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { accountService } from "./services/accountService";

const queryClient = new QueryClient();

/**
 * Handles invitation acceptance after the user logs in via Google OAuth.
 * If ?invitation_token= is present in the URL the user is redirected to the
 * account page after the invitation is accepted.
 */
function InvitationHandler() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;

    const params = new URLSearchParams(window.location.search);
    const invitationToken = params.get('invitation_token');
    if (!invitationToken) return;

    // Remove from URL immediately
    params.delete('invitation_token');
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    window.history.replaceState({}, '', newUrl);

    // Accept the invitation and navigate to the account
    accountService.acceptInvitation(invitationToken)
      .then((result) => {
        if (result?.account_id) {
          navigate(`/account/${result.account_id}`);
        } else {
          navigate('/dashboard');
        }
      })
      .catch((err) => {
        console.error('Error accepting invitation:', err);
        navigate('/dashboard');
      });
  }, [user, loading, navigate]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <InvitationHandler />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/create" element={<Layout />}>
            <Route index element={<CreateAccount />} />
          </Route>
          <Route path="/account/:id" element={<Layout />}>
            <Route index element={<AccountDetail />} />
          </Route>
          <Route path="/account/:id/edit" element={<Layout />}>
            <Route index element={<EditAccount />} />
          </Route>
          <Route path="/profile" element={<Layout />}>
            <Route index element={<Profile />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
