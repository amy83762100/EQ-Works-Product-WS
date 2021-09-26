import { useState, useEffect, useRef } from "react";
import classes from "./table.module.scss";
import chartColors from "../../sass/variable.module.scss";
import btnStyle from "../button/btn.module.scss";
function Table({ data, passSearchValue, searchValue }) {
  const keys = Object.keys(data[0]);
  const formRef = useRef(null);
  const defaultInput = () => {
    let values = { date: null };
    keys.slice(1).forEach((key) => (values[key] = [null, "greater"]));
    return values;
  };
  const [input, setInput] = useState(defaultInput);

  const calValue = keys[1] === "hour" ? 2 : 1;
  let sum = new Array(keys.length - calValue).fill(0);

  const formatDate = (date) =>
    `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  const handleOnChangeDate = (value) => {
    let values = { ...input };
    values["date"] = value;
    setInput(values);
    // passSearchValue(e.target.value);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    let values = { date: e.target.elements[0].value };
    keys.slice(1).forEach((key, i) => {
      values[key] = [e.target.elements[`searchBy${key}`].value, input[key][1]];
    });
    setInput(values);
  };
  const handleGtLtSwitch = (key, content) => {
    let values = { ...input };
    values[key][1] = content === "greater" ? "less" : "greater";
    setInput(values);
  };
  const tableRowValue = (values, i) => {
    let row = [];
    for (let [key, value] of Object.entries(values)) {
      if (key === "date") {
        value = formatDate(new Date(value));
        if (input[key] && !value.includes(input[key])) break;
      } else {
        if (
          input[key][0] &&
          ((input[key][1] === "greater" && +value < +input[key][0]) ||
            (input[key][1] === "less" && +value > +input[key][0]))
        )
          break;
      }
      row.push(value);
    }
    if (row.length < keys.length) return;
    row = row.map((value, i) => {
      if (i >= calValue) {
        if (value % 1 !== 0) value = (+value).toFixed(2);
        sum[i - calValue] += +value;
        value = new Intl.NumberFormat().format(value);
      }
      return <td key={i}>{value}</td>;
    });
    return (
      <tr
        key={i}
        style={{
          backgroundColor:
            new Date(row.date).getDate() % 2
              ? chartColors.quaternaryLight
              : chartColors.quinaryLight,
        }}
      >
        {row}
      </tr>
    );
  };
  // useEffect(() => {
  //   handleOnChangeDate(searchValue);
  // }, [searchValue]);
  useEffect(() => setInput(defaultInput), [data]);

  useEffect(() => {
    const searchResultEl = document.getElementById("result");
    const tbodyEl = document.querySelector("tbody");
    if (Object.keys(input).length === keys.length)
      if (!tbodyEl.textContent) {
        searchResultEl.textContent = `No data found`;
        searchResultEl.style.color = `${chartColors.redLight}`;
      } else {
        searchResultEl.textContent = `Found ${tbodyEl.rows.length} results`;
        searchResultEl.style.color = `${chartColors.tertiary}`;
      }
  }, [input]);
  if (Object.keys(input).length !== keys.length) return "";
  return (
    <div className={classes.table}>
      <form ref={formRef} className={classes.form} onSubmit={handleSubmit}>
        <div className={classes.form__search}>
          <div>
            <label htmlFor="searchByDate">Search by date:</label>
            <input
              id="searchByDate"
              type="text"
              placeholder="yyyy-mm-dd"
              onChange={(e) => handleOnChangeDate(e.target.value)}
            ></input>
          </div>

          {keys.slice(1).map((title, i) => (
            <div key={i}>
              <label htmlFor={`searchBy${title}`}>Search by {title}:</label>
              <input
                name={`searchBy${title}`}
                id={`searchBy${title}`}
                type="number"
                min="0"
              />

              <button
                className={`${btnStyle.btn} ${btnStyle.btn__color} ${classes.form__btnGtLt}`}
                name={title}
                type="button"
                onClick={(e) =>
                  handleGtLtSwitch(e.target.name, e.target.textContent)
                }
                content={input[title][1]}
              >
                {input[title][1]}
              </button>
            </div>
          ))}
        </div>
        <span id="result"></span>
        <div>
          <button
            className={`${btnStyle.btn} ${btnStyle.btn__color} ${classes.form__submit}`}
            type="submit"
            content="Search"
          >
            Search
          </button>
          <button
            className={`${btnStyle.btn}  ${classes.form__submit}`}
            type="reset"
            onClick={() => setInput(defaultInput)}
          >
            Reset
          </button>
        </div>
      </form>
      <div className={classes.container}>
        <table>
          <thead>
            <tr>
              {Object.keys(data[0]).map((title, i) => (
                <th key={i}>{title.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>{data.slice(1).map((row, i) => tableRowValue(row, i))}</tbody>
          <tfoot>
            <tr>
              <td colSpan={calValue}>Total</td>
              {sum.map((d, i) => (
                <td key={i}>{new Intl.NumberFormat().format(d)}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
export default Table;
