// 쿠키 이름만 따로 둔다. middleware 는 Edge 런타임에서 돌기 때문에
// DB 나 node:crypto 를 끌어오는 lib/session.ts 를 import 하면 안 된다.
export const SESSION_COOKIE = "pds_session";
export const SESSION_DAYS = 7;
