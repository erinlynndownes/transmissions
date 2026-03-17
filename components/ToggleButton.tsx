export function ToggleButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`px-3 py-1 text-sm rounded transition-colors ${
        selected
          ? "bg-neutral-200 text-neutral-900"
          : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}
