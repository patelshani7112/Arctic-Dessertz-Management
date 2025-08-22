import * as React from "react";

type P = React.SVGProps<SVGSVGElement>;
const S = (p: P) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    {...p}
  />
);

export const IconMenu = (p: P) => (
  <S {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </S>
);
export const IconClose = (p: P) => (
  <S {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </S>
);
export const IconHome = (p: P) => (
  <S {...p}>
    <path d="M3 12l9-9 9 9" />
    <path d="M9 21V9h6v12" />
  </S>
);
export const IconUsers = (p: P) => (
  <S {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </S>
);
export const IconMap = (p: P) => (
  <S {...p}>
    <path d="M20 6l-6-2-6 2-6-2v14l6 2 6-2 6 2V6z" />
    <path d="M8 8v12M16 4v12" />
  </S>
);
