import { FC, useState, FormEvent } from "react";
import { Shield, KeyRound, Mail, ArrowLeft, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { adminLogin, quickAdminLogin } from "../lib/api";
import { AdminUser } from "../types";

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToHome: () => void;
}

export const AdminLogin: FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToHome,
}) => {
  const [email, setEmail] = useState("digitalevaardigheden@summacollege.nl");
  const [password, setPassword] = useState("Summa2025!");
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickLoading, setIsQuickLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickLogin = async () => {
    setErrorMessage(null);
    setIsQuickLoading(true);
    try {
      const data = await quickAdminLogin();
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || "Er is een fout opgetreden bij het inloggen.");
    } finally {
      setIsQuickLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const data = await adminLogin(email, password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || "Er is een fout opgetreden bij het inloggen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl">
        <button
          onClick={onBackToHome}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#002B49] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug naar spellenoverzicht</span>
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#002B49] to-[#0066B3] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-900/20">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-[#002B49]">Beheerdersomgeving</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Toegang voor docenten en contentbeheerders van Summa College
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1-Click Fast Access Button */}
        <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-[#0066B3]/20 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-[#002B49] mb-3">
            Snel toegang voor docenten:
          </p>
          <button
            id="quick-admin-login-btn"
            type="button"
            disabled={isQuickLoading || isLoading}
            onClick={handleQuickLogin}
            className="w-full py-3.5 px-4 rounded-xl font-extrabold bg-[#0066B3] hover:bg-[#00508f] text-white shadow-md shadow-blue-900/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isQuickLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#00A3E0]" />
                <span>Direct inloggen als beheerder</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Of handmatig inloggen
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              E-mailadres
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@summacollege.nl"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066B3] focus:border-transparent text-sm bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Wachtwoord
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="admin-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066B3] focus:border-transparent text-sm bg-slate-50/50"
              />
            </div>
          </div>

          <button
            id="admin-submit-login-btn"
            type="submit"
            disabled={isLoading || isQuickLoading}
            className="w-full py-3 px-4 rounded-xl font-bold bg-[#002B49] hover:bg-[#001f35] text-white shadow-sm transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>Inloggen met account</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
