import classes from "./table.module.scss";
import chartColors from "../../sass/variable.module.scss";
import { useState, useEffect } from "react";
function Table({ data, passSearchValue, searchValue }) {
  let backgroundColor, search;
  const [input, setInput] = useState(null);
  const keys = Object.keys(data[0]);
  const calValue = keys[1] === "hour" ? 2 : 1;
  let sum = new Array(keys.length - calValue).fill(0);
  useEffect(() => {
    setInput(searchValue);
  }, [searchValue]);
  useEffect(() => {
    const searchResultEl = document.getElementById("result");
    if (!document.querySelector("tbody").textContent) {
      searchResultEl.textContent = `No data found at ${input}`;
      searchResultEl.style.color = `${chartColors.redLight}`;
    }
  });

  const formatDate = (date) =>
    `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  const getSearchValue = (e) => {
    setInput(e.target.value);
    passSearchValue(e.target.value);
  };

  return (
    <div className={classes.table}>
      <form className={classes.form}>
        <div>
          <label htmlFor="searchByDate">Search by date:</label>
          <input
            id="searchByDate"
            type="date"
            onChange={getSearchValue}
          ></input>
        </div>
        <span id="result"></span>
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
          <tbody>
            {data.slice(1).map((d, i) => (
              <tr key={i}>
                {Object.values(d).map((value, i) => {
                  if (i === 0) {
                    search = false;
                    backgroundColor =
                      new Date(value).getDate() % 2
                        ? chartColors.quaternaryLight
                        : chartColors.quinaryLight;
                    value = formatDate(new Date(value));
                    if (input && input !== value) search = true;
                  } else {
                    if (value % 1 !== 0) value = (+value).toFixed(2);
                    if (!search && i >= calValue) sum[i - calValue] += +value;
                    value = new Intl.NumberFormat().format(value);
                  }
                  return search ? null : (
                    <td style={{ backgroundColor: backgroundColor }} key={i}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
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
