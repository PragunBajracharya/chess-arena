// Not a client module: the root layout (a Server Component) imports this.

export const PREFS_STORAGE_KEY = "chess-arena:prefs";

/**
 * Runs in <head> before the page paints, so a light-theme player never sees a
 * dark flash. Keep it tiny and dependency-free.
 */
export const themeBootScript = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFS_STORAGE_KEY,
)})||"{}");var t=p.theme||"dark";if(t==="system")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";var d=document.documentElement;d.dataset.theme=t;d.dataset.board=p.boardTheme||"walnut";}catch(e){}})();`;
