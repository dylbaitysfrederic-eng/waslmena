export const FeatureCard = (props: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="wasl-card p-5">
    <div className="size-10 rounded-md bg-emerald-50 p-2 text-emerald-700 [&_svg]:stroke-2">
      {props.icon}
    </div>

    <div className="mt-3 text-base font-semibold">{props.title}</div>

    <div className="my-3 w-8 border-t border-border" />

    <div className="mt-2 text-sm leading-6 text-muted-foreground">{props.children}</div>
  </div>
);
