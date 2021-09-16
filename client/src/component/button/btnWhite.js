import classes from "./btn.module.scss";
function BtnWhite(props) {
  function changeColor(event) {
    let x = event.pageX - event.target.offsetLeft;
    let y = event.pageY - (props.offsetTop || 0) - event.target.offsetTop;
    event.target.style.setProperty("--x", x + "px");
    event.target.style.setProperty("--y", y + "px");
  }
  function changeBackground(event) {
    event.target.style.backgroundColor = props.backgroundColor;
  }
  function resumeBackground(event) {
    event.target.style.backgroundColor = "#fff";
  }
  return (
    <button
      className={`${classes.btn} ${classes.btn__white}`}
      onMouseMove={changeColor}
      onMouseOver={changeBackground}
      onMouseOut={resumeBackground}
    >
      <span>{props.content}</span>
    </button>
  );
}
export default BtnWhite;
