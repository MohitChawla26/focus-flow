import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key) return NextResponse.next();
  let response=NextResponse.next({request});
  const supabase=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(cookies){cookies.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
  const {data}=await supabase.auth.getClaims();
  const isAuthRoute=/^\/(login|signup|forgot-password)/.test(request.nextUrl.pathname);
  if(!data?.claims&&!isAuthRoute){const next=request.nextUrl.clone();next.pathname="/login";return NextResponse.redirect(next)}
  if(data?.claims&&isAuthRoute){const next=request.nextUrl.clone();next.pathname="/";return NextResponse.redirect(next)}
  return response;
}
export const config={matcher:["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]};
