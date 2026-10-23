export function createSoundtrack(element, { volume = .18, onChange = () => {} } = {}) {
  let playing = false, requested = false;
  element.loop = true;
  element.volume = Math.max(0, Math.min(1, Number(volume) || 0));
  function pause() { requested = false; playing = false; element.pause(); onChange(false); }
  element.addEventListener('error', () => { requested = false; playing = false; onChange(false); });
  return {
    get playing() { return playing; },
    get volume() { return element.volume; },
    setVolume(value) { element.volume = Math.max(0, Math.min(1, Number(value) || 0)); },
    pause,
    async toggle() {
      if (requested || playing) { pause(); return false; }
      requested = true;
      try {
        await element.play();
        if (!requested) { element.pause(); return false; }
        playing = true; onChange(true); return true;
      } catch (error) { requested = false; playing = false; onChange(false); throw error; }
    },
  };
}
