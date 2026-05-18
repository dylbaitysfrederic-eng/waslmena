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
      <rect width="36" height="36" rx="8" fill="#0F172A" />
      <path
        d="M10 13h16"
        stroke="#F8FAFC"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M13 18h10"
        stroke="#34D399"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M10 23h16"
        stroke="#F4D06F"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M25 10.5l3 2.5-3 2.5"
        stroke="#F8FAFC"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    {!props.isTextHidden && AppConfig.name}
  </div>
);
