import AuthStatus from "./AuthStatus";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
}

export default function Header({ title, onBack, showBack = true }: HeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 bg-white">
      {showBack && onBack && (
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="戻る"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M11 4L6 9L11 14" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <h1 className="font-semibold text-slate-800 flex-1">{title}</h1>
      <AuthStatus />
    </header>
  );
}
