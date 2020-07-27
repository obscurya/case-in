import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faSyncAlt, faCompressArrowsAlt, faWater, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import MachineInfoFull from './MachineInfoFull';

import '../css/Machines.css';

class Machines extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedMachine: {},
    };
  }

  render() {
    return (
      <div className="main">
        <div className="main-left">
          <div className="machines-list">
            {this.props.machines.map((machine, machineIndex) => (
              <div
                className={`machine-item machine-info-min${this.state.selectedMachine.id === machineIndex + 1 ? ' machine-item-active' : ''}`}
                key={machineIndex}
                onClick={() => {
                  this.setState({ selectedMachine: machine });
                }}
              >
                {machine.color && (
                  <div className="machine-info-min-warning">
                    <FontAwesomeIcon icon={faExclamationTriangle} color={machine.color} size="sm" />
                  </div>
                )}
                <div className="machine-info-min-model">
                  model {machine.model}, id {machine.id}
                </div>
                <div className="machine-info-min-indicators">
                  <div className="machine-info-min-indicators-item">
                    <FontAwesomeIcon icon={faBolt} color={`#EF5350`} />
                    <span>{machine.telemetry.volt.slice(-1)[0].toFixed(1)}</span>
                  </div>
                  <div className="machine-info-min-indicators-item">
                    <FontAwesomeIcon icon={faSyncAlt} color={`#26A69A`} />
                    <span>{machine.telemetry.rotate.slice(-1)[0].toFixed(1)}</span>
                  </div>
                  <div className="machine-info-min-indicators-item">
                    <FontAwesomeIcon icon={faCompressArrowsAlt} color={`#FFCA28`} />
                    <span>{machine.telemetry.pressure.slice(-1)[0].toFixed(1)}</span>
                  </div>
                  <div className="machine-info-min-indicators-item">
                    <FontAwesomeIcon icon={faWater} color={`#29B6F6`} />
                    <span>{machine.telemetry.vibration.slice(-1)[0].toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="main-right">
          <MachineInfoFull
            machine={this.state.selectedMachine}
            generateRequest={this.props.generateRequest}
            NN={this.props.NN}
            user={this.props.user}
          />
        </div>
      </div>
    );
  }
}

export default Machines;
