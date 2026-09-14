import { FC, useState, MouseEvent } from "react";
import { Play, Copy, Check, Sparkles, Layers, ArrowRight, BookOpen } from "lucide-react";
import { CardSet } from "../types";
import { getFullShareUrl, withBasePath } from "../lib/basePath";

interface HomeViewProps {
  cardSets: CardSet[];
  isLoading: boolean;
  onSelectSet: (slugOrId: string) => void;
}

export const HomeView: FC<HomeViewProps> = ({
  cardSets,
  isLoading,
  onSelectSet,
}) => {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCopyUrl = (e: MouseEvent, slug: string) => {
    e.stopPropagation();
    const url = getFullShareUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => {
      setCopiedSlug(null);
    }, 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Intro hero banner */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0066B3] text-xs sm:text-sm font-bold mb-4 shadow-xs">
          <Sparkles className="w-4 h-4 text-[#E4007C]" />
          <span>Summa Digitaal Leren</span>
        </div>
        <h1 className="font-black text-[#002B49] tracking-tight mb-3 text-3xl sm:text-5xl">
          Koppelspel
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed text-base sm:text-lg">
          Koppel de kaartjes die bij elkaar horen.
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Test je kennis van de lessenperiode. Geen inlogaccount vereist voor studenten.
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#0066B3] animate-spin mb-4"></div>
          <p className="text-slate-600 font-semibold">Kaartensets laden...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cardSets.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-[#0066B3] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#002B49] mb-2">
            Geen actieve kaartensets gevonden
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Er staan op dit moment nog geen kaartensets open voor studenten. De docent kan sets aanmaken via de beheeromgeving.
          </p>
        </div>
      )}

      {/* Grid of Card Sets */}
      {!isLoading && cardSets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0066B3]" />
              <h2 className="font-bold text-lg sm:text-xl text-[#002B49]">
                Kies een onderwerp ({cardSets.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {cardSets.map((set, index) => {
              const shareUrl = getFullShareUrl(set.slug);
              const isCopied = copiedSlug === set.slug;

              // Color accents per card based on index
              const borderColors = [
                "border-t-[#0066B3]",
                "border-t-[#E4007C]",
                "border-t-[#00A3E0]",
                "border-t-[#6366F1]",
              ];
              const accentBorder = borderColors[index % borderColors.length];

              return (
                <div
                  key={set.id}
                  id={`card-set-${set.slug}`}
                  className={`group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between border-t-6 ${accentBorder}`}
                >
                  <div>
                    {/* Top meta tags */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        <Layers className="w-3.5 h-3.5 text-[#0066B3]" />
                        {set.pairCount ?? 0} {set.pairCount === 1 ? "kaartpaar" : "kaartparen"}
                      </span>

                      <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {withBasePath("/set/")}{set.slug}
                      </span>
                    </div>

                    {/* Set Title */}
                    <h3 className="font-bold text-[#002B49] group-hover:text-[#0066B3] transition-colors mb-2.5 leading-snug text-xl">
                      {set.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 line-clamp-3 mb-6 leading-relaxed text-sm">
                      {set.description || "Oefen met deze kaartenset en test je kennis."}
                    </p>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    {/* Start Game Button */}
                    <button
                      id={`start-game-btn-${set.slug}`}
                      onClick={() => onSelectSet(set.slug)}
                      className="w-full py-3.5 px-5 rounded-2xl font-bold bg-[#0066B3] hover:bg-[#00508f] text-white shadow-md shadow-blue-900/15 hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-base"
                    >
                      <Play className="w-5 h-5 fill-white" />
                      <span>Start spel</span>
                      <ArrowRight className="w-4 h-4 ml-0.5 opacity-80 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Share URL copy row */}
                    <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 text-xs">
                      <span className="text-slate-500 truncate select-all font-mono" title={shareUrl}>
                        {shareUrl.replace(/^https?:\/\//, "")}
                      </span>
                      <button
                        id={`copy-url-btn-${set.slug}`}
                        onClick={(e) => handleCopyUrl(e, set.slug)}
                        className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                          isCopied
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                        }`}
                        title="Kopieer directe link voor studenten"
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Helpful educational footer notice */}
      <div className="mt-14 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-pink-50/40 rounded-3xl p-6 sm:p-8 border border-blue-100 text-center max-w-3xl mx-auto">
        <h4 className="font-bold text-[#002B49] text-base sm:text-lg mb-1">
          Hoe werkt het Koppelspel?
        </h4>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Koppel alle kaartjes aan elkaar door te slepen of door twee kaartjes na elkaar aan te klikken. Heb je alles gekoppeld? Klik dan op <strong>Nakijken</strong> om je score te zien! Haal minimaal 75% om te slagen.
        </p>
      </div>
    </div>
  );
};
