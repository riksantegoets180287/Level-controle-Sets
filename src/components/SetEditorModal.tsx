import { FC, useState, useEffect, FormEvent } from "react";
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  AlertCircle,
  Save,
  Layers,
} from "lucide-react";
import { CardSet } from "../types";
import { createCardSet, updateCardSet } from "../lib/api";

interface SetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingSet?: CardSet | null;
}

interface FormPair {
  id?: string;
  cardAText: string;
  cardBText: string;
  cardAImageUrl?: string;
  cardBImageUrl?: string;
  sortOrder: number;
}

export const SetEditorModal: FC<SetEditorModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingSet,
}) => {
  const isEditing = !!editingSet;

  const [title, setTitle] = useState(editingSet?.title || "");
  const [description, setDescription] = useState(editingSet?.description || "");
  const [instructions, setInstructions] = useState(
    editingSet?.instructions || "Koppel de kaartjes die bij elkaar horen."
  );
  const [slug, setSlug] = useState(editingSet?.slug || "");
  const [isActive, setIsActive] = useState(
    editingSet ? editingSet.isActive : true
  );

  const [pairs, setPairs] = useState<FormPair[]>(
    editingSet?.pairs && editingSet.pairs.length > 0
      ? editingSet.pairs.map((p, idx) => ({
          id: p.id,
          cardAText: p.cardAText,
          cardBText: p.cardBText,
          cardAImageUrl: p.cardAImageUrl,
          cardBImageUrl: p.cardBImageUrl,
          sortOrder: p.sortOrder || idx + 1,
        }))
      : [
          {
            cardAText: "",
            cardBText: "",
            sortOrder: 1,
          },
          {
            cardAText: "",
            cardBText: "",
            sortOrder: 2,
          },
        ]
  );

  const [showImageFieldIdx, setShowImageFieldIdx] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever modal is opened or editingSet changes
  useEffect(() => {
    if (!isOpen) return;

    setTitle(editingSet?.title || "");
    setDescription(editingSet?.description || "");
    setInstructions(
      editingSet?.instructions || "Koppel de kaartjes die bij elkaar horen."
    );
    setSlug(editingSet?.slug || "");
    setIsActive(editingSet ? editingSet.isActive : true);
    setErrorMessage(null);
    setShowImageFieldIdx(null);

    if (editingSet?.pairs && editingSet.pairs.length > 0) {
      setPairs(
        editingSet.pairs.map((p, idx) => ({
          id: p.id,
          cardAText: p.cardAText,
          cardBText: p.cardBText,
          cardAImageUrl: p.cardAImageUrl,
          cardBImageUrl: p.cardBImageUrl,
          sortOrder: p.sortOrder || idx + 1,
        }))
      );
    } else {
      setPairs([
        {
          cardAText: "",
          cardBText: "",
          sortOrder: 1,
        },
        {
          cardAText: "",
          cardBText: "",
          sortOrder: 2,
        },
      ]);
    }
  }, [isOpen, editingSet]);

  if (!isOpen) return null;

  // Add new pair
  const handleAddPair = () => {
    setPairs((prev) => [
      ...prev,
      {
        cardAText: "",
        cardBText: "",
        sortOrder: prev.length + 1,
      },
    ]);
  };

  // Remove pair
  const handleRemovePair = (index: number) => {
    if (pairs.length <= 2) {
      setErrorMessage("Een kaartenset moet minimaal 2 kaartparen bevatten.");
      return;
    }
    setPairs((prev) => prev.filter((_, i) => i !== index));
  };

  // Move up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setPairs((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy.map((p, i) => ({ ...p, sortOrder: i + 1 }));
    });
  };

  // Move down
  const handleMoveDown = (index: number) => {
    if (index === pairs.length - 1) return;
    setPairs((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy.map((p, i) => ({ ...p, sortOrder: i + 1 }));
    });
  };

  // Update pair field
  const handlePairChange = (index: number, field: keyof FormPair, value: string) => {
    setPairs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: Title
    if (!title.trim()) {
      setErrorMessage("Vul een titel in voor de kaartenset.");
      return;
    }

    // Validation 2: Min 2 pairs
    if (pairs.length < 2) {
      setErrorMessage("Een kaartenset moet minimaal 2 kaartparen bevatten.");
      return;
    }

    // Validation 3: All cards filled
    for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      if (!p.cardAText.trim() || !p.cardBText.trim()) {
        setErrorMessage(
          `Kaartpaar ${i + 1} is niet compleet. Zowel Kaart A als Kaart B moeten ingevuld zijn.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        slug: slug.trim() || undefined,
        isActive,
        pairs: pairs.map((p, idx) => ({
          ...p,
          sortOrder: idx + 1,
        })),
      };

      if (isEditing && editingSet) {
        await updateCardSet(editingSet.id, payload);
      } else {
        await createCardSet(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Er ging iets mis bij het opslaan van de set.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#002B49] to-[#00508f] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#00A3E0]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                {isEditing ? "Kaartenset bewerken" : "Nieuwe kaartenset aanmaken"}
              </h2>
              <p className="text-xs text-blue-200">
                Stel de vragen en combinaties samen voor studenten
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* General Set Metadata */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-[#002B49] text-sm uppercase tracking-wider">
              Algemene informatie
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Titel van de kaartenset *
                </label>
                <input
                  id="set-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="bijv. Digitale Veiligheid & Privacy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0066B3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deelbare URL slug (optioneel)
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-slate-500 bg-slate-200 px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-200 font-mono">
                    /set/
                  </span>
                  <input
                    id="set-slug-input"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="veiligheid-online"
                    className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0066B3]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Korte omschrijving voor studenten
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Leg in 1 of 2 zinnen uit waar deze oefening over gaat..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0066B3]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Instructie tijdens het spel
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Zoek een groen en een blauw kaartje dat bij elkaar hoort."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0066B3]"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 sm:pt-0">
                <input
                  type="checkbox"
                  id="set-is-active-checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded text-[#0066B3] focus:ring-[#0066B3] border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor="set-is-active-checkbox"
                  className="text-xs sm:text-sm font-bold text-slate-700 cursor-pointer select-none"
                >
                  Actief (direct zichtbaar voor studenten op de startpagina)
                </label>
              </div>
            </div>
          </div>

          {/* Card Pairs Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-[#002B49] text-base">
                  Kaartparen ({pairs.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Koppel steeds een <strong>Groen kaartje (Kaart A)</strong> aan een <strong>Blauw kaartje (Kaart B)</strong>. Minimaal 2 paren vereist.
                </p>
              </div>

              <button
                type="button"
                id="btn-add-pair"
                onClick={handleAddPair}
                className="px-3 py-2 rounded-xl font-bold bg-blue-50 text-[#0066B3] hover:bg-blue-100 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Kaartpaar toevoegen</span>
              </button>
            </div>

            <div className="space-y-3">
              {pairs.map((pair, index) => {
                const isImageOpen = showImageFieldIdx === index;

                return (
                  <div
                    key={pair.id || index}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#002B49] bg-slate-100 px-2.5 py-1 rounded-lg">
                          Paar {index + 1}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Groen
                          </span>
                          <span className="text-slate-400">↔</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                            Blauw
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Omhoog verplaatsen"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === pairs.length - 1}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Omlaag verplaatsen"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowImageFieldIdx(isImageOpen ? null : index)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${
                            isImageOpen || pair.cardAImageUrl || pair.cardBImageUrl
                              ? "text-[#00A3E0] bg-cyan-50"
                              : "text-slate-400 hover:text-slate-700"
                          }`}
                          title="Afbeeldings-URL toevoegen"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePair(index)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Verwijder dit paar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <span>Kaart A (Groen kaartje) *</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={pair.cardAText}
                          onChange={(e) =>
                            handlePairChange(index, "cardAText", e.target.value)
                          }
                          placeholder="bijv. Is het programma waar je (huis)werk kunt vinden en inleveren"
                          className="w-full p-2.5 rounded-xl border-2 border-emerald-200 bg-emerald-50/20 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <span>Kaart B (Blauw kaartje) *</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={pair.cardBText}
                          onChange={(e) =>
                            handlePairChange(index, "cardBText", e.target.value)
                          }
                          placeholder="bijv. Canvas"
                          className="w-full p-2.5 rounded-xl border-2 border-blue-200 bg-blue-50/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Optional Image URLs Accordion */}
                    {isImageOpen && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Afbeelding URL Kaart A (optioneel)
                          </label>
                          <input
                            type="url"
                            value={pair.cardAImageUrl || ""}
                            onChange={(e) =>
                              handlePairChange(index, "cardAImageUrl", e.target.value)
                            }
                            placeholder="https://voorbeeld.nl/afbeelding.jpg"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Afbeelding URL Kaart B (optioneel)
                          </label>
                          <input
                            type="url"
                            value={pair.cardBImageUrl || ""}
                            onChange={(e) =>
                              handlePairChange(index, "cardBImageUrl", e.target.value)
                            }
                            placeholder="https://voorbeeld.nl/afbeelding.jpg"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm cursor-pointer"
            >
              Annuleren
            </button>
            <button
              id="btn-submit-set"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold bg-[#0066B3] hover:bg-[#00508f] text-white text-sm shadow-md shadow-blue-900/15 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Opslaan..." : "Kaartenset opslaan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
