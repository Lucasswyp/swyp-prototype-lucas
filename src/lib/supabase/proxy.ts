import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_BUSINESS_AUTH_ROUTES = ["/business/login", "/business/signup"];
const PUBLIC_USER_AUTH_ROUTES = ["/get-started", "/get-started/user"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isBusinessAuthRoute = PUBLIC_BUSINESS_AUTH_ROUTES.includes(path);
  const isUserAuthRoute = PUBLIC_USER_AUTH_ROUTES.includes(path);
  const isBusinessRoute = path.startsWith("/business") && !isBusinessAuthRoute;
  const isAppRoute = path.startsWith("/app");

  if (isBusinessRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/business/login";
    return NextResponse.redirect(url);
  }

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/get-started/user";
    return NextResponse.redirect(url);
  }

  if ((isBusinessAuthRoute || isUserAuthRoute) && user) {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    const url = request.nextUrl.clone();
    url.pathname = business ? "/business" : "/app";
    return NextResponse.redirect(url);
  }

  return response;
}
