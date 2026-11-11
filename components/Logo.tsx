import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className, ...props }) => {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.00052 5H16.3467V18.8462C16.3467 22.5281 13.3619 25.5128 9.68002 25.5128H6.50053V7.5C6.50053 6.11929 7.61981 5 9.00052 5ZM35.32 16.4872C31.6381 16.4872 28.6533 19.472 28.6533 23.1538V37H35.9995C37.3802 37 38.4995 35.8807 38.4995 34.5V16.4872H35.32ZM24.654 14.8462C20.9721 14.8462 17.9873 11.8614 17.9873 8.17949V5H36.0001C37.3808 5 38.5001 6.11929 38.5001 7.5V14.8462H24.654ZM6.5 34.5C6.5 35.8807 7.61929 37 9 37H27.0128V33.8205C27.0128 30.1386 24.0281 27.1538 20.3462 27.1538H6.5V34.5Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default Logo;
