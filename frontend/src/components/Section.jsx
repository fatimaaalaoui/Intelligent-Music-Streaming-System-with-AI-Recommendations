import { Link } from "react-router-dom";

export default function Section({ title, description, actionLabel, seeAllData, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-white/60 mt-1">{description}</p>
          )}
        </div>

        {actionLabel && seeAllData && (
          <Link
            to="/see-all"
            state={seeAllData}
            className="text-xs md:text-sm font-semibold text-white/70 hover:text-white"
          >
            {actionLabel}
          </Link>
        )}

        {actionLabel && !seeAllData && (
          <button className="text-xs md:text-sm font-semibold text-white/70 hover:text-white">
            {actionLabel}
          </button>
        )}
      </div>

      {children}
    </section>
  );
}
