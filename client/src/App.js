import { Route, Switch } from "react-router-dom";
import { Fragment } from "react";
import Nav from "./component/header/nav";
import Events from "./component/events/events";
import Stats from "./component/stats/stats";

import "./App.module.scss";
import POI from "./component/poi/poi";
import Home from "./component/header/home";

function App() {
  return (
    <Fragment>
      <Switch>
        <Route path="/" exact={true}>
          <Nav />
          <Home />
        </Route>
        <Route path="/eventsHourly">
          <Nav />
          <Events type="hourly" />
        </Route>
        <Route path="/eventsDaily">
          <Nav />
          <Events type="daily" />
        </Route>
        <Route path="/statsHourly">
          <Nav />
          <Stats type="hourly" />
        </Route>
        <Route path="/statsDaily">
          <Nav />
          <Stats type="daily" />
        </Route>
        <Route path="/poi">
          <Nav />
          <POI />
        </Route>
      </Switch>
    </Fragment>
  );
}

export default App;
