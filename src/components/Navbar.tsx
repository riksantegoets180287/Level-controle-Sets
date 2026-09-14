import { FC } from "react";
import { ArrowLeft, Shield, LogOut, BookOpen } from "lucide-react";
import { AdminUser } from "../types";

interface NavbarProps {
  currentView: "home" | "game" | "admin-login" | "admin-dashboard";
  onNavigateHome: () => void;
  onNavigateAdmin: () => void;
  onLogout: () => void;
  adminUser: AdminUser | null;
}

export const Navbar: FC<NavbarProps> = ({
  currentView,
  onNavigateHome,
  onNavigateAdmin,
  onLogout,
  adminUser,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/90 shadow-xs">
      {/* Summa brand accent line */}
      <div className="h-1.5 w-full flex">
        <div className="w-1/3 bg-[#002B49]"></div>
        <div className="w-1/4 bg-[#0066B3]"></div>
        <div className="w-1/6 bg-[#00A3E0]"></div>
        <div className="w-1/4 bg-[#E4007C]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          {currentView !== "home" && (
            <button
              id="nav-back-button"
              onClick={onNavigateHome}
              className="mr-1 p-2 rounded-xl text-slate-600 hover:text-[#002B49] hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm font-semibold"
              title="Terug naar overzicht"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Overzicht</span>
            </button>
          )}

          <button
            id="nav-brand-button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            {/* Custom stylized Summa badge */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#002B49] via-[#003865] to-[#0066B3] flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-900/20 group-hover:scale-105 transition-transform">
              <span className="tracking-tighter">S</span>
              <span className="text-[#E4007C] text-xs leading-none -ml-0.5">•</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-[#002B49] tracking-tight">
                  Summa College
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-50 text-[#0066B3] border border-blue-200">
                  MBO
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">
                Educatief Koppelspel
              </p>
            </div>
          </button>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin auth navigation */}
          {adminUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="nav-admin-dashboard-button"
                onClick={onNavigateAdmin}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  currentView === "admin-dashboard"
                    ? "bg-[#E4007C] text-white shadow-sm"
                    : "bg-pink-50 text-[#E4007C] hover:bg-pink-100 border border-pink-200"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden md:inline">Beheer Dashboard</span>
                <span className="md:hidden">Beheer</span>
              </button>

              <button
                id="nav-logout-button"
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                title="Uitloggen"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="nav-login-button"
              onClick={onNavigateAdmin}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === "admin-login"
                  ? "bg-[#002B49] text-white"
                  : "bg-white text-[#002B49] hover:bg-slate-50 border border-slate-200 shadow-xs"
              }`}
            >
              <Shield className="w-4 h-4 text-[#0066B3]" />
              <span>Beheerder</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
