/**
 * Explicit ROAM OS media manifest.
 * Only named, approved product evidence belongs here.
 * Personal photography is not project evidence.
 */
export const roamAssets = {
  signpost: null,
  ui: {
    hero: null,
    plan: null,
    understand: null,
    translate: null,
    move: null,
  },
} as const;

export const roamHasProductUi = Object.values(roamAssets.ui).some(Boolean);
