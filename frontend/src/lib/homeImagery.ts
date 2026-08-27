// Curated editorial photography for the home page (11.7): one hero, three for
// The Edit tiles. Hand-picked from Unsplash — sourced at 4:5 and served
// through permanent images.unsplash.com URLs with imgix params, per 11.3's
// decisions. Not product photos: the hero and Edit tiles are full-body
// editorial compositions no single product was shot for (see the epic's
// "Rejected: reusing a product photo as the hero" decision).
//
// Sourced by hand-browsing unsplash.com (no API key used for this pass), so
// the Unsplash License applies and no per-photo attribution is required —
// see the "Attribution is one footer line" decision in
// planning/stylesense-ai/issues/11.3-imagery-curation.md.

function unsplashUrl(photoId: string, { w, h }: { w: number; h: number }) {
  return `https://images.unsplash.com/photo-${photoId}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;
}

// Wide crop for the full-bleed hero banner — not 4:5, that ratio is the
// product-grid/gallery convention (see the module comment); a hero banner is
// a wide composition instead. 11.7 owns final layout/crop decisions.
export const HOME_HERO_IMAGE = unsplashUrl("1612731486606-2614b4d74921", {
  w: 1600,
  h: 900,
});

export interface EditTile {
  image: string;
  label: string;
}

// The Edit: three tiles, each a filtered `/shop` link (no Collection model —
// see the epic's "Out of scope" decision), sourced at 4:5 like the product
// grid.
export const HOME_EDIT_TILES: EditTile[] = [
  {
    image: unsplashUrl("1668952135120-7d997b1b3778", { w: 800, h: 1000 }),
    label: "Womenswear",
  },
  {
    image: unsplashUrl("1515938736719-95b568dc8dd8", { w: 800, h: 1000 }),
    label: "Menswear",
  },
  {
    image: unsplashUrl("1763933687485-62fbfe15e73d", { w: 800, h: 1000 }),
    label: "Statement Pieces",
  },
];
