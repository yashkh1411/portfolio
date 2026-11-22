// Ported from the earlier ChatGPT portfolio (types stripped, logic unchanged).
/** A narrow landscape panel needs a lateral composition, not the phone stack. */
export function isPortraitScene(width        , height        )          {
  return width < 700 && height > width * 1.08;
}
