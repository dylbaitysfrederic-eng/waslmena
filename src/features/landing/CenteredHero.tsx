export const CenteredHero = (props: {
  banner: React.ReactNode;
  title: React.ReactNode;
  description: string;
  buttons: React.ReactNode;
}) => (
  <>
    <div className="text-center">{props.banner}</div>

    <div className="mt-3 text-center text-4xl font-semibold tracking-normal sm:text-5xl">
      {props.title}
    </div>

    <div className="mx-auto mt-5 max-w-screen-md text-center text-base leading-7 text-muted-foreground sm:text-lg">
      {props.description}
    </div>

    <div className="mt-7 flex justify-center gap-3 max-sm:flex-col">
      {props.buttons}
    </div>
  </>
);
