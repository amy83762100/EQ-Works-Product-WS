import { Link } from "react-router-dom";
import classes from "./nav.module.scss";
import logo from "../../img/logo.png";
function Nav() {
  return (
    <nav className={classes.nav}>
      <div className={classes["nav__logo"]}>
        <Link to="/">
          <img src={logo} alt="EQ Works Logo"></img>
        </Link>
        <span> Welcome to EQ Works 😎</span>
      </div>
      <ul className={classes.menu}>
        <li>
          <Link to="/eventsHourly" className={classes.menu__link}>
            Events
          </Link>
        </li>
        <li>
          <Link to="/statsHourly" className={classes.menu__link}>
            Stats
          </Link>
        </li>
        <li>
          <Link to="/poi" className={classes.menu__link}>
            POI
          </Link>
        </li>
      </ul>
    </nav>
  );
}
export default Nav;
