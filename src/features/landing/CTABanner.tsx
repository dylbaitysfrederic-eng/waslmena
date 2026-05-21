export const CTABanner = (props: {
  title: string;
  description: string;
  buttons: React.ReactNode;
}) => (
  <div className="wasl-card bg-zinc-950 px-5 py-8 text-center text-white sm:px-6">
    <div className="text-2xl font-semibold">
      {props.title}
    </div>

    <div className="mt-2 text-sm leading-6 text-zinc-300 sm:text-base">
      {props.description}
    </div>

    <div className="mt-6">{props.buttons}</div>
  </div>
);
