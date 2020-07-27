import React, { Component } from 'react';
import Chart from 'chart.js';
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTools } from '@fortawesome/free-solid-svg-icons';

import '../css/MachineInfoFull.css';

Chart.defaults.global.defaultFontFamily = 'Nunito';
Chart.defaults.global.defaultFontSize = 12;

class MachineInfoFull extends Component {
  indicatorsCanvas;
  lineChart;

  // constructor(props) {
  //   super(props);
  // }

  // componentDidMount() {
  //   this.indicatorsCanvas = document.querySelector('#indicators-canvas');
  // }

  componentDidUpdate() {
    if (!Object.keys(this.props.machine).length) return 0;

    if (!this.indicatorsCanvas) this.indicatorsCanvas = document.querySelector('#indicators-canvas');

    let dataSets = {
      volt: {
        label: 'Напряжение',
        lineTension: 0,
        fill: false,
        borderColor: '#EF5350',
        data: this.props.machine.telemetry.volt,
      },
      rotate: {
        label: 'Вращение',
        lineTension: 0,
        fill: false,
        borderColor: '#26A69A',
        data: this.props.machine.telemetry.rotate,
      },
      pressure: {
        label: 'Давление',
        lineTension: 0,
        fill: false,
        borderColor: '#FFCA28',
        data: this.props.machine.telemetry.pressure,
      },
      vibration: {
        label: 'Вибрация',
        lineTension: 0,
        fill: false,
        borderColor: '#29B6F6',
        data: this.props.machine.telemetry.vibration,
      },
    };

    let timeNow = Date.now();
    let labels = [];

    for (let i = 0; i < dataSets.volt.data.length; i++) {
      let date = new Date(timeNow);

      labels.push(`${date.toLocaleTimeString(navigator.language, { hour: `2-digit` })}:00:00`);

      timeNow -= 1000 * 60 * 60;
    }

    let indicatorsData = {
      labels: [],
      datasets: Object.values(dataSets),
    };

    for (let i = dataSets.volt.data.length - 1; i >= 0; i--) {
      indicatorsData.labels.push(labels[i]);
    }

    if (!this.lineChart) {
      this.lineChart = new Chart(this.indicatorsCanvas, {
        type: 'line',
        data: indicatorsData,
        options: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              fontColor: 'black',
            },
          },
        },
      });
    } else {
      this.lineChart.data = indicatorsData;

      this.lineChart.update();
    }
  }

  render() {
    if (!Object.keys(this.props.machine).length) return <p style={{ padding: '30px' }}>Выберите станок для отображения полной информации</p>;

    let componentsInfo = [];

    this.props.machine.components.forEach((component) => {
      if (component.prob < 0.25) {
        componentsInfo.push(['#388e3c', 0]);
      } else if (component.prob >= 0.25 && component.prob < 0.75) {
        componentsInfo.push(['#FFB300', 1]);
      } else {
        componentsInfo.push(['#d32f2f', 2]);
      }
    });

    let warningMessage = [];

    componentsInfo.forEach((component, componentIndex) => {
      if (component[1] === 1) {
        warningMessage.push(`провести профилактику компонента №${componentIndex + 1}`);
      } else if (component[1] === 2) {
        warningMessage.push(`заменить компонент №${componentIndex + 1}`);
      }
    });

    return (
      <div className="machine-info-full">
        <div className="machine-info-full-h">Информация о станке №{this.props.machine.id}</div>
        <div className="machine-info-full-add">
          model {this.props.machine.model}, возраст станка: {this.props.machine.age}
        </div>
        <div className="machine-info-full-p">Измеряемые параметры станка</div>
        <canvas id="indicators-canvas" height="100"></canvas>
        <div className="machine-info-full-p">Вероятность отказа компонентов в течении 12 часов</div>
        <div className="machine-info-full-components">
          {this.props.machine.components.map((component, componentIndex) => (
            <div className="machine-info-full-component" key={componentIndex}>
              <div className="machine-info-full-component-name">Компонент {componentIndex + 1}</div>
              <div className="machine-info-full-component-desc">Дней с последней замены: {component.days.toFixed(0)}</div>
              <div className="machine-info-full-component-prob prob-good" style={{ color: componentsInfo[componentIndex][0] }}>
                {component.prob.toFixed(3)}
              </div>
            </div>
          ))}
        </div>
        {warningMessage.length > 0 && (
          <>
            <div className="machine-info-full-warning">
              <span className="warn-sign">
                <FontAwesomeIcon icon={faExclamationTriangle} color={`#FFB300`} size={`2x`} />
              </span>
              <p>Рекомендуем: {warningMessage.join('; ')}.</p>
            </div>
            {this.props.user.role !== 'productionForeman' && (
              <Link
                to="/dashboard/requests"
                className="button"
                onClick={() => {
                  this.props.generateRequest(`Для станка №${this.props.machine.id}: ${warningMessage.join('; ')}.`);
                }}
              >
                <FontAwesomeIcon icon={faTools} />
                <span>Сформировать заявку на ТОиР</span>
              </Link>
            )}
          </>
        )}
      </div>
    );
  }
}

export default MachineInfoFull;
