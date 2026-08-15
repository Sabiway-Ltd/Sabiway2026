declare module "js-cookie" {
  type CookieAttributes = {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  };

  const Cookies: {
    get(name: string): string | undefined;
    set(name: string, value: string, attributes?: CookieAttributes): string | undefined;
    remove(name: string, attributes?: CookieAttributes): void;
  };

  export default Cookies;
}
