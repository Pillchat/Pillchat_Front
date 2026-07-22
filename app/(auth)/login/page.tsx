import { LoginPageClient } from "./LoginPageClient";

// Keep the authentication entry point out of the Full Route Cache. This page
// can gain new login methods independently of the rest of the application.
export const dynamic = "force-dynamic";

const LoginPage = () => <LoginPageClient />;

export default LoginPage;
