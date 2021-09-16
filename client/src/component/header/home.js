import { Link } from "react-router-dom";
import BtnWhite from "../button/btnWhite";
import classes from "./home.module.scss";
import chartColors from "../../sass/variable.module.scss";
function Home() {
  return (
    <header className={classes.home}>
      <Link to="/eventsHourly">
        <BtnWhite content="Events" backgroundColor={chartColors.primary} />
      </Link>
      <Link to="/statsHourly">
        <BtnWhite content="Stats" backgroundColor={chartColors.secondary} />
      </Link>
      <Link to="/poi">
        <BtnWhite content="POI" backgroundColor={chartColors.tertiary} />
      </Link>
    </header>
  );
}
export default Home;
