import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie, faUserCog, faSignOutAlt, faTools, faTachometerAlt } from '@fortawesome/free-solid-svg-icons';

import '../css/Dashboard.css';

class Dashboard extends Component {
  render() {
    if (!Object.keys(this.props.user).length) {
      return <Redirect to="/auth" />;
    }

    let requestsLength = 0;

    if (this.props.user.role === 'repairWorker') {
      this.props.requests.forEach((request) => {
        if (request.status === 'Назначено') requestsLength++;
      });
    } else if (this.props.user.role === 'repairManager') {
      this.props.requests.forEach((request) => {
        if (request.status === 'В рассмотрении') requestsLength++;
      });
    }

    return (
      <div className="dashboard">
        <div className="header">
          <div className="header-left">
            <div className="header-title">Сигматика ИС ТОиР</div>
            <div className="header-date">25 апреля 2020 20:54</div>
          </div>
          <div className="header-user">
            <div className="user-name">{this.props.user.name}</div>
            <div className="user-photo">
              {this.props.user.role === 'productionForeman' || this.props.user.role === 'productionManager' ? (
                <FontAwesomeIcon icon={faUserTie} color={this.props.user.color} size={`2x`} />
              ) : (
                <FontAwesomeIcon icon={faUserCog} color={this.props.user.color} size={`2x`} />
              )}
            </div>
            <div className="user-sign-out" onClick={this.props.signOut}>
              <FontAwesomeIcon icon={faSignOutAlt} color={`#999`} size={`2x`} />
            </div>
          </div>
        </div>
        <div className="menu">
          {this.props.user.role !== 'repairWorker' && this.props.user.role !== 'repairManager' && (
            <div className={`menu-item${this.props.section === 'machines' ? ' active' : ''}`}>
              <Link to="/dashboard/machines">
                <FontAwesomeIcon icon={faTachometerAlt} color="#666" />
                <span>Состояние оборудования</span>
              </Link>
            </div>
          )}
          {this.props.user.role !== 'productionForeman' && (
            <div className={`menu-item${this.props.section === 'requests' ? ' active' : ''}`}>
              <Link to="/dashboard/requests">
                <FontAwesomeIcon icon={faTools} color="#666" />
                <span>Заявки на ТОиР</span>
              </Link>
              {(this.props.user.role === 'repairManager' || this.props.user.role === 'repairWorker') && requestsLength > 0 && (
                <div className="menu-item-badge">{requestsLength}</div>
              )}
            </div>
          )}
        </div>
        {this.props.component && this.props.component}
      </div>
    );
  }
}

export default Dashboard;
