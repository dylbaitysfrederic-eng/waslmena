export const TitleBar = (props: {
  title: React.ReactNode;
  description?: React.ReactNode;
}) => (
  <header className="mb-6">
    <div className="text-2xl font-semibold tracking-normal">{props.title}</div>

    {props.description && (
      <div className="mt-1 text-sm font-medium leading-5 text-muted-foreground">
        {props.description}
      </div>
    )}
  </header>
);
