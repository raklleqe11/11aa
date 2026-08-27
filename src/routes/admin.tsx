import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { HapApp } from "@/components/hap-app";
import { isAdminScreen } from "@/lib/hap-routes";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

/**
 * Persistent shell for every /admin screen: one iframe instance is mounted here
 * so navigating between admin routes never remounts (and never resets) the app.
 */
function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const screen = pathname.replace(/^\/admin\/?/, "").replace(/\/+$/, "");
  const valid = screen === "" || isAdminScreen(screen);

  return (
    <>
      {valid ? <HapApp path={pathname} title="Hap Admin" /> : null}
      <Outlet />
    </>
  );
}
