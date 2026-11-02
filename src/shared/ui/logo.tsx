import { useId } from "react";

type Props = { size?: number };

/** The Geomind mark: rock strata crossed by a well, warm at depth and cool at the surface. */
export function Logo({ size = 24 }: Props) {
  const gradient = `${useId()}-depth`;
  const stroke = `url(#${gradient})`;
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      className="flex-none"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="2" x2="0" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--hot)" />
        </linearGradient>
      </defs>
      <path d="M2.5 8.5c4-2.5 7-2.5 9.5 0s5.5 2.5 9.5 0" stroke={stroke} strokeWidth="2" />
      <path d="M2.5 14c4-2.5 7-2.5 9.5 0s5.5 2.5 9.5 0" stroke={stroke} strokeWidth="2" />
      <path d="M2.5 19.5c4-2.5 7-2.5 9.5 0s5.5 2.5 9.5 0" stroke={stroke} strokeWidth="2" />
      <path d="M12 2v20" stroke={stroke} strokeWidth="2.4" />
    </svg>
  );
}
