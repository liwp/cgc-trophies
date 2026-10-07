/** An accessible on/off switch with a label. */
const Toggle = ({
  id,
  label,
  onChange,
  checked,
}: {
  id: string;
  label: string;
  onChange: () => void;
  checked: boolean;
}) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <label
        htmlFor={id}
        className="text-sm text-gray-500 select-none cursor-pointer"
      >
        {label}
      </label>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
          checked ? "bg-cambridge" : "bg-gray-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 translate-y-0.5 ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
};

export default Toggle;
