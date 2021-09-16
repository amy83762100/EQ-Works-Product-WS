import { Link } from "react-router-dom";
import classes from "./cards.module.scss";
import btnStyle from "../button/btn.module.scss";
import colors from "../../sass/variable.module.scss";
function Cards(props) {
  let type = props.type === "hourly" ? "Daily" : "Hourly";
  const textColor = props.err ? colors.redLight : colors.primary;
  function switchType() {
    type = type === "Hourly" ? "Daily" : "Hourly";
  }
  return (
    <main className={classes.cards} style={{ color: textColor }}>
      <Link to={`/${props.mode}${type}`} className={classes.btn}>
        {props.type && (
          <button
            className={`${btnStyle.btn} ${btnStyle.btn__color}`}
            onClick={switchType}
            content={`Switch To ${type}`}
          >
            {`Switch To ${type}`}
          </button>
        )}
      </Link>
      {props.children}
    </main>
  );
}
export default Cards;
