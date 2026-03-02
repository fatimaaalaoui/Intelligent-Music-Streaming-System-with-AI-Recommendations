import { useEffect, useRef, useState } from "react";

export default function ScrollRow({ children, itemCount }) {
  const rowRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateButtons = () => {
    const el = rowRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    setCanLeft(scrollLeft > 5);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    updateButtons();

    const onScroll = () => updateButtons();
    const onResize = () => updateButtons();

    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [itemCount]);

  const scrollByAmount = (direction) => {
    const el = rowRef.current;
    if (!el) return;
    const scrollAmount = 420 * direction;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(updateButtons, 350);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByAmount(-1)}
        className={`hidden md:flex items-center justify-center
                    absolute left-3 top-1/2 -translate-y-1/2 z-10
                    h-9 w-9 rounded-full bg-black/60 hover:bg-black
                    text-white shadow-lg transition-opacity ${
                      canLeft ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
        aria-label="Précédent"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
            fill="currentColor"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => scrollByAmount(1)}
        className={`hidden md:flex items-center justify-center
                    absolute right-3 top-1/2 -translate-y-1/2 z-10
                    h-9 w-9 rounded-full bg-black/60 hover:bg-black
                    text-white shadow-lg transition-opacity ${
                      canRight ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
        aria-label="Suivant"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"
            fill="currentColor"
          />
        </svg>
      </button>

      <div className="overflow-hidden">
        <div
          ref={rowRef}
          className="flex gap-8 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          {children}
        </div>
      </div>
    </div>
  );
}
