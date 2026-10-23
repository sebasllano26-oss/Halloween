export function createSoundtrack(element, { volume = .18, onChange = () => {} } = {}) {
  let playing = false, requested = false, pending = null, attempt = 0;
  let stopAutoplay = () => {};
  element.loop = true;
  element.volume = Math.max(0, Math.min(1, Number(volume) || 0));
  function pause() {
    stopAutoplay(); attempt++; pending = null; requested = false; playing = false;
    element.pause(); onChange(false);
  }
  function start() {
    if (playing) return Promise.resolve(true);
    if (pending) return pending;
    requested = true;
    const current = ++attempt;
    // Call play synchronously so a first click/touch retains browser activation.
    let playback;
    try { playback = element.play(); } catch (error) { playback = Promise.reject(error); }
    pending = Promise.resolve(playback).then(() => {
      if (current !== attempt || !requested) return false;
      playing = true; stopAutoplay(); onChange(true); return true;
    }, error => {
      if (current === attempt) { requested = false; playing = false; onChange(false); }
      throw error;
    }).finally(() => { if (current === attempt) pending = null; });
    return pending;
  }
  element.addEventListener('error', pause);
  return {
    get playing() { return playing; },
    get volume() { return element.volume; },
    setVolume(value) { element.volume = Math.max(0, Math.min(1, Number(value) || 0)); },
    pause,
    autoplay(target) {
      stopAutoplay();
      const gestures = ['click', 'touchend', 'keydown'];
      const tryStart = () => start().catch(error => {
        if (error.name !== 'NotAllowedError') stopAutoplay();
        return false;
      });
      const onGesture = event => {
        // The music button has its own toggle; do not consume the same tap twice.
        if (event.target?.closest?.('[data-action="sound"]')) return;
        if (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.altKey || event.metaKey || ['Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key))) return;
        if (!requested && !playing) void tryStart();
      };
      stopAutoplay = () => {
        gestures.forEach(name => target.removeEventListener(name, onGesture, { capture: true }));
        stopAutoplay = () => {};
      };
      gestures.forEach(name => target.addEventListener(name, onGesture, { capture: true, passive: true }));
      return tryStart();
    },
    async toggle() {
      if (requested || playing) { pause(); return false; }
      stopAutoplay();
      return start();
    },
  };
}
