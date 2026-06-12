import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type Flash = {
  type: "notice" | "error";
  message: string;
};

type FlashContextValue = {
  flash: Flash | null;
  setFlash: (flash: Flash | null) => void;
  clearFlash: () => void;
};

const FlashContext = createContext<FlashContextValue | undefined>(undefined);

export function FlashProvider({ children }: { children: ReactNode }) {
  const [flash, setFlash] = useState<Flash | null>(null);
  const clearFlash = useCallback(() => setFlash(null), []);
  const value = useMemo(() => ({ flash, setFlash, clearFlash }), [flash, clearFlash]);

  return <FlashContext.Provider value={value}>{children}</FlashContext.Provider>;
}

export function useFlash() {
  const context = useContext(FlashContext);

  if (!context) {
    throw new Error("useFlash must be used within FlashProvider");
  }

  return context;
}

export default function FlashMessage() {
  const { flash, clearFlash } = useFlash();

  if (!flash) {
    return null;
  }

  const variantClass =
    flash.type === "notice"
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-red-50 border-red-200 text-red-800";
  const buttonClass = flash.type === "notice" ? "text-green-600 hover:text-green-800" : "text-red-600 hover:text-red-800";

  return (
    <div className={`mb-4 flex items-center gap-3 rounded-md border px-4 py-3 text-sm ${variantClass}`} role="alert">
      <span className="flex-1">{flash.message}</span>
      <button
        type="button"
        onClick={() => {
          clearFlash();
        }}
        className={buttonClass}
        aria-label="Dismiss message"
      >
        &times;
      </button>
    </div>
  );
}
