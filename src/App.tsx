import { useEffect, useState, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { HomeView } from "./components/HomeView";
import { GameView } from "./components/GameView";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./components/AdminDashboard";
import { CardSet, AdminUser } from "./types";
import {
  fetchCardSets,
  fetchCardSetBySlug,
  checkAdminSession,
  adminLogout,
} from "./lib/api";
import { CircleAlert as AlertCircle, ArrowLeft } from "lucide-react";
import { withBasePath, stripBasePath } from "./lib/basePath";

export default function App() {
  const [currentView, setCurrentView] = useState<
    "home" | "game" | "admin-login" | "admin-dashboard"
  >("home");
  const [cardSets, setCardSets] = useState<CardSet[]>([]);
  const [activeSet, setActiveSet] = useState<CardSet | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load active card sets
  const loadSets = useCallback(async () => {
    try {
      setIsLoadingSets(true);
      const sets = await fetchCardSets();
      setCardSets(sets);
    } catch (err: any) {
      console.error("Error loading card sets:", err);
    } finally {
      setIsLoadingSets(false);
    }
  }, []);

  // Check auth session
  useEffect(() => {
    const initAuth = async () => {
      const user = await checkAdminSession();
      if (user) {
        setAdminUser(user);
      }
    };
    initAuth();
    loadSets();
  }, [loadSets]);

  // Load single set by slug or ID and open game view
  const loadAndOpenSet = useCallback(
    async (slugOrId: string, pushHistory = true) => {
      setErrorMessage(null);
      setIsLoadingGame(true);

      try {
        const set = await fetchCardSetBySlug(slugOrId);
        setActiveSet(set);
        setCurrentView("game");

        if (pushHistory) {
          const targetPath = withBasePath(`/set/${set.slug}`);
          if (window.location.pathname !== targetPath) {
            window.history.pushState({ view: "game", slug: set.slug }, "", targetPath);
          }
        }
      } catch (err: any) {
        setErrorMessage(
          err.message ||
            "Deze kaartenset kon niet worden geladen. Mogelijk bestaat de set niet meer of is deze gedeactiveerd."
        );
        setCurrentView("home");
      } finally {
        setIsLoadingGame(false);
      }
    },
    []
  );

  // URL routing on initial mount and browser back/forward
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = stripBasePath(window.location.pathname);
      const searchParams = new URLSearchParams(window.location.search);
      const querySet = searchParams.get("set");

      if (path.startsWith("/set/") || querySet) {
        const slug = querySet || path.replace("/set/", "").split("/")[0];
        if (slug) {
          loadAndOpenSet(slug, false);
          return;
        }
      }

      if (path === "/admin") {
        if (adminUser) {
          setCurrentView("admin-dashboard");
        } else {
          setCurrentView("admin-login");
        }
        return;
      }

      // Default home
      setCurrentView("home");
      setActiveSet(null);
    };

    handleUrlRoute();

    window.addEventListener("popstate", handleUrlRoute);
    return () => window.removeEventListener("popstate", handleUrlRoute);
  }, [adminUser, loadAndOpenSet]);

  // Navigation handlers
  const handleNavigateHome = () => {
    setErrorMessage(null);
    setActiveSet(null);
    setCurrentView("home");
    if (window.location.pathname !== withBasePath("/")) {
      window.history.pushState({ view: "home" }, "", withBasePath("/"));
    }
  };

  const handleNavigateAdmin = () => {
    setErrorMessage(null);
    if (adminUser) {
      setCurrentView("admin-dashboard");
    } else {
      setCurrentView("admin-login");
    }
    if (window.location.pathname !== withBasePath("/admin")) {
      window.history.pushState({ view: "admin" }, "", withBasePath("/admin"));
    }
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setCurrentView("admin-dashboard");
    loadSets(); // Refresh to include inactive sets if any
  };

  const handleLogout = async () => {
    await adminLogout();
    setAdminUser(null);
    handleNavigateHome();
    loadSets();
  };

  return (
    <div
      className={`bg-[#F4F7FB] text-slate-800 selection:bg-blue-100 selection:text-blue-900 ${
        currentView === "game"
          ? "h-screen max-h-screen overflow-hidden flex flex-col"
          : "min-h-screen flex flex-col"
      }`}
    >
      {/* Top Navigation - shown on home and admin */}
      {currentView !== "game" && (
        <Navbar
          currentView={currentView}
          onNavigateHome={handleNavigateHome}
          onNavigateAdmin={handleNavigateAdmin}
          onLogout={handleLogout}
          adminUser={adminUser}
        />
      )}

      {/* Main Container */}
      <main className={`flex-1 ${currentView === "game" ? "h-full overflow-hidden flex flex-col" : ""}`}>
        {/* Global Error Banner */}
        {errorMessage && (
          <div className="max-w-4xl mx-auto mt-6 px-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Kaartenset niet gevonden</h4>
                  <p className="text-xs sm:text-sm mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 font-semibold text-xs hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
              >
                Sluiten
              </button>
            </div>
          </div>
        )}

        {/* Global Loading Spinner for game */}
        {isLoadingGame && (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#0066B3] animate-spin mb-4"></div>
            <p className="text-slate-600 font-bold">Kaartenset laden...</p>
          </div>
        )}

        {/* Views */}
        {!isLoadingGame && (
          <>
            {currentView === "home" && (
              <HomeView
                cardSets={cardSets}
                isLoading={isLoadingSets}
                onSelectSet={(slug) => loadAndOpenSet(slug, true)}
              />
            )}

            {currentView === "game" && activeSet && (
              <GameView
                cardSet={activeSet}
                onBackToHome={handleNavigateHome}
              />
            )}

            {currentView === "admin-login" && (
              <AdminLogin
                onLoginSuccess={handleLoginSuccess}
                onBackToHome={handleNavigateHome}
              />
            )}

            {currentView === "admin-dashboard" && adminUser && (
              <AdminDashboard
                adminUser={adminUser}
                cardSets={cardSets}
                onRefreshSets={loadSets}
                onPlaySet={(slug) => loadAndOpenSet(slug, true)}
                onLogout={handleLogout}
                onBackToHome={handleNavigateHome}
              />
            )}
          </>
        )}
      </main>

      {/* Footer (hidden in game view for strict no scroll requirement) */}
      {currentView !== "game" && (
        <footer className="mt-auto border-t border-slate-200 bg-white/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#002B49]">Summa College</span>
              <span className="text-slate-300">•</span>
              <span>Koppelspel voor MBO Studenten</span>
            </div>

            <div className="flex items-center gap-4 font-semibold text-slate-600">
              <button
                onClick={handleNavigateHome}
                className="hover:text-[#0066B3] transition-colors cursor-pointer"
              >
                Startpagina
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={handleNavigateAdmin}
                className="hover:text-[#0066B3] transition-colors cursor-pointer"
              >
                {adminUser ? "Beheer Dashboard" : "Docent Inloggen"}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
