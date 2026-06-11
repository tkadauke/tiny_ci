type FlashMessageProps = {
  message: string | null;
  type?: "notice" | "error";
  onClose: () => void;
};

export function FlashMessage({ message, type = "notice", onClose }: FlashMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div id="flash" className={type} role={type === "error" ? "alert" : "status"}>
      {message}
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
