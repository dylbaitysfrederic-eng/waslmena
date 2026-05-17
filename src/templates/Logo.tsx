import { AppConfig } from '@/utils/AppConfig';

export const Logo = (props: {
  isTextHidden?: boolean;
}) => (
  <div className="flex items-center gap-2 text-xl font-semibold tracking-normal">
    <svg
      className="size-9"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="10" fill="#111827" />
      <path
        d="M10 19.4c3.9-8.1 12.1-8.1 16 0"
        stroke="#F4D06F"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M11.5 23.5h13"
        stroke="#F8FAFC"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M18 10.5v3.8"
        stroke="#34D399"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="18" cy="8.5" r="1.8" fill="#34D399" />
    </svg>
    {!props.isTextHidden && AppConfig.name}
  </div>
);
