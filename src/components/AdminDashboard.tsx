import { FC, useState } from "react";
import { Plus, Copy, Check, CreditCard as Edit, CopyPlus, Trash2, Play, KeyRound, LogOut, Layers, Power, Shield, ArrowUpRight } from "lucide-react";
import { CardSet, AdminUser } from "../types";
import {
  duplicateCardSet,
  deleteCardSet,
  toggleSetStatus,
  fetchCardSetBySlug,
} from "../lib/api";
import { SetEditorModal } from "./SetEditorModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { getFullShareUrl, withBasePath } from "../lib/basePath";

interface AdminDashboardProps {
  adminUser: AdminUser;
  cardSets: CardSet[];
  onRefreshSets: () => void;
  onPlaySet: (slugOrId: string) => void;
  onLogout: () => void;
  onBackToHome?: () => void;
}

export const AdminDashboard: FC<AdminDashboardProps> = ({
  adminUser,
  cardSets,
  onRefreshSets,
  onPlaySet,
  onLogout,
  onBackToHome,
}) => {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<CardSet | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleCopyUrl = (slug: string) => {
    const url = getFullShareUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => {
      setCopiedSlug(null);
    }, 2500);
  };

  const handleCreateNew = () => {
    setEditingSet(null);
    setEditorOpen(true);
  };

  const handleEditSet = async (set: CardSet) => {
    try {
      setActionLoading(`edit-${set.id}`);
      // Fetch complete set with all pairs
      const fullSet = await fetchCardSetBySlug(set.slug);
      setEditingSet(fullSet);
      setEditorOpen(true);
    } catch (err) {
      console.error("Error loading set details:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (setId: string) => {
    try {
      setActionLoading(`duplicate-${setId}`);
      await duplicateCardSet(setId);
      onRefreshSets();
    } catch (err: any) {
      alert(err.message || "Kon set niet dupliceren.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (setId: string) => {
    try {
      setActionLoading(`toggle-${setId}`);
      await toggleSetStatus(setId);
      onRefreshSets();
    } catch (err: any) {
      alert(err.message || "Kon status niet wijzigen.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (setId: string) => {
    try {
      setActionLoading(`delete-${setId}`);
      await deleteCardSet(setId);
      setDeleteConfirmId(null);
      onRefreshSets();
    } catch (err: any) {
      alert(err.message || "Kon set niet verwijderen.");
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = (cardSets || []).filter((s) => s?.isActive).length;
  const totalPairsCount = (cardSets || []).reduce((acc, s) => acc + (s?.pairCount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Top Welcome Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-50 text-[#E4007C] border border-pink-200">
                Docentendashboard
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {adminUser.email}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#002B49]">
              Beheer Kaartensets
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Beheer, maak en deel interactieve koppelspellen voor je lessen.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {onBackToHome && (
              <button
                id="admin-back-to-games-btn"
                onClick={onBackToHome}
                className="py-3 px-3.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-[#002B49] text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Naar spellenoverzicht voor studenten"
              >
                <Play className="w-4 h-4 fill-[#002B49]" />
                <span>Spellenoverzicht</span>
              </button>
            )}

            <button
              id="admin-create-new-set-btn"
              onClick={handleCreateNew}
              className="py-3 px-4 rounded-xl font-bold bg-[#0066B3] hover:bg-[#00508f] text-white shadow-md shadow-blue-900/15 flex items-center gap-2 text-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nieuwe kaartenset</span>
            </button>

            <button
              id="admin-change-password-btn"
              onClick={() => setPasswordModalOpen(true)}
              className="py-3 px-3.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Wachtwoord wijzigen"
            >
              <KeyRound className="w-4 h-4" />
              <span className="hidden sm:inline">Wachtwoord wijzigen</span>
            </button>

            <button
              id="admin-logout-btn"
              onClick={onLogout}
              className="py-3 px-3.5 rounded-xl font-bold bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Afmelden"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Afmelden</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-6 pt-6 border-t border-slate-100 text-center">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-0.5">Totaal Sets</p>
            <p className="text-2xl font-black text-[#002B49]">{cardSets.length}</p>
          </div>
          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700 mb-0.5">Actief voor studenten</p>
            <p className="text-2xl font-black text-emerald-700">{activeCount}</p>
          </div>
          <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
            <p className="text-xs font-semibold text-[#0066B3] mb-0.5">Totaal Kaartparen</p>
            <p className="text-2xl font-black text-[#0066B3]">{totalPairsCount}</p>
          </div>
        </div>
      </div>

      {/* Sets List Table / Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-[#002B49] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0066B3]" />
            <span>Overzicht Kaartensets</span>
          </h2>
          <span className="text-xs text-slate-500">
            Klik op een set om aan te passen of kopieer de directe link voor je studenten
          </span>
        </div>

        {cardSets.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
            <p className="text-slate-600 mb-4 font-semibold">
              Je hebt nog geen kaartensets aangemaakt.
            </p>
            <button
              onClick={handleCreateNew}
              className="py-3 px-5 rounded-xl font-bold bg-[#0066B3] text-white text-sm"
            >
              Maak je eerste kaartenset aan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cardSets.map((set) => {
              const isCopied = copiedSlug === set.slug;
              const shareUrl = getFullShareUrl(set.slug);
              const isLoadingThis = actionLoading?.includes(set.id);

              return (
                <div
                  key={set.id}
                  id={`admin-set-row-${set.slug}`}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      {/* Active / Inactive Badge */}
                      <button
                        onClick={() => handleToggleActive(set.id)}
                        disabled={isLoadingThis}
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${
                          set.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                        title="Klik om te activeren of deactiveren"
                      >
                        <Power className="w-3 h-3" />
                        <span>{set.isActive ? "Actief" : "Inactief (verborgen)"}</span>
                      </button>

                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-[#0066B3]">
                        {set.pairCount || 0} paren
                      </span>

                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {withBasePath("/set/")}{set.slug}
                      </span>
                    </div>

                    <h3 className="font-bold text-[#002B49] text-base sm:text-lg truncate">
                      {set.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5">
                      {set.description || "Geen beschrijving."}
                    </p>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center flex-wrap gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Copy Share URL */}
                    <button
                      id={`btn-admin-copy-${set.slug}`}
                      onClick={() => handleCopyUrl(set.slug)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCopied
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                      title={`Kopieer student URL: ${shareUrl}`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Gekopieerd!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Kopieer link</span>
                        </>
                      )}
                    </button>

                    {/* Test / Play */}
                    <button
                      id={`btn-admin-play-${set.slug}`}
                      onClick={() => onPlaySet(set.slug)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-[#0066B3] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Test deze set direct als student"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#0066B3]" />
                      <span>Testen</span>
                    </button>

                    {/* Edit */}
                    <button
                      id={`btn-admin-edit-${set.slug}`}
                      onClick={() => handleEditSet(set)}
                      disabled={isLoadingThis}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Bewerken"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Bewerken</span>
                    </button>

                    {/* Duplicate */}
                    <button
                      id={`btn-admin-duplicate-${set.slug}`}
                      onClick={() => handleDuplicate(set.id)}
                      disabled={isLoadingThis}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#002B49] hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Kaartenset dupliceren"
                    >
                      <CopyPlus className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      id={`btn-admin-delete-${set.slug}`}
                      onClick={() => setDeleteConfirmId(set.id)}
                      disabled={isLoadingThis}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-lg font-bold text-[#002B49] mb-2 text-center">
              Kaartenset verwijderen?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-5">
              Weet je zeker dat je deze kaartenset en alle bijbehorende kaartparen wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="py-2.5 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm cursor-pointer"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="py-2.5 px-4 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white text-sm cursor-pointer"
              >
                Ja, verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Editor Modal (Create / Edit) */}
      <SetEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={onRefreshSets}
        editingSet={editingSet}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        adminEmail={adminUser.email}
      />
    </div>
  );
};
