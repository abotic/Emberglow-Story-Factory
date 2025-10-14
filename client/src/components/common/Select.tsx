type Option = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
};

export function Select({ label, value, onChange, options }: Props) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-2xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}