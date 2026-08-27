import { useEffect } from "react";

const SITE_NAME = "StyleSense AI";

/**
 * Sets `document.title` for the current route. React Router v8 here runs in
 * declarative mode (`<Routes>`/`<Route>` JSX, no data router), so there is no
 * route `meta`/`handle` export to hang titles off of, and pulling in a head
 * library for this one concern isn't worth the dependency.
 */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
