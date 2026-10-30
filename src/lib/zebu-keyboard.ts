export type ZebuKeyboardOptions = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  primeAudio: () => void;
  startListening: () => void | Promise<void>;
  stopListening: () => void;
};

export function createZebuKeyboardHandlers(options: ZebuKeyboardOptions) {
  let held = false;
  const release = () => {
    if (!held) return;
    held = false;
    options.stopListening();
  };
  return {
    release,
    down(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.ctrlKey && event.shiftKey && event.code === "KeyZ" && !event.repeat) {
        event.preventDefault();
        options.toggle();
        return;
      }
      if (!options.isOpen) return;
      if (event.code === "Escape") {
        event.preventDefault();
        release();
        options.close();
        return;
      }
      const interactive = (event.target as Element | null)?.closest?.(
        'input, textarea, select, button, a[href], summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="textbox"], [role="combobox"]',
      );
      if (event.code !== "Space" || interactive || event.repeat || held || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      held = true;
      options.primeAudio();
      try { void Promise.resolve(options.startListening()).catch(() => undefined); }
      catch { /* The voice hook supplies the visible error. */ }
    },
    up(event: KeyboardEvent) {
      if (event.code !== "Space" || !held) return;
      event.preventDefault();
      release();
    },
  };
}
