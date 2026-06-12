import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  if (!flash) {
    return null;
  }

  return (
    <div id="flash" className={flash.type} role="alert">
      {flash.message}
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault();
          clearFlash();
        }}
      >
        {t("layouts.close_flash")}
      </a>
    </div>
  );
}
