import React from 'react';
import './StarBorder.css';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
};

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 6,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  return (
    <Component
      className={`star-border-container ${className}`}
      {...rest}
      style={{
        padding: `${thickness}px`,
        '--speed': speed,
        '--border-color': color,
        ...(rest as React.HTMLAttributes<HTMLElement>).style
      } as React.CSSProperties}
    >
      <div className="inner-content">{children}</div>
    </Component>
  );
};

export default StarBorder;
