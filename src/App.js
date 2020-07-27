import React, { Component } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import brain from 'brain.js';
import axios from 'axios';

import Dashboard from './components/Dashboard';
import Machines from './components/Machines';
import Requests from './components/Requests';
import Auth from './components/Auth';

import './App.css';

import dataNN from './NN.json';

class App extends Component {
  NN;

  constructor(props) {
    super(props);

    this.state = {
      user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {},
      machines: [],
      autoRequest: {},
      requests: [],
    };

    this.signIn = this.signIn.bind(this);
    this.signOut = this.signOut.bind(this);
    this.generateRequest = this.generateRequest.bind(this);
    this.removeAutoRequest = this.removeAutoRequest.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
    this.appointRequest = this.appointRequest.bind(this);
    this.doneRequest = this.doneRequest.bind(this);

    this.getRequestsFromDB = this.getRequestsFromDB.bind(this);
  }

  componentDidMount() {
    this.NN = new brain.NeuralNetwork();

    this.NN.fromJSON(dataNN);

    axios.get('/api/machines').then((res) => {
      const machines = res.data;

      axios.get('/api/ranges').then((res) => {
        const ranges = res.data;

        machines.forEach((machine, machineIndex) => {
          let input = [machine.model, machine.age].concat(machine.errors12h);

          machine.components.forEach((comp) => {
            input.push(comp.days);
          });

          for (let i = 0; i < 12; i++) {
            input.push(machine.telemetry.volt[i], machine.telemetry.rotate[i], machine.telemetry.pressure[i], machine.telemetry.vibration[i]);
          }

          let j = 0;

          input.forEach((item, itemIndex) => {
            if (itemIndex === 0) {
              input[itemIndex] = (4 - item) / (4 - 1);
            } else if (itemIndex === 1) {
              input[itemIndex] = item / 20;
            } else if (itemIndex > 1 && itemIndex <= 6) {
              input[itemIndex] = item / ranges.errMax;
            } else if (itemIndex > 6 && itemIndex <= 10) {
              input[itemIndex] = item / ranges.compDaysMax;
            } else {
              if (j === 0) {
                input[itemIndex] = (ranges.volt.max - item) / (ranges.volt.max - ranges.volt.min);
              } else if (j === 1) {
                input[itemIndex] = (ranges.rotate.max - item) / (ranges.rotate.max - ranges.rotate.min);
              } else if (j === 2) {
                input[itemIndex] = (ranges.pressure.max - item) / (ranges.pressure.max - ranges.pressure.min);
              } else if (j === 3) {
                input[itemIndex] = (ranges.vibration.max - item) / (ranges.vibration.max - ranges.vibration.min);
              }

              j++;

              if (j === 4) j = 0;
            }
          });

          let probs = this.NN.run(input);

          probs.forEach((prob, probIndex) => {
            machines[machineIndex].components[probIndex].prob = prob;

            if (prob > 0.75) {
              machines[machineIndex].color = '#d32f2f';
            } else if (prob >= 0.25 && prob < 0.75) {
              machines[machineIndex].color = '#FFB300';
            }
          });
        });

        this.setState({ machines }, () => {
          this.getRequestsFromDB();
        });
      });
    });
  }

  getRequestsFromDB() {
    axios.get('/api/requests').then((res) => {
      this.setState({ requests: res.data.reverse() });
    });
  }

  signIn(userRole) {
    let user = { role: userRole };

    switch (userRole) {
      case 'productionForeman':
        user.name = 'Начальник цеха';
        user.color = '#666';

        break;
      case 'productionManager':
        user.name = 'Начальник участка';
        user.color = '#999';

        break;
      case 'repairManager':
        user.name = 'Начальник ремонтной службы';
        user.color = '#666';

        break;
      case 'repairWorker':
        user.name = 'Ремонтный рабочий';
        user.color = '#999';

        break;
      default:
        return 0;
    }

    localStorage.setItem('user', JSON.stringify(user));

    this.setState({ user });
  }

  signOut() {
    localStorage.removeItem('user');

    this.setState({ user: {} });
  }

  generateRequest(content) {
    let date = new Date();
    let year = date.getFullYear();
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let day = ('0' + date.getDate()).slice(-2);
    let hour = date.toLocaleTimeString(navigator.language, {
      hour: `2-digit`,
    });

    let autoRequest = {
      _id: '',
      content,
      date: Date.parse(`${year}-${month}-${day} ${hour}:00:00`) + 1000 * 60 * 60,
      status: 'В рассмотрении',
      plan: '',
    };

    this.setState({ autoRequest });
  }

  removeAutoRequest() {
    this.setState({ autoRequest: {} });
  }

  sendRequest(request) {
    delete request._id;

    axios.post('/api/requests/add', request).then((res) => {
      this.getRequestsFromDB();
    });
  }

  renderDashboard(section, component) {
    return <Dashboard user={this.state.user} signOut={this.signOut} requests={this.state.requests} component={component} section={section} />;
  }

  appointRequest(request, plan) {
    request.plan = plan;
    request.status = 'Назначено';

    axios.post('/api/requests/update', request).then(() => {
      this.getRequestsFromDB();
    });
  }

  doneRequest(request) {
    request.status = 'Выполнено';

    axios.post('/api/requests/update', request).then(() => {
      this.getRequestsFromDB();
    });
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route
            path="/dashboard"
            render={({ match: { url } }) => (
              <>
                <Route path={`${url}/`} exact render={() => this.renderDashboard()} />
                <Route
                  path={`${url}/machines`}
                  render={() =>
                    this.renderDashboard(
                      'machines',
                      <Machines
                        machines={this.state.user.role === 'productionForeman' ? this.state.machines : this.state.machines.slice(0, 25)}
                        generateRequest={this.generateRequest}
                        NN={this.NN}
                        user={this.state.user}
                      />
                    )
                  }
                />
                <Route
                  path={`${url}/requests`}
                  render={() =>
                    this.renderDashboard(
                      'requests',
                      <Requests
                        machines={this.state.machines.slice(0, 25)}
                        user={this.state.user}
                        autoRequest={this.state.autoRequest}
                        removeAutoRequest={this.removeAutoRequest}
                        sendRequest={this.sendRequest}
                        requests={this.state.requests}
                        appointRequest={this.appointRequest}
                        doneRequest={this.doneRequest}
                      />
                    )
                  }
                />
              </>
            )}
          />
          <Route path="/auth">
            <Auth user={this.state.user} signIn={this.signIn} />
          </Route>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
