import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// "/api/analyze" は未ログインでも使える方針のため対象外(ログイン時の自動保存は
// route.ts内でgetServerSessionにより判定している)。
// "/api/records" (履歴一覧)はログイン必須の機能なのでミドルウェアでも保護する。
export const config = {
  matcher: ["/api/records/:path*"],
};
