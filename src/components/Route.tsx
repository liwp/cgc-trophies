import TURNPOINTS from "../lib/turnpoints";
import Tip from "./Tip";

const routeNames = (route: string[]) =>
  route.map((code) => TURNPOINTS[code]?.name ?? code).join(" – ");

/** A task's turnpoint codes, with their names in a tooltip. */
const Route = ({
  route,
  className = "",
}: {
  route: string[];
  className?: string;
}) => (
  <Tip tip={routeNames(route)} className={className}>
    {route.join(" – ")}
  </Tip>
);

export default Route;
