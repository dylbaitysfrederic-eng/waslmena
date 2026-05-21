export const StickyBanner = (props: { children: React.ReactNode }) => (
  <div className="sticky top-0 z-50 bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground [&_a:hover]:text-primary-foreground/90 [&_a]:underline">
    {props.children}
  </div>
);
