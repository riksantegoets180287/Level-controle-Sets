import { FC, useState, useEffect, useRef, useMemo, PointerEvent as ReactPointerEvent } from "react";
import { RotateCcw, Undo2, CheckCheck, TriangleAlert as AlertTriangle, Clock, Link2, Sparkles, Circle as HelpCircle, X, Layers } from "lucide-react";
import { CardSet, PlayableCard, ConnectedPair, GameResult } from "../types";
import { ResultsModal } from "./ResultsModal";
import { fireSuccessConfetti } from "../lib/confetti";

interface GameViewProps {
  cardSet: CardSet;
  onBackToHome?: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const DRAG_THRESHOLD = 8;

export const GameView: FC<GameViewProps> = ({ cardSet, onBackToHome }) => {
  const [allCards, setAllCards] = useState<PlayableCard[]>([]);
  const [connectedPairs, setConnectedPairs] = useState<ConnectedPair[]>([]);
  const [selectedCardUid, setSelectedCardUid] = useState<string | null>(null);
  const [dragOverCardUid, setDragOverCardUid] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isWideScreen, setIsWideScreen] = useState(() => window.innerWidth >= 768);

  // Pointer-based drag state (replaces unreliable HTML5 drag-and-drop)
  const pointerStateRef = useRef<{
    card: PlayableCard;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const [draggedCardUid, setDraggedCardUid] = useState<string | null>(null);

  const [showIntroModal, setShowIntroModal] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  useEffect(() => {
    const handleResize = () => setIsWideScreen(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (gameResult || showIntroModal) return;
    const timer = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [gameResult, showIntroModal]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const initGame = () => {
    if (!cardSet.pairs || cardSet.pairs.length === 0) return;

    const cards: PlayableCard[] = [];
    cardSet.pairs.forEach((p) => {
      cards.push({
        uid: `${p.id}-A-${Math.random().toString(36).substring(2, 7)}`,
        pairId: p.id,
        side: "A",
        text: p.cardAText,
        imageUrl: p.cardAImageUrl,
        partnerText: p.cardBText,
      });
      cards.push({
        uid: `${p.id}-B-${Math.random().toString(36).substring(2, 7)}`,
        pairId: p.id,
        side: "B",
        text: p.cardBText,
        imageUrl: p.cardBImageUrl,
        partnerText: p.cardAText,
      });
    });

    setAllCards(shuffleArray(cards));
    setConnectedPairs([]);
    setSelectedCardUid(null);
    setDraggedCardUid(null);
    setDragOverCardUid(null);
    setGameResult(null);
    setTimerSeconds(0);
    pointerStateRef.current = null;
  };

  useEffect(() => {
    initGame();
  }, [cardSet]);

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

  const pairCards = (card1: PlayableCard, card2: PlayableCard) => {
    if (card1.uid === card2.uid) return;
    if (card1.side === card2.side) {
      showNotice("Koppel altijd een groen kaartje aan een blauw kaartje!");
      return;
    }

    setConnectedPairs((prev) => {
      const isAlreadyPaired = prev.some(
        (cp) =>
          cp.card1.uid === card1.uid ||
          cp.card2.uid === card1.uid ||
          cp.card1.uid === card2.uid ||
          cp.card2.uid === card2.uid
      );
      if (isAlreadyPaired) return prev;

      const newPair: ConnectedPair = {
        id: `connected-${Date.now()}-${Math.random()}`,
        card1,
        card2,
      };
      return [...prev, newPair];
    });
    setSelectedCardUid(null);
    setDraggedCardUid(null);
    setDragOverCardUid(null);
  };

  const unpairCard = (card: PlayableCard) => {
    const existing = cardPairMap.get(card.uid);
    if (!existing) return;
    setConnectedPairs((prev) => prev.filter((p) => p.id !== existing.pair.id));
    setSelectedCardUid(null);
    showNotice("Kaartenpaar ontkoppeld.");
  };

  // ── Click handler (only fires when pointer did NOT move beyond threshold) ──
  const handleCardClick = (card: PlayableCard) => {
    const existing = cardPairMap.get(card.uid);
    if (existing) {
      unpairCard(card);
      return;
    }

    if (!selectedCardUid) {
      setSelectedCardUid(card.uid);
      return;
    }

    if (selectedCardUid === card.uid) {
      setSelectedCardUid(null);
      return;
    }

    const firstCard = allCards.find((c) => c.uid === selectedCardUid);
    if (!firstCard) {
      setSelectedCardUid(card.uid);
      return;
    }

    if (firstCard.side === card.side) {
      setSelectedCardUid(card.uid);
      showNotice(
        card.side === "A"
          ? "Selectie gewijzigd. Kies nu een BLAUW kaartje om te koppelen."
          : "Selectie gewijzigd. Kies nu een GROEN kaartje om te koppelen."
      );
      return;
    }

    pairCards(firstCard, card);
  };

  // ── Pointer-based drag (replaces HTML5 drag-and-drop) ──
  const handlePointerDown = (e: ReactPointerEvent, card: PlayableCard) => {
    if (cardPairMap.has(card.uid)) return;
    pointerStateRef.current = {
      card,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    const ps = pointerStateRef.current;
    if (!ps || ps.moved) {
      if (ps && ps.moved) {
        updateDragOverCard(e.clientX, e.clientY);
      }
      return;
    }

    const dx = e.clientX - ps.startX;
    const dy = e.clientY - ps.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      ps.moved = true;
      setDraggedCardUid(ps.card.uid);
      setSelectedCardUid(null);
    }
  };

  const updateDragOverCard = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) {
      setDragOverCardUid(null);
      return;
    }
    const cardEl = el.closest("[data-card-uid]");
    if (cardEl) {
      const uid = cardEl.getAttribute("data-card-uid");
      const ps = pointerStateRef.current;
      if (uid && uid !== ps?.card.uid && !cardPairMap.has(uid)) {
        setDragOverCardUid(uid);
      } else {
        setDragOverCardUid(null);
      }
    } else {
      setDragOverCardUid(null);
    }
  };

  const handlePointerUp = (e: ReactPointerEvent) => {
    const ps = pointerStateRef.current;
    if (!ps) return;

    if (ps.moved) {
      // It was a drag — find the card under the pointer
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        const cardEl = el.closest("[data-card-uid]");
        if (cardEl) {
          const targetUid = cardEl.getAttribute("data-card-uid");
          if (targetUid && targetUid !== ps.card.uid && !cardPairMap.has(targetUid)) {
            const targetCard = allCards.find((c) => c.uid === targetUid);
            if (targetCard) {
              pairCards(ps.card, targetCard);
            }
          }
        }
      }
      setDraggedCardUid(null);
      setDragOverCardUid(null);
    } else {
      // It was a click (pointer didn't move beyond threshold)
      handleCardClick(ps.card);
    }

    pointerStateRef.current = null;
  };

  const handlePointerCancel = () => {
    pointerStateRef.current = null;
    setDraggedCardUid(null);
    setDragOverCardUid(null);
  };

  // Global pointermove listener so dragging works even when pointer leaves the card
  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      const ps = pointerStateRef.current;
      if (!ps) return;
      if (ps.moved) {
        updateDragOverCard(e.clientX, e.clientY);
      } else {
        const dx = e.clientX - ps.startX;
        const dy = e.clientY - ps.startY;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          ps.moved = true;
          setDraggedCardUid(ps.card.uid);
          setSelectedCardUid(null);
        }
      }
    };

    const onUp = (e: globalThis.PointerEvent) => {
      const ps = pointerStateRef.current;
      if (!ps) return;

      if (ps.moved) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el) {
          const cardEl = el.closest("[data-card-uid]");
          if (cardEl) {
            const targetUid = cardEl.getAttribute("data-card-uid");
            if (targetUid && targetUid !== ps.card.uid && !cardPairMap.has(targetUid)) {
              const targetCard = allCards.find((c) => c.uid === targetUid);
              if (targetCard) {
                pairCards(ps.card, targetCard);
              }
            }
          }
        }
        setDraggedCardUid(null);
        setDragOverCardUid(null);
      } else {
        handleCardClick(ps.card);
      }

      pointerStateRef.current = null;
    };

    const onCancel = () => {
      pointerStateRef.current = null;
      setDraggedCardUid(null);
      setDragOverCardUid(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [allCards, cardPairMap]);

  const handleUndoLast = () => {
    if (connectedPairs.length === 0) return;
    setConnectedPairs((prev) => prev.slice(0, prev.length - 1));
    setSelectedCardUid(null);
    showNotice("Laatste koppeling ongedaan gemaakt.");
  };

  const handleConfirmRestart = () => {
    setShowRestartConfirm(false);
    initGame();
  };

  const handleCheckAnswers = () => {
    if (!isFullyConnected) return;

    const evaluationItems = connectedPairs.map((cp) => {
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
    if (passed) fireSuccessConfetti();
  };

  const gridConfig = useMemo(() => {
    const count = allCards.length;
    if (count <= 12) return isWideScreen ? { cols: 4, rows: 3 } : { cols: 3, rows: 4 };
    if (count <= 16) return { cols: 4, rows: 4 };
    if (count <= 20) return isWideScreen ? { cols: 5, rows: 4 } : { cols: 4, rows: 5 };
    return isWideScreen ? { cols: 6, rows: 4 } : { cols: 4, rows: 6 };
  }, [allCards.length, isWideScreen]);

  const selectedCard = selectedCardUid
    ? allCards.find((c) => c.uid === selectedCardUid)
    : null;

  return (
    <div
      id="game-viewport-container"
      className="h-full w-full max-h-screen overflow-hidden flex flex-col justify-between bg-[#EEF2F7] p-2 sm:p-3 select-none"
      style={{ touchAction: "none" }}
    >
      <header className="shrink-0 bg-white rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 border border-slate-200 shadow-2xs mb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="font-black text-[#002B49] text-sm sm:text-base tracking-tight leading-tight">
              {cardSet.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div
              id="stat-gekoppeld"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200/80 text-[#0066B3] text-xs font-black shadow-2xs"
            >
              <Link2 className="w-3.5 h-3.5 text-[#0066B3]" />
              <span>Gekoppeld: {connectedPairs.length}/{totalTargetPairs}</span>
            </div>

            <div
              id="stat-timer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black shadow-2xs font-mono"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Tijd: {formatTimer(timerSeconds)}</span>
            </div>

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

          <div className="flex items-center gap-1.5 sm:gap-2">
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

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#059669] border-2 border-white shadow-xs"></span>
              <span className="w-3 h-3 rounded-full bg-[#2563eb] border-2 border-white shadow-xs -ml-1"></span>
            </span>

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
            const isDragging = draggedCardUid === card.uid;
            const isGreenSide = card.side === "A";

            if (isPaired && pairData) {
              const topCard = card;
              const bottomCard = pairData.partner;

              return (
                <div
                  key={card.uid}
                  id={`card-slot-${index}`}
                  data-card-uid={card.uid}
                  onPointerDown={(e) => handlePointerDown(e, card)}
                  onPointerUp={(e) => handlePointerUp(e)}
                  onPointerCancel={handlePointerCancel}
                  title="Gekoppeld paar (grijs) • Klik om te ontkoppelen"
                  className="relative w-full h-full p-0.5 sm:p-1 cursor-pointer group select-none"
                  style={{ touchAction: "none" }}
                >
                  <div className="absolute inset-x-1 inset-y-1 sm:inset-x-1.5 sm:inset-y-1.5 rounded-2xl p-2 sm:p-2.5 flex items-center justify-center text-center shadow-md border-2 bg-slate-500 border-slate-600 text-slate-200 transform -rotate-3 -translate-x-1 -translate-y-0.5 transition-transform group-hover:-rotate-4 group-hover:-translate-x-1.5">
                    <p className="font-medium text-[10px] sm:text-xs md:text-sm leading-snug line-clamp-3 text-slate-200 opacity-90">
                      {bottomCard.text}
                    </p>
                  </div>

                  <div className="relative w-full h-full rounded-2xl p-2 sm:p-3 flex items-center justify-center text-center shadow-lg border-2 bg-slate-400 border-slate-300 text-white transform rotate-2 translate-x-0.5 translate-y-0.5 opacity-95 group-hover:opacity-100 group-hover:rotate-1 group-hover:scale-[1.01] transition-all">
                    <p className="font-semibold text-white text-[10px] sm:text-xs md:text-sm lg:text-base leading-snug line-clamp-4">
                      {topCard.text}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={card.uid}
                id={`card-slot-${index}`}
                data-card-uid={card.uid}
                onPointerDown={(e) => handlePointerDown(e, card)}
                onPointerUp={(e) => handlePointerUp(e)}
                onPointerCancel={handlePointerCancel}
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
                } ${
                  isDragging ? "opacity-50 scale-95 z-30" : ""
                }`}
                style={{ touchAction: "none" }}
              >
                <p className="font-semibold text-white text-[10px] sm:text-xs md:text-sm lg:text-base leading-snug line-clamp-4 px-1">
                  {card.text}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {showIntroModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 relative">
            <button
              onClick={() => setShowIntroModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066B3] flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <Layers className="w-6 h-6" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-center text-[#002B49] mb-1">
              Speluitleg
            </h2>
            <p className="text-slate-500 text-center text-xs sm:text-sm font-medium mb-6">
              Zoek de begrippen die bij elkaar horen
            </p>

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
              "Weet je zeker dat je opnieuw wilt beginnen? Je gemaakte koppelingen en verstreken tijd gaan verloren."
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
