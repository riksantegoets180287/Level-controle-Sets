import { FC } from "react";
import { CheckCircle2, RotateCcw, Camera, Clock } from "lucide-react";
import { GameResult } from "../types";

interface ResultsModalProps {
  result: GameResult;
  onPlayAgain: () => void;
  onBackToHome?: () => void;
}

export const ResultsModal: FC<ResultsModalProps> = ({
  result,
  onPlayAgain,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Summa identity header */}
        <div className="bg-gradient-to-r from-[#002B49] via-[#003865] to-[#0066B3] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-sm">
              S<span className="text-[#E4007C]">•</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                Summa College • Resultatenoverzicht
              </p>
              <h2 className="font-bold text-base sm:text-lg leading-tight truncate max-w-xs sm:max-w-md">
                {result.setName}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {result.completionTime && (
              <span className="text-[11px] sm:text-xs bg-white/15 px-2.5 py-1 rounded-full text-blue-100 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#00A3E0]" />
                <span>{result.completionTime}</span>
              </span>
            )}
            <span className="text-[11px] sm:text-xs bg-white/15 px-2.5 py-1 rounded-full text-blue-100 font-mono">
              {result.completedAt}
            </span>
          </div>
        </div>

        {/* COMPACT OVERVIEW (Fits cleanly on 1 screen for camera/screenshot) */}
        <div id="screenshot-area" className="p-5 sm:p-7">
          {/* Pass / Fail Big Status Badge */}
          <div className="text-center mb-6">
            {result.passed ? (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-700 font-extrabold text-xl sm:text-2xl shadow-xs mb-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                <span>Gehaald!</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-50 border-2 border-rose-500 text-rose-700 font-extrabold text-xl sm:text-2xl shadow-xs mb-3">
                <CheckCircle2 className="w-7 h-7 text-rose-600" />
                <span>Niet gehaald</span>
              </div>
            )}
            <p className="text-slate-600 text-sm sm:text-base font-semibold">
              {result.passed
                ? `Gefeliciteerd! Je behaalde een score van ${result.percentage}%.`
                : `Helaas, je score is ${result.percentage}%. Een minimale score van 75% is vereist.`}
            </p>
          </div>

          {/* Core Numeric KPI Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6 text-center">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Score
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  result.passed ? "text-emerald-600" : "text-[#002B49]"
                }`}
              >
                {result.percentage}%
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Goed gekoppeld
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                {result.correctPairs} / {result.totalPairs}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Fouten
              </span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600">
                {result.incorrectPairs}
              </span>
            </div>
          </div>

          {/* Mandatory Instruction for student: screenshot notice */}
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-3.5 mb-6 flex items-start gap-3 text-amber-900 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0 mt-0.5">
              <Camera className="w-4 h-4 text-amber-900" />
            </div>
            <div className="text-left">
              <p className="font-extrabold text-xs sm:text-sm">
                Instructie voor inleveren:
              </p>
              <p className="text-xs sm:text-sm font-semibold mt-0.5">
                “Maak een screenshot van dit resultatenoverzicht en lever deze in bij je docent.”
              </p>
            </div>
          </div>

          {/* Action button: Opnieuw spelen */}
          <div>
            <button
              id="btn-play-again"
              onClick={onPlayAgain}
              className="w-full py-3.5 px-4 rounded-2xl font-bold bg-[#0066B3] hover:bg-[#005292] text-white shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Opnieuw spelen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
