
function unsplashUrl(photoId: string, { w, h }: { w: number; h: number }) {
  return `https://images.unsplash.com/photo-${photoId}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;
}

export const HOME_HERO_IMAGE = unsplashUrl("1612731486606-2614b4d74921", {
  w: 1600,
  h: 900,
});

export interface EditTile {
  image: string;
  label: string;
}

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
