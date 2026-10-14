/** Nothing on the public site links to the editor. You reach it by typing this address yourself.
 *  Change it with VITE_ADMIN_PATH in frontend/.env (default: /admin). */
const raw = import.meta.env.VITE_ADMIN_PATH || "/admin";
export const ADMIN_PATH = "/" + (raw.replace(/^\/+|\/+$/g, "") || "admin");
