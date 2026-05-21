import React from 'react';

export const MessageState = (props: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  button: React.ReactNode;
}) => (
  <div className="wasl-card flex min-h-[420px] flex-col items-center justify-center p-5">
    <div className="size-12 rounded-full bg-muted p-3 [&_svg]:stroke-muted-foreground [&_svg]:stroke-2">
      {props.icon}
    </div>

    <div className="mt-3 text-center">
      <div className="text-lg font-semibold">{props.title}</div>
      <div className="mt-1 text-sm text-muted-foreground">
        {props.description}
      </div>

      <div className="mt-5">{props.button}</div>
    </div>
  </div>
);
