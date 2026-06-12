type FlashMessageProps = {
  message: string | null;
  type?: "notice" | "error";
  onClose: () => void;
};

export function FlashMessage({ message, type = "notice", onClose }: FlashMessageProps) {
  if (!message) {
    return null;
  }

  const className =
    type === "notice"
      ? "mb-4 flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
      : "mb-4 flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800";

  return (
    <div className={className} role={type === "error" ? "alert" : "status"}>
      {message}
      <button type="button" className="ml-auto text-sm underline" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
