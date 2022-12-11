import {
  deleteCookie as stdDeleteCookie,
  getCookies as stdGetCookie,
  setCookie as stdSetCookie,
} from "std/http/cookie.ts";

export const getAuthCookie = (headers: Headers): string => {
  const cookie = stdGetCookie(headers) as { auth: string };
  return cookie.auth;
};

type SupabaseCookies = { sbToken?: string, sbRefresh?: string };
export const getSupabaseCookies = (headers: Headers): SupabaseCookies => {
  const cookie = stdGetCookie(headers) as SupabaseCookies;
  return {
    sbToken: cookie.sbToken,
    sbRefresh: cookie.sbRefresh
  };
}

export const setAuthCookie = (
  headers: Headers,
  value: string,
): boolean => {
  stdSetCookie(
    headers,
    {
      name: "auth",
      value,
      maxAge: 120000,
      sameSite: "Lax", // this is important to prevent CSRF attacks
      domain: location.origin,
      path: "/",
      secure: true,
    },
  );

  return true;
};

export const deleteCookie = (headers: Headers, name: string, domain: string) => {
  stdDeleteCookie(headers, name, {
    path: "/",
    domain,
  });

  return true;
};

export const deleteAuthCookie = (headers: Headers) => {
  deleteCookie(headers, "auth", location.origin);
  
  return true;
}
