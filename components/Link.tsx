export type LinkProps = {
  text?: string;
  href?: string;
  children?: preact.ComponentChild;
  className?: string;
  direct?: boolean;
};

export const Link: preact.FunctionComponent<LinkProps> = ({
  text,
  children,
  href,
  className,
  direct
}) => (
  <a
    className={className}
    rel="noopener noreferrer"
    target={
      direct
      ? ""
      : "_blank"
    }
    href={href ?? "#"}
  >
    {
      !text
      ? <></>
      : text
    }
    {
      !children
      ? <></>
      : children
    }
  </a>
);
