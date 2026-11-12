declare module "*.png" {
  const value: number;
  export default value;
}

declare module "*.jpg" {
  const value: number;
  export default value;
}

declare module "*.css";

declare module "react-dom" {
  import type { ReactNode } from "react";
  export function createPortal(children: ReactNode, container: Element): ReactNode;
}
