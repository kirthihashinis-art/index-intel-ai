import { PageShell, UserNav } from "@/components/user-nav";

export function ReaderPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string | undefined;
  actions?: React.ReactNode | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <UserNav />
      <PageShell title={title} description={description} actions={actions}>
        {children}
      </PageShell>
    </div>
  );
}
