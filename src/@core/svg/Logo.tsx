import type { SVGAttributes } from 'react'

interface LogoProps extends SVGAttributes<SVGElement> {
  fillColor: string;
  strokeColor: string;
}

const Logo = ({ fillColor, strokeColor, ...props }: LogoProps) => {
  return (
    <svg version="1.1" viewBox="0 0 500 600" width="60" height="60" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        transform="translate(476,215)"
        d="m0 0h5v18l-5 74-1 10-5 3-19 7-36 12-28 9-1 24-1 9 36-12 38-12 9-3 1 1v11l-1 16-3 6-6 5-36 12-46 15-24 7-3-1 4-49 4-44 2-8 5-4 24-9 47-16 9-4 2-31-10 3-40 14-33 11h-1v-12l2-19 3-6 11-5 38-13 47-15z"
        fill={fillColor}
        stroke={strokeColor}
        stroke-width="10"
      />
      <path
        transform="translate(481,145)"
        d="m0 0h5v18l-2 9-6 8-5 4-14 6-28 9-26 8-29 10-11 6-11 9-7 8-7 12-5 13-2 9-2 34-5 102-2 20-10 8-14 8-7 1v-22l9-136 2-23 5-19 6-15 8-13 9-11 10-10 11-8 15-8 24-9 29-9 31-10z"
        fill={fillColor}
        stroke={strokeColor}
        stroke-width="10"
      />
    </svg>
  )
}

export default Logo
