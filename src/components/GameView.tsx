import { FC, useState, useEffect, DragEvent, useMemo } from "react";
import { RotateCcw, Undo2, CheckCheck, TriangleAlert as AlertTriangle, Clock, Link2, Sparkles, Circle as HelpCircle, X, Layers } from "lucide-react";
import { CardSet, PlayableCard, ConnectedPair, GameResult } from "../types";
import { ResultsModal } from "./ResultsModal";
import { fireSuccessConfetti } from "../lib/confetti";

interface GameViewProps {
  cardSet: CardSet;
  onBackToHome?: () => void;
}

// Utility to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


export const GameView: FC<GameViewProps> = ({ cardSet, onBackToHome }) => {
  const [allCards, setAllCards] = useState<PlayableCard[]>([]);
  const [connectedPairs, setConnectedPairs] = useState<ConnectedPair[]>([]);
  const [selectedCardUid, setSelectedCardUid] = useState<string | null>(null);
  const [draggedCardUid, setDraggedCardUid] = useState<string | null>(null);
  const [dragOverCardUid, setDragOverCardUid] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isWideScreen, setIsWideScreen] = useState(() => window.innerWidth >= 768);

  // Instruction popup at start
  const [showIntroModal, setShowIntroModal] = useState(true);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Restart modal
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Result state
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // Window resize listener to keep grid proportions responsive without scrolling
  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Timer counter
  useEffect(() => {
    if (gameResult || showIntroModal) return;
    const timer = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameResult, showIntroModal]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper for feedback toast
  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // Initialize or reset game
  const initGame = () => {
    if (!cardSet.pairs || cardSet.pairs.length === 0) return;

    const cards: PlayableCard[] = [];
    cardSet.pairs.forEach((p) => {
      // Side A = Groen
      cards.push({
        uid: `${p.id}-A-${Math.random().toString(36).substring(2, 7)}`,
        pairId: p.id,
        side: "A",
        text: p.cardAText,
        imageUrl: p.cardAImageUrl,
        partnerText: p.cardBText,
      });
      // Side B = Blauw
      cards.push({
        uid: `${p.id}-B-${Math.random().toString(36).substring(2, 7)}`,
        pairId: p.id,
        side: "B",
        text: p.cardBText,
        imageUrl: p.cardBImageUrl,
        partnerText: p.cardAText,
      });
    });

    // Shuffle cards across grid
    setAllCards(shuffleArray(cards));
    setConnectedPairs([]);
    setSelectedCardUid(null);
    setDraggedCardUid(null);
    setDragOverCardUid(null);
    setGameResult(null);
    setTimerSeconds(0);
  };

  useEffect(() => {
    initGame();
  }, [cardSet]);

  // Lookup map of which card is paired
  const cardPairMap = useMemo(() => {
    const map = new Map<string, { pair: ConnectedPair; partner: PlayableCard }>();
    connectedPairs.forEach((cp) => {
      map.set(cp.card1.uid, { pair: cp, partner: cp.card2 });
      map.set(cp.card2.uid, { pair: cp, partner: cp.card1 });
    });
    return map;
  }, [connectedPairs]);

  const totalTargetPairs = cardSet.pairs?.length || 0;
  const isFullyConnected =
    totalTargetPairs > 0 && connectedPairs.length === totalTargetPairs;

  // Handler to pair two cards
  const pairCards = (card1: PlayableCard, card2: PlayableCard) => {
    if (card1.uid === card2.uid) return;
    if (cardPairMap.has(card1.uid) || cardPairMap.has(card2.uid)) return;

    // Both cards must be of different sides (1 Green, 1 Blue)
    if (card1.side === card2.side) {
      showNotice("Koppel altijd een groen kaartje aan een blauw kaartje!");
      return;
    }

    const newPair: ConnectedPair = {
      id: `connected-${Date.now()}-${Math.random()}`,
      card1,
      card2,
    };

    setConnectedPairs((prev) => [...prev, newPair]);
    setSelectedCardUid(null);
    setDraggedCardUid(null);
    setDragOverCardUid(null);
  };

  // Click handler
  const handleCardClick = (card: PlayableCard) => {
    // If clicking an already paired (gray) card, uncouple it
    const existing = cardPairMap.get(card.uid);
    if (existing) {
      setConnectedPairs((prev) => prev.filter((p) => p.id !== existing.pair.id));
      setSelectedCardUid(null);
      showNotice("Kaartenpaar ontkoppeld.");
      return;
    }

    // If nothing selected yet, select this card
    if (!selectedCardUid) {
      setSelectedCardUid(card.uid);
      return;
    }

    // Deselect if clicking the same card
    if (selectedCardUid === card.uid) {
      setSelectedCardUid(null);
      return;
    }

    const firstCard = allCards.find((c) => c.uid === selectedCardUid);
    if (!firstCard) {
      setSelectedCardUid(card.uid);
      return;
    }

    // If clicked two cards of the same color, switch selection smoothly
    if (firstCard.side === card.side) {
      setSelectedCardUid(card.uid);
      showNotice(
        card.side === "A"
          ? "Selectie gewijzigd. Kies nu een BLAUW kaartje om te koppelen."
          : "Selectie gewijzigd. Kies nu een GROEN kaartje om te koppelen."
      );
      return;
    }

    // Pair Green + Blue!
    pairCards(firstCard, card);
  };

  // Drag & Drop handlers
  const handleDragStart = (e: DragEvent, card: PlayableCard) => {
    if (cardPairMap.has(card.uid)) {
      e.preventDefault();
      return;
    }
    setDraggedCardUid(card.uid);
    e.dataTransfer.setData("text/plain", card.uid);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent, targetCard: PlayableCard) => {
    e.preventDefault();
    if (!draggedCardUid || draggedCardUid === targetCard.uid) return;
    if (cardPairMap.has(targetCard.uid)) return;
    setDragOverCardUid(targetCard.uid);
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    setDragOverCardUid(null);
  };

  const handleDrop = (e: DragEvent, targetCard: PlayableCard) => {
    e.preventDefault();
    setDragOverCardUid(null);
    const sourceUid = e.dataTransfer.getData("text/plain") || draggedCardUid;
    if (!sourceUid || sourceUid === targetCard.uid) return;

    const sourceCard = allCards.find((c) => c.uid === sourceUid);
    if (
      sourceCard &&
      !cardPairMap.has(sourceCard.uid) &&
      !cardPairMap.has(targetCard.uid)
    ) {
      pairCards(sourceCard, targetCard);
    }
    setDraggedCardUid(null);
  };

  const handleDragEnd = () => {
    setDraggedCardUid(null);
    setDragOverCardUid(null);
  };

  // Undo last step handler
  const handleUndoLast = () => {
    if (connectedPairs.length === 0) return;
    setConnectedPairs((prev) => prev.slice(0, prev.length - 1));
    setSelectedCardUid(null);
    showNotice("Laatste koppeling ongedaan gemaakt.");
  };

  // Confirm restart
  const handleConfirmRestart = () => {
    setShowRestartConfirm(false);
    initGame();
  };

  // Check answers
  const handleCheckAnswers = () => {
    if (!isFullyConnected) return;

    const evaluationItems = connectedPairs.map((cp) => {
      // Correct if card1 and card2 share the exact same pairId and have opposite sides
      const isCorrect =
        cp.card1.pairId === cp.card2.pairId && cp.card1.side !== cp.card2.side;

      const originalPair = cardSet.pairs?.find(
        (p) => p.id === cp.card1.pairId || p.id === cp.card2.pairId
      );

      return {
        id: cp.id,
        card1: cp.card1,
        card2: cp.card2,
        isCorrect,
        correctCardAText: originalPair?.cardAText || cp.card1.text,
        correctCardBText: originalPair?.cardBText || cp.card1.partnerText || cp.card2.text,
      };
    });

    const correctCount = evaluationItems.filter((i) => i.isCorrect).length;
    const incorrectCount = evaluationItems.length - correctCount;
    const percentage = Math.round((correctCount / evaluationItems.length) * 100);
    const passed = percentage >= 75;

    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat("nl-NL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(now);

    const result: GameResult = {
      setName: cardSet.title,
      setSlug: cardSet.slug,
      completedAt: formattedDate,
      completionTime: formatTimer(timerSeconds),
      totalPairs: evaluationItems.length,
      correctPairs: correctCount,
      incorrectPairs: incorrectCount,
      percentage,
      passed,
      items: evaluationItems,
    };

    setGameResult(result);

    if (passed) {
      fireSuccessConfetti();
    }
  };

  // Compute grid columns and rows to mathematically fit the screen without scroll
  const gridConfig = useMemo(() => {
    const count = allCards.length;
    if (count <= 12) {
      return isWideScreen ? { cols: 4, rows: 3 } : { cols: 3, rows: 4 };
    }
    if (count <= 16) {
      return { cols: 4, rows: 4 };
    }
    if (count <= 20) {
      return isWideScreen ? { cols: 5, rows: 4 } : { cols: 4, rows: 5 };
    }
    // Default for 24 cards (6 columns x 4 rows in landscape, 4 cols x 6 rows in portrait)
    return isWideScreen ? { cols: 6, rows: 4 } : { cols: 4, rows: 6 };
  }, [allCards.length, isWideScreen]);

  // Find currently selected card object
  const selectedCard = selectedCardUid
    ? allCards.find((c) => c.uid === selectedCardUid)
    : null;

  return (
    <div
      id="game-viewport-container"
      className="h-full w-full max-h-screen overflow-hidden flex flex-col justify-between bg-[#EEF2F7] p-2 sm:p-3 select-none"
    >
      {/* COMPACT TOP HEADER BAR */}
      <header className="shrink-0 bg-white rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 border border-slate-200 shadow-2xs mb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Navigation and Title (only title, no description) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <h1 className="font-black text-[#002B49] text-sm sm:text-base tracking-tight leading-tight">
                {cardSet.title}
              </h1>
            </div>
          </div>

          {/* Center: Live Stats Badges & Info Button */}
          <div className="flex items-center gap-2">
            {/* Pairs count */}
            <div
              id="stat-gekoppeld"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200/80 text-[#0066B3] text-xs font-black shadow-2xs"
            >
              <Link2 className="w-3.5 h-3.5 text-[#0066B3]" />
              <span>
                Gekoppeld: {connectedPairs.length}/{totalTargetPairs}
              </span>
            </div>

            {/* Timer */}
            <div
              id="stat-timer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black shadow-2xs font-mono"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Tijd: {formatTimer(timerSeconds)}</span>
            </div>

            {/* Uitleg modal button */}
            <button
              id="btn-open-intro-instructions"
              onClick={() => setShowIntroModal(true)}
              title="Speluitleg bekijken"
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#0066B3]" />
              <span className="hidden sm:inline">Uitleg</span>
            </button>
          </div>

          {/* Right: Action Buttons (Undo, Restart, Nakijken) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Laatste stap ongedaan maken */}
            <button
              id="btn-undo-step"
              onClick={handleUndoLast}
              disabled={connectedPairs.length === 0}
              title="Laatste stap ongedaan maken"
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                connectedPairs.length > 0
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs"
                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Laatste stap ongedaan maken</span>
              <span className="md:hidden">Herstel</span>
            </button>

            {/* Opnieuw beginnen */}
            <button
              id="btn-restart-game"
              onClick={() => setShowRestartConfirm(true)}
              title="Opnieuw beginnen"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Opnieuw beginnen</span>
              <span className="md:hidden">Reset</span>
            </button>

            {/* Nakijken Button */}
            <button
              id="btn-nakijken"
              onClick={handleCheckAnswers}
              disabled={!isFullyConnected}
              title={
                isFullyConnected
                  ? "Controleer je combinaties"
                  : `Koppel alle ${totalTargetPairs} paren om na te kijken`
              }
              className={`px-3 sm:px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isFullyConnected
                  ? "bg-gradient-to-r from-[#0066B3] to-[#002B49] text-white shadow-md shadow-blue-900/20 hover:scale-[1.03] active:scale-[0.98] ring-2 ring-blue-300 animate-pulse"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75"
              }`}
            >
              {isFullyConnected ? (
                <Sparkles className="w-3.5 h-3.5 text-[#00A3E0]" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Nakijken</span>
            </button>
          </div>
        </div>

        {/* Dynamic Instructional Banner */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#059669] border-2 border-white shadow-xs"></span>
              <span className="w-3 h-3 rounded-full bg-[#2563eb] border-2 border-white shadow-xs -ml-1"></span>
            </span>

            {/* Dynamic Instruction text depending on selected card */}
            {selectedCard ? (
              <span className="font-semibold text-[#002B49] animate-pulse">
                {selectedCard.side === "A" ? (
                  <>
                    <span className="text-emerald-700">Groen kaartje</span> geselecteerd. Kies nu een{" "}
                    <span className="text-blue-700 underline font-bold">blauw kaartje</span> dat hierbij hoort!
                  </>
                ) : (
                  <>
                    <span className="text-blue-700">Blauw kaartje</span> geselecteerd. Kies nu een{" "}
                    <span className="text-emerald-700 underline font-bold">groen kaartje</span> dat hierbij hoort!
                  </>
                )}
              </span>
            ) : (
              <span className="font-semibold text-slate-700">
                Zoek een <span className="text-emerald-700 font-bold">groen</span> en een{" "}
                <span className="text-blue-700 font-bold">blauw</span> kaartje dat bij elkaar hoort.
              </span>
            )}
          </div>

          {/* Feedback notice or helpful tip */}
          <div className="text-[11px] font-semibold text-slate-500 truncate max-w-xs sm:max-w-md">
            {feedbackNotice ? (
              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {feedbackNotice}
              </span>
            ) : isFullyConnected ? (
              <span className="text-emerald-700 font-bold">
                ✓ Alle kaartjes gekoppeld! Klik op <strong>Nakijken</strong>.
              </span>
            ) : (
              <span>(Klik op een grijs gekoppeld paar om te ontkoppelen)</span>
            )}
          </div>
        </div>
      </header>

      {/* FULL-SCREEN CARD GRID (Fits 100% within viewport height, zero vertical scroll) */}
      <main className="flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center p-0.5">
        <div
          id="cards-grid"
          className="grid w-full h-full gap-2 sm:gap-2.5"
          style={{
            gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridConfig.rows}, minmax(0, 1fr))`,
          }}
        >
          {allCards.map((card, index) => {
            const pairData = cardPairMap.get(card.uid);
            const isPaired = Boolean(pairData);
            const isSelected = selectedCardUid === card.uid;
            const isDragOver = dragOverCardUid === card.uid;
            const isGreenSide = card.side === "A";

            // If card is paired: become GRAY!
            // Stacked visual showing only the concepts on gray cards
            if (isPaired && pairData) {
              const topCard = card;
              const bottomCard = pairData.partner;

              return (
                <div
                  key={card.uid}
                  id={`card-slot-${index}`}
                  onClick={() => handleCardClick(card)}
                  title="Gekoppeld paar (grijs) • Klik om te ontkoppelen"
                  className="relative w-full h-full p-0.5 sm:p-1 cursor-pointer group select-none"
                >
                  {/* UNDERNEATH GRAY CARD (Tilted -3° with shadow) */}
                  <div className="absolute inset-x-1 inset-y-1 sm:inset-x-1.5 sm:inset-y-1.5 rounded-2xl p-2 sm:p-2.5 flex items-center justify-center text-center shadow-md border-2 bg-slate-500 border-slate-600 text-slate-200 transform -rotate-3 -translate-x-1 -translate-y-0.5 transition-transform group-hover:-rotate-4 group-hover:-translate-x-1.5">
                    <p className="font-medium text-[10px] sm:text-xs md:text-sm leading-snug line-clamp-3 text-slate-200 opacity-90">
                      {bottomCard.text}
                    </p>
                  </div>

                  {/* TOP GRAY CARD (Tilted +2°, overlapping on top, only the concept) */}
                  <div className="relative w-full h-full rounded-2xl p-2 sm:p-3 flex items-center justify-center text-center shadow-lg border-2 bg-slate-400 border-slate-300 text-white transform rotate-2 translate-x-0.5 translate-y-0.5 opacity-95 group-hover:opacity-100 group-hover:rotate-1 group-hover:scale-[1.01] transition-all">
                    <p className="font-semibold text-white text-[10px] sm:text-xs md:text-sm lg:text-base leading-snug line-clamp-4">
                      {topCard.text}
                    </p>
                  </div>
                </div>
              );
            }

            // UNPAIRED CARD: Clean solid card with ONLY the concept text!
            // Green (#059669) or Blue (#2563eb)
            return (
              <div
                key={card.uid}
                id={`card-slot-${index}`}
                draggable={!isPaired}
                onDragStart={(e) => handleDragStart(e, card)}
                onDragOver={(e) => handleDragOver(e, card)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, card)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick(card)}
                className={`relative w-full h-full rounded-2xl p-2 sm:p-3.5 flex items-center justify-center text-center transition-all duration-150 cursor-pointer shadow-md select-none ${
                  isGreenSide
                    ? "bg-[#059669] hover:bg-[#047857] text-white border-2 border-emerald-400/50"
                    : "bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-2 border-blue-400/50"
                } ${
                  isSelected
                    ? "ring-4 ring-yellow-300 scale-[1.03] shadow-2xl z-20"
                    : "hover:scale-[1.015] hover:shadow-lg"
                } ${
                  isDragOver
                    ? "ring-4 ring-white scale-[1.04] shadow-2xl z-20"
                    : ""
                }`}
              >
                {/* ONLY the concept text on the card */}
                <p className="font-semibold text-white text-[10px] sm:text-xs md:text-sm lg:text-base leading-snug line-clamp-4 px-1">
                  {card.text}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* POPUP MET UITLEG IN HET BEGIN */}
      {showIntroModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 relative">
            {/* Close icon top right */}
            <button
              onClick={() => setShowIntroModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Summa Icon Header */}
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066B3] flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <Layers className="w-6 h-6" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-center text-[#002B49] mb-1">
              Speluitleg
            </h2>
            <p className="text-slate-500 text-center text-xs sm:text-sm font-medium mb-6">
              Zoek de begrippen die bij elkaar horen
            </p>

            {/* Instructions list */}
            <div className="space-y-3.5 mb-7 text-left text-sm text-slate-700">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex shrink-0 items-center mt-0.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#059669] border-2 border-white shadow-xs"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#2563eb] border-2 border-white shadow-xs -ml-1.5"></span>
                </div>
                <div>
                  <p className="font-bold text-[#002B49]">Groen & Blauw</p>
                  <p className="text-xs text-slate-600">
                    Koppel altijd één <strong>groen kaartje</strong> aan één <strong>blauw kaartje</strong> dat erbij hoort.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-[#0066B3] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-bold text-[#002B49]">Klikken of slepen</p>
                  <p className="text-xs text-slate-600">
                    Klik op een kaartje en klik daarna op het partnerkaartje. Je kunt kaartjes ook naar elkaar toe slepen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-bold text-[#002B49]">Gekoppeld = Grijs</p>
                  <p className="text-xs text-slate-600">
                    Zodra twee kaartjes gekoppeld zijn, worden ze <strong>grijs</strong>. Klik op een grijs paar om de koppeling weer te verbreken.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <p className="font-bold text-[#002B49]">Nakijken</p>
                  <p className="text-xs text-slate-600">
                    Alle paren gekoppeld? Klik op <strong>Nakijken</strong> voor je score en de screenshot voor je docent!
                  </p>
                </div>
              </div>
            </div>

            {/* Start button */}
            <button
              id="btn-start-game-intro"
              onClick={() => setShowIntroModal(false)}
              className="w-full py-3.5 px-4 rounded-xl font-black bg-[#0066B3] hover:bg-[#005292] text-white transition-all text-sm shadow-md shadow-blue-900/20 cursor-pointer text-center"
            >
              Begrepen, start het spel!
            </button>
          </div>
        </div>
      )}

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-center text-[#002B49] mb-2">
              Opnieuw beginnen?
            </h3>
            <p className="text-slate-600 text-center text-sm mb-6 leading-relaxed">
              “Weet je zeker dat je opnieuw wilt beginnen? Je gemaakte koppelingen en verstreken tijd gaan verloren.”
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="btn-cancel-restart"
                onClick={() => setShowRestartConfirm(false)}
                className="py-3 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-sm cursor-pointer"
              >
                Annuleren
              </button>
              <button
                id="btn-confirm-restart"
                onClick={handleConfirmRestart}
                className="py-3 px-4 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors text-sm shadow-md shadow-rose-900/20 cursor-pointer"
              >
                Ja, opnieuw beginnen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {gameResult && (
        <ResultsModal
          result={gameResult}
          onPlayAgain={initGame}
          onBackToHome={onBackToHome}
        />
      )}
    </div>
  );
};
