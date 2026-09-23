import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  // Google/Supabase append error params instead of `code` when the OAuth
  // flow itself failed (denied consent, disallowed_useragent, ...) — those
  // used to be silently dropped, redirecting to /app unauthenticated with no
  // sign anything went wrong.
  if (oauthError) {
    return NextResponse.redirect(`${origin}/get-started/user?authError=${encodeURIComponent(oauthError)}`);
  }

  const response = NextResponse.redirect(`${origin}/app`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  let exchangeError: string | undefined;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error?.message;
  } else if (tokenHash && type) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });
    exchangeError = error?.message;
  }

  if (exchangeError) {
    response.headers.set(
      "Location",
      `${origin}/get-started/user?authError=${encodeURIComponent(exchangeError)}`
    );
  }

  return response;
}
