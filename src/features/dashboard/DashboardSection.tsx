export const DashboardSection = (props: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-md border bg-card p-4 shadow-sm sm:p-5">
    <div className="max-w-4xl">
      <div className="text-lg font-semibold tracking-normal">{props.title}</div>

      <div className="mb-5 text-sm font-medium leading-5 text-muted-foreground">
        {props.description}
      </div>

      {props.children}
    </div>
  </section>
);
